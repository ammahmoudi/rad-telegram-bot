import type { PlankaAuth, PlankaCard } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function createCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  description?: string,
  position?: number,
  dueDate?: string,
): Promise<PlankaCard> {
  const body: any = {
    name,
    position: position ?? 65535,
    type: 'project',
  };

  if (description) body.description = description;
  if (dueDate) body.dueDate = new Date(dueDate).toISOString();

  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateCard(
  auth: PlankaAuth,
  cardId: string,
  updates: { name?: string; description?: string; dueDate?: string; position?: number },
): Promise<PlankaCard> {
  const body: any = { ...updates };
  if (body.dueDate) body.dueDate = new Date(body.dueDate).toISOString();

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function moveCard(auth: PlankaAuth, cardId: string, listId: string, position?: number): Promise<PlankaCard> {
  const body: any = { listId };
  if (typeof position === 'number') body.position = position;

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteCard(auth: PlankaAuth, cardId: string): Promise<PlankaCard> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'DELETE',
  });
}

export async function getCard(auth: PlankaAuth, cardId: string): Promise<PlankaCard> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'GET',
  });
}

export async function duplicateCard(auth: PlankaAuth, cardId: string, position?: number): Promise<PlankaCard> {
  const body: any = {};
  if (typeof position === 'number') body.position = position;

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getCardChildren(auth: PlankaAuth, cardId: string): Promise<PlankaCard[]> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/children`, {
    method: 'GET',
  });
}

export async function assignMemberToCard(auth: PlankaAuth, cardId: string, userId: string): Promise<{ cardId: string; userId: string }> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function removeMemberFromCard(auth: PlankaAuth, cardId: string, userId: string): Promise<{ cardId: string; userId: string }> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships/userid:${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
