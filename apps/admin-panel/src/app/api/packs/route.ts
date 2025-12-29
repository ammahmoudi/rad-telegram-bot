import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

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

    return NextResponse.json({ packs });
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
    const { name, description, copyFromDefault } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const prisma = getPrisma();
    const now = Date.now();

    // Create the pack
    const pack = await prisma.characterPack.create({
      data: {
        name,
        description: description || null,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    // If copyFromDefault, copy messages from default pack
    if (copyFromDefault) {
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
            updatedAt: now,
          })),
        });
      }
    }

    return NextResponse.json({ pack });
  } catch (error) {
    console.error('Error creating pack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
