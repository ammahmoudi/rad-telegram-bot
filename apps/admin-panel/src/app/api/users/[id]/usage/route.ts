import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]/usage
 * Get LLM usage statistics for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const prisma = getPrisma();

    // Get search params for date filtering
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    const where: any = { telegramUserId: id };
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = BigInt(fromDate);
      if (toDate) where.createdAt.lte = BigInt(toDate);
    }

    // Get recent calls
    const calls = await prisma.llmCall.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get aggregated stats
    const stats = await prisma.llmCall.aggregate({
      where,
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
      where,
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          cost: 'desc',
        },
      },
    });

    // Get daily usage (last 30 days)
    const thirtyDaysAgo = BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = await prisma.$queryRaw<Array<{ date: string; calls: bigint; tokens: bigint; cost: number }>>`
      SELECT 
        date(createdAt / 1000, 'unixepoch') as date,
        COUNT(*) as calls,
        SUM(totalTokens) as tokens,
        SUM(cost) as cost
      FROM LlmCall
      WHERE telegramUserId = ${id}
        AND createdAt >= ${thirtyDaysAgo}
      GROUP BY date
      ORDER BY date DESC
    `;

    return NextResponse.json({
      recentCalls: calls.map(call => ({
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
        avgCostPerCall: stats._count.id > 0 ? Number(stats._sum.cost || 0) / stats._count.id : 0,
      },
      modelBreakdown: modelStats.map(stat => ({
        model: stat.model,
        calls: stat._count.id,
        totalTokens: Number(stat._sum.totalTokens || 0),
        cost: Number(stat._sum.cost || 0),
      })),
      dailyUsage: dailyStats.map(day => ({
        date: day.date,
        calls: Number(day.calls),
        tokens: Number(day.tokens),
        cost: day.cost,
      })),
    });
  } catch (error) {
    console.error('[api/users/[id]/usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user usage data' },
      { status: 500 }
    );
  }
}
