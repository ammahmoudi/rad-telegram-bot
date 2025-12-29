import { getPrisma } from '@rad/shared';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: packId } = await params;
    const { language, messageType, content } = await request.json();

    const prisma = getPrisma();

    await prisma.packMessage.upsert({
      where: {
        packId_language_messageType: {
          packId,
          language: language as 'en' | 'fa',
          messageType: messageType as 'system_prompt' | 'welcome',
        },
      },
      update: {
        content,
        updatedAt: Date.now(),
      },
      create: {
        packId,
        language: language as 'en' | 'fa',
        messageType: messageType as 'system_prompt' | 'welcome',
        content,
        updatedAt: Date.now(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
