import type { PlankaAuth, PlankaComment } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getComments(auth: PlankaAuth, cardId: string): Promise<PlankaComment[]> {
  const card = await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'GET',
  });
  return (card as any)?.included?.actions?.filter((a: any) => a.type === 'commentCard') ?? [];
}

export async function createComment(auth: PlankaAuth, cardId: string, text: string): Promise<PlankaComment> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'commentCard', data: { text } }),
  });
}

export async function updateComment(auth: PlankaAuth, commentId: string, text: string): Promise<PlankaComment> {
  return await plankaFetch(auth, `/api/actions/${encodeURIComponent(commentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { text } }),
  });
}

export async function deleteComment(auth: PlankaAuth, commentId: string): Promise<PlankaComment> {
  return await plankaFetch(auth, `/api/actions/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}
