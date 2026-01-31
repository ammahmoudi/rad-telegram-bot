import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions/[sessionId]/usage
 * Get LLM usage statistics for a specific session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const prisma = getPrisma();

    // Get all calls for this session
    const calls = await prisma.llmCall.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    // Get aggregated stats
    const stats = await prisma.llmCall.aggregate({
      where: { sessionId },
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
        cachedTokens: true,
        cacheWriteTokens: true,
        reasoningTokens: true,
        cost: true,
        toolCallCount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get model breakdown
    const modelStats = await prisma.llmCall.groupBy({
      by: ['model'],
      where: { sessionId },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      calls: calls.map(call => ({
        ...call,
        createdAt: Number(call.createdAt),
      })),
      stats: {
        totalCalls: stats._count.id,
        totalTokens: Number(stats._sum.totalTokens || 0),
        promptTokens: Number(stats._sum.promptTokens || 0),
        completionTokens: Number(stats._sum.completionTokens || 0),
        cachedTokens: Number(stats._sum.cachedTokens || 0),
        cacheWriteTokens: Number(stats._sum.cacheWriteTokens || 0),
        reasoningTokens: Number(stats._sum.reasoningTokens || 0),
        totalCost: Number(stats._sum.cost || 0),
        totalToolCalls: Number(stats._sum.toolCallCount || 0),
      },
      modelBreakdown: modelStats.map(stat => ({
        model: stat.model,
        calls: stat._count.id,
        totalTokens: Number(stat._sum.totalTokens || 0),
        cost: Number(stat._sum.cost || 0),
      })),
    });
  } catch (error) {
    console.error('[api/sessions/[sessionId]/usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session usage data' },
      { status: 500 }
    );
  }
}
