import type { PlankaAuth } from '../types/index.js';
import { getPlankaToken } from '@rastar/shared';

export type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function requireAuth(args: unknown): Promise<PlankaAuth> {
  const telegramUserId = String((args as any)?.telegramUserId ?? '');
  if (!telegramUserId) {
    throw new Error('telegramUserId is required');
  }

  const rec = await getPlankaToken(telegramUserId);
  if (!rec) {
    throw new Error('Planka not linked for this user. Run /link_planka in Telegram.');
  }

  return { plankaBaseUrl: rec.plankaBaseUrl, accessToken: rec.accessToken };
}

export function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}
