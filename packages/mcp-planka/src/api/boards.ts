import type { PlankaAuth, PlankaBoard } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getBoard(auth: PlankaAuth, boardId: string): Promise<PlankaBoard> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, { method: 'GET' });
}

export async function createBoard(
  auth: PlankaAuth,
  projectId: string,
  name: string,
  position?: number,
): Promise<PlankaBoard> {
  const body: any = {
    name,
    position: position ?? 65535,
  };

  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateBoard(
  auth: PlankaAuth,
  boardId: string,
  updates: { name?: string; position?: number },
): Promise<PlankaBoard> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteBoard(auth: PlankaAuth, boardId: string): Promise<PlankaBoard> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'DELETE',
  });
}

export async function duplicateBoard(auth: PlankaAuth, boardId: string, name?: string): Promise<PlankaBoard> {
  const body: any = {};
  if (name) body.name = name;

  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function transferBoard(
  auth: PlankaAuth,
  boardId: string,
  projectId: string,
): Promise<PlankaBoard> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/transfer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
}
