import type { PlankaAuth, PlankaList } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function createList(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  position?: number,
  color?: string,
): Promise<PlankaList> {
  const body: any = {
    name,
    position: position ?? 65535,
    type: 'active',
  };

  if (color) body.color = color;

  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateList(
  auth: PlankaAuth,
  listId: string,
  updates: { name?: string; position?: number; color?: string },
): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function archiveList(auth: PlankaAuth, listId: string): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'closed' }),
  });
}

export async function deleteList(auth: PlankaAuth, listId: string): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'DELETE',
  });
}

export async function getList(auth: PlankaAuth, listId: string): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'GET',
  });
}

export async function clearList(auth: PlankaAuth, listId: string): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/clear`, {
    method: 'POST',
  });
}

export async function sortList(auth: PlankaAuth, listId: string): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/sort`, {
    method: 'POST',
  });
}

export async function moveCardsFromList(
  auth: PlankaAuth,
  listId: string,
  targetListId: string,
): Promise<PlankaList> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/move-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetListId }),
  });
}
