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
  try {
    return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (error: any) {
    // Note: /api/labels/{id} endpoint may not be supported in all Planka versions
    // If it fails, labels can only be updated through board management UI
    throw new Error(`Failed to update label ${labelId}: ${error.message}. This endpoint may not be supported.`);
  }
}

export async function deleteLabel(auth: PlankaAuth, labelId: string): Promise<PlankaLabel> {
  try {
    return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    // Note: /api/labels/{id} endpoint may not be supported in all Planka versions
    // If it fails, labels can only be deleted through board management UI
    throw new Error(`Failed to delete label ${labelId}: ${error.message}. This endpoint may not be supported.`);
  }
}

export async function assignLabelToCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<{ cardId: string; labelId: string }> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
}

export async function removeLabelFromCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<{ cardId: string; labelId: string }> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels/labelid:${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
  });
}
