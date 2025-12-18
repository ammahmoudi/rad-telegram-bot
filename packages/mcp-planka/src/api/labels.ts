import type { PlankaAuth, PlankaLabel } from '../types/index.js';
import { plankaFetch } from './client.js';
import { getBoard } from './boards.js';

export async function getLabels(auth: PlankaAuth, boardId: string): Promise<PlankaLabel[]> {
  const board = await getBoard(auth, boardId);
  return (board as any)?.included?.labels ?? [];
}

export async function createLabel(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  color: string,
  position?: number,
): Promise<PlankaLabel> {
  const body: any = {
    name,
    color,
    position: position ?? 65535,
    type: 'label',
  };

  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateLabel(
  auth: PlankaAuth,
  labelId: string,
  updates: { name?: string; color?: string; position?: number },
): Promise<PlankaLabel> {
  return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteLabel(auth: PlankaAuth, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
  });
}

export async function assignLabelToCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
}

export async function removeLabelFromCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels/labelid:${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
  });
}
