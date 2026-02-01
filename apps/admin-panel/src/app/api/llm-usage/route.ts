import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPrisma } from '@rad/shared';

export const dynamic = 'force-dynamic';

/**
 * GET /api/llm-usage
 * Get LLM usage statistics with filtering
 * Query params:
 * - telegramUserId: Filter by user
 * - sessionId: Filter by session
 * - model: Filter by model
 * - fromDate: Start date (timestamp)
 * - toDate: End date (timestamp)
 * - limit: Number of records (default: 50, max: 500)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const telegramUserId = searchParams.get('telegramUserId');
    const sessionId = searchParams.get('sessionId');
    const model = searchParams.get('model');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    const prisma = getPrisma();

    // Build where clause
    const where: any = {};
    if (telegramUserId) where.telegramUserId = telegramUserId;
    if (sessionId) where.sessionId = sessionId;
    if (model) where.model = model;
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = BigInt(fromDate);
      if (toDate) where.createdAt.lte = BigInt(toDate);
    }

    // Get total count for pagination
    const totalCount = await (prisma as any).llmCall.count({ where });

    // Get calls with pagination
    const calls = await (prisma as any).llmCall.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        // Include the message that triggered this call (if messageId exists)
      },
    });

    // For each call, fetch the associated message and related user messages
    const enrichedCalls = await Promise.all(
      calls.map(async (call: any) => {
        let userMessage = null;
        let assistantMessage = null;

        if (call.messageId) {
          // Find the assistant message that this call generated
          assistantMessage = await prisma.message.findFirst({
            where: { id: call.messageId },
          });

          // Find the user message that triggered this (most recent user message before assistant)
          if (assistantMessage) {
            userMessage = await prisma.message.findFirst({
              where: {
                sessionId: assistantMessage.sessionId,
                role: 'user',
                createdAt: { lt: assistantMessage.createdAt },
              },
              orderBy: { createdAt: 'desc' },
            });
          }
        }

        return {
          ...call,
          createdAt: Number(call.createdAt),
          userMessage: userMessage ? {
            id: userMessage.id,
            content: userMessage.content,
            createdAt: Number(userMessage.createdAt),
          } : null,
          assistantMessage: assistantMessage ? {
            id: assistantMessage.id,
            content: assistantMessage.content,
            createdAt: Number(assistantMessage.createdAt),
          } : null,
        };
      })
    );

    // Get aggregated stats
    const stats = await (prisma as any).llmCall.aggregate({
      where,
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
        cachedTokens: true,
        cacheWriteTokens: true,
        reasoningTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      calls: enrichedCalls,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        totalCalls: stats._count.id,
        totalTokens: Number(stats._sum.totalTokens || 0),
        promptTokens: Number(stats._sum.promptTokens || 0),
        completionTokens: Number(stats._sum.completionTokens || 0),
        cachedTokens: Number(stats._sum.cachedTokens || 0),
        cacheWriteTokens: Number(stats._sum.cacheWriteTokens || 0),
        reasoningTokens: Number(stats._sum.reasoningTokens || 0),
        totalCost: Number(stats._sum.cost || 0),
      },
    });
  } catch (error) {
    console.error('[api/llm-usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM usage data' },
      { status: 500 }
    );
  }
}
