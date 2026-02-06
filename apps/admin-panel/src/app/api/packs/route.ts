import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma, getSystemConfig, setSystemConfig } from '@rad/shared';

// GET /api/packs - List all packs
export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    const packs = await prisma.characterPack.findMany({
      include: {
        messages: true,
        _count: {
          select: {
            userAssignments: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Convert BigInt fields to numbers for JSON serialization
    const serializedPacks = packs.map(pack => ({
      ...pack,
      createdAt: Number(pack.createdAt),
      updatedAt: Number(pack.updatedAt),
      messages: pack.messages.map(msg => ({
        ...msg,
        updatedAt: Number(msg.updatedAt),
      })),
    }));

    return NextResponse.json({ packs: serializedPacks });
  } catch (error) {
    console.error('Error fetching packs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/packs - Create new pack
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      name, 
      description, 
      aiModel,
      isDefault,
      systemPromptEn, 
      systemPromptFa,
      welcomeMessageEn,
      welcomeMessageFa,
      copyFromDefault 
    } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const prisma = getPrisma();
    const now = Date.now();

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.characterPack.updateMany({
        where: { isDefault: true },
        data: { isDefault: false, updatedAt: now },
      });
    }

    // Create the pack
    let resolvedModel = typeof aiModel === 'string' && aiModel.trim() ? aiModel.trim() : null;

    if (isDefault && !resolvedModel) {
      const systemDefault = await getSystemConfig('DEFAULT_AI_MODEL');
      resolvedModel = systemDefault?.trim() || null;
    }

    const pack = await prisma.characterPack.create({
      data: {
        name,
        description: description || null,
        aiModel: resolvedModel,
        isDefault: isDefault || false,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (isDefault && resolvedModel) {
      await setSystemConfig('DEFAULT_AI_MODEL', resolvedModel);
    }

    // Create messages if provided
    const messages = [];
    
    if (systemPromptEn) {
      messages.push({
        packId: pack.id,
        language: 'en' as const,
        messageType: 'system_prompt' as const,
        content: systemPromptEn,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    if (systemPromptFa) {
      messages.push({
        packId: pack.id,
        language: 'fa' as const,
        messageType: 'system_prompt' as const,
        content: systemPromptFa,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    if (welcomeMessageEn) {
      messages.push({
        packId: pack.id,
        language: 'en' as const,
        messageType: 'welcome' as const,
        content: welcomeMessageEn,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    if (welcomeMessageFa) {
      messages.push({
        packId: pack.id,
        language: 'fa' as const,
        messageType: 'welcome' as const,
        content: welcomeMessageFa,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (messages.length > 0) {
      await prisma.packMessage.createMany({ data: messages });
    }

    // If copyFromDefault and no messages provided, copy from default pack
    if (copyFromDefault && messages.length === 0) {
      const defaultPack = await prisma.characterPack.findFirst({
        where: { isDefault: true },
        include: { messages: true },
      });

      if (defaultPack && defaultPack.messages.length > 0) {
        await prisma.packMessage.createMany({
          data: defaultPack.messages.map((msg) => ({
            packId: pack.id,
            language: msg.language,
            messageType: msg.messageType,
            content: msg.content,
            createdAt: now,
            updatedAt: now,
          })),
        });
      }
    }

    return NextResponse.json({ id: pack.id, pack });
  } catch (error) {
    console.error('Error creating pack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
