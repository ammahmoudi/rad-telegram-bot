import { getPrisma } from './prisma.js';
import type { LlmUsageData, UsageTrackingContext } from './ai-chat.js';

/**
 * Save LLM usage data to database
 */
export async function saveLlmUsage(
  usage: LlmUsageData,
  context: UsageTrackingContext,
  model: string,
  finishReason: string,
  hasToolCalls: boolean,
  toolCallCount: number,
  requestDurationMs: number
): Promise<void> {
  try {
    const prisma = getPrisma();
    
    await prisma.llmCall.create({
      data: {
        telegramUserId: context.telegramUserId,
        sessionId: context.sessionId || null,
        messageId: context.messageId || null,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        cachedTokens: usage.cachedTokens,
        cacheWriteTokens: usage.cacheWriteTokens,
        reasoningTokens: usage.reasoningTokens,
        audioTokens: usage.audioTokens,
        cost: usage.cost,
        upstreamCost: usage.upstreamCost || null,
        finishReason: finishReason || null,
        hasToolCalls,
        toolCallCount,
        requestDurationMs,
        createdAt: BigInt(Date.now()),
      },
    });
    
    console.log('[llm-usage] Saved usage data:', {
      user: context.telegramUserId,
      session: context.sessionId,
      model,
      tokens: usage.totalTokens,
      cost: usage.cost,
      duration: requestDurationMs,
    });
  } catch (error) {
    console.error('[llm-usage] Failed to save usage data:', error);
    // Don't throw - usage tracking should not break the main flow
  }
}

/**
 * Get total usage stats for a user
 */
export async function getUserUsageStats(telegramUserId: string) {
  const prisma = getPrisma();
  
  const stats = await prisma.llmCall.aggregate({
    where: { telegramUserId },
    _sum: {
      totalTokens: true,
      promptTokens: true,
      completionTokens: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  });
  
  return {
    totalCalls: stats._count.id,
    totalTokens: stats._sum.totalTokens || 0,
    promptTokens: stats._sum.promptTokens || 0,
    completionTokens: stats._sum.completionTokens || 0,
    totalCost: stats._sum.cost || 0,
  };
}

/**
 * Get total usage stats for a session
 */
export async function getSessionUsageStats(sessionId: string) {
  const prisma = getPrisma();
  
  const stats = await prisma.llmCall.aggregate({
    where: { sessionId },
    _sum: {
      totalTokens: true,
      promptTokens: true,
      completionTokens: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  });
  
  return {
    totalCalls: stats._count.id,
    totalTokens: stats._sum.totalTokens || 0,
    promptTokens: stats._sum.promptTokens || 0,
    completionTokens: stats._sum.completionTokens || 0,
    totalCost: stats._sum.cost || 0,
  };
}

/**
 * Get recent LLM calls with pagination
 */
export async function getRecentLlmCalls(options: {
  telegramUserId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}) {
  const prisma = getPrisma();
  const { telegramUserId, sessionId, limit = 50, offset = 0 } = options;
  
  const where: any = {};
  if (telegramUserId) where.telegramUserId = telegramUserId;
  if (sessionId) where.sessionId = sessionId;
  
  const calls = await prisma.llmCall.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
  
  return calls.map(call => ({
    ...call,
    createdAt: Number(call.createdAt),
  }));
}
