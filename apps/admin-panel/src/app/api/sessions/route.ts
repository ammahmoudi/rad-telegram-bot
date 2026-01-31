import { getPrisma } from '@rad/shared';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const prisma = getPrisma();

    // If sessionId is provided, fetch that specific session
    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const user = await prisma.telegramUser.findUnique({
        where: { id: session.telegramUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      });

      return NextResponse.json({
        session: {
          id: session.id,
          telegramUserId: session.telegramUserId,
          createdAt: Number(session.createdAt),
          updatedAt: Number(session.updatedAt),
          user: user || { firstName: null, lastName: null, username: null },
          messageCount: session._count.messages,
        },
      });
    }

    // Otherwise, fetch multiple sessions with optional userId filter
    const where = userId ? { telegramUserId: userId } : {};

    const sessions = await prisma.chatSession.findMany({
      where,
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
      take: limit,
    });

    // Fetch user info for each session
    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const user = await prisma.telegramUser.findUnique({
          where: { id: session.telegramUserId },
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        });

        return {
          id: session.id,
          telegramUserId: session.telegramUserId,
          createdAt: Number(session.createdAt),
          updatedAt: Number(session.updatedAt),
          user: user || { firstName: null, lastName: null, username: null },
          messageCount: session._count.messages,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithUsers });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
