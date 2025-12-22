import type { PlankaAuth, PlankaAction } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getBoardActions(auth: PlankaAuth, boardId: string): Promise<PlankaAction[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(
    auth,
    `/api/boards/${encodeURIComponent(boardId)}/actions`,
    { method: 'GET' },
  );

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getCardActions(auth: PlankaAuth, cardId: string): Promise<PlankaAction[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(
    auth,
    `/api/cards/${encodeURIComponent(cardId)}/actions`,
    { method: 'GET' },
  );

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}
