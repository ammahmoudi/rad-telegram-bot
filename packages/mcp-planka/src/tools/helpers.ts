import type { PlankaAuth } from '../types/index.js';

export type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function requireAuth(args: unknown): Promise<PlankaAuth> {
  const plankaBaseUrl = String((args as any)?.plankaBaseUrl ?? '');
  const plankaToken = String((args as any)?.plankaToken ?? '');
  
  if (!plankaBaseUrl || !plankaToken) {
    throw new Error('plankaBaseUrl and plankaToken are required. Pass Planka credentials directly.');
  }

  return { plankaBaseUrl, accessToken: plankaToken };
}

export function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}
