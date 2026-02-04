import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/jobs/executions/[id] - Get execution details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: executionId } = await params;
    const prisma = getPrisma();

    const execution = await prisma.jobExecution.findUnique({
      where: { id: executionId },
      include: {
        job: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        job: execution.job,
        status: execution.status,
        startedAt: Number(execution.startedAt),
        completedAt: execution.completedAt ? Number(execution.completedAt) : null,
        durationMs: execution.durationMs,
        usersAffected: execution.usersAffected,
        result: execution.result ? JSON.parse(execution.result) : null,
        error: execution.error,
        metadata: execution.metadata ? JSON.parse(execution.metadata) : null,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}
