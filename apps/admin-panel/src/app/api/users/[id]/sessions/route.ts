import { getPrisma } from '@rad/shared';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const prisma = getPrisma();

    const sessions = await prisma.chatSession.findMany({
      where: {
        telegramUserId: userId,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Convert BigInt timestamps to numbers for JSON serialization
    const serializedSessions = sessions.map(session => ({
      ...session,
      createdAt: Number(session.createdAt),
      updatedAt: Number(session.updatedAt),
    }));

    return NextResponse.json(serializedSessions);
  } catch (error) {
    console.error('Failed to fetch user sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
