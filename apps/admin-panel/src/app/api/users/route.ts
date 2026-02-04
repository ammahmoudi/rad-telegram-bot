import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

// GET /api/users - List Telegram users with pack assignment
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    const users = await prisma.telegramUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const assignments = await prisma.userPackAssignment.findMany({
      include: { pack: true },
    });

    const assignmentMap = new Map(
      assignments.map((a) => [a.telegramUserId, { packId: a.packId, packName: a.pack.name }])
    );

    const formatted = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      role: u.role,
      packId: assignmentMap.get(u.id)?.packId ?? null,
      packName: assignmentMap.get(u.id)?.packName ?? null,
    }));

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
