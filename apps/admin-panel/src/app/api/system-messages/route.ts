import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messageType, fa, en } = await request.json();

    if (!messageType || !fa || !en) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['welcome', 'system_prompt', 'character'].includes(messageType)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const now = Date.now();

    // Upsert Persian version
    await prisma.systemMessage.upsert({
      where: {
        language_messageType: {
          language: 'fa',
          messageType,
        },
      },
      update: {
        content: fa,
        updatedAt: now,
      },
      create: {
        id: `${messageType}_fa_${now}`,
        language: 'fa',
        messageType,
        content: fa,
        isActive: true,
        updatedAt: now,
      },
    });

    // Upsert English version
    await prisma.systemMessage.upsert({
      where: {
        language_messageType: {
          language: 'en',
          messageType,
        },
      },
      update: {
        content: en,
        updatedAt: now,
      },
      create: {
        id: `${messageType}_en_${now}`,
        language: 'en',
        messageType,
        content: en,
        isActive: true,
        updatedAt: now,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving system message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
