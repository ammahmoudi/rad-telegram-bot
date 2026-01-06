import { getPrisma } from '@rad/shared';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: telegramUserId } = await params;
    const { packId } = await request.json();

    const prisma = getPrisma();

    if (packId) {
      // Assign or update pack
      await prisma.userPackAssignment.upsert({
        where: { telegramUserId },
        update: {
          packId,
          assignedAt: Date.now(),
        },
        create: {
          telegramUserId,
          packId,
          assignedAt: Date.now(),
        },
      });
    } else {
      // Remove pack assignment (user will use default)
      await prisma.userPackAssignment.deleteMany({
        where: { telegramUserId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pack assignment:', error);
    return NextResponse.json({ error: 'Failed to update pack assignment' }, { status: 500 });
  }
}
