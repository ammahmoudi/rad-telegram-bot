import { getPrisma, setSystemConfig } from '@rad/shared';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: packId } = await params;
    const { name, description, aiModel } = await request.json();

    const prisma = getPrisma();

    const updatedPack = await prisma.characterPack.update({
      where: { id: packId },
      data: {
        name,
        description,
        aiModel: typeof aiModel === 'string' && aiModel.trim() ? aiModel.trim() : null,
        updatedAt: Date.now(),
      },
    });

    if (updatedPack.isDefault && typeof aiModel === 'string') {
      await setSystemConfig('DEFAULT_AI_MODEL', aiModel.trim());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pack:', error);
    return NextResponse.json({ error: 'Failed to update pack' }, { status: 500 });
  }
}
