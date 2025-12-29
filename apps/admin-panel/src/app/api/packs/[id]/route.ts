import { getPrisma } from '@rad/shared';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: packId } = await params;
    const { name, description } = await request.json();

    const prisma = getPrisma();

    await prisma.characterPack.update({
      where: { id: packId },
      data: {
        name,
        description,
        updatedAt: Date.now(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pack:', error);
    return NextResponse.json({ error: 'Failed to update pack' }, { status: 500 });
  }
}
