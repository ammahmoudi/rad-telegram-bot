import type { PlankaAuth, PlankaWebhook } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function listWebhooks(auth: PlankaAuth): Promise<PlankaWebhook[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(auth, '/api/webhooks', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function createWebhook(
  auth: PlankaAuth,
  url: string,
  events: string[],
  active?: boolean,
): Promise<any> {
  return await plankaFetch(auth, '/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, events, active: active ?? true }),
  });
}

export async function updateWebhook(
  auth: PlankaAuth,
  webhookId: string,
  updates: { url?: string; events?: string[]; active?: boolean },
): Promise<any> {
  return await plankaFetch(auth, `/api/webhooks/${encodeURIComponent(webhookId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteWebhook(auth: PlankaAuth, webhookId: string): Promise<PlankaWebhook> {
  return await plankaFetch(auth, `/api/webhooks/${encodeURIComponent(webhookId)}`, {
    method: 'DELETE',
  });
}
