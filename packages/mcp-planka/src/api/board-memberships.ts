import type { PlankaAuth, PlankaBoardMembership } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function addBoardMembership(
  auth: PlankaAuth,
  boardId: string,
  userId: string,
  role: string,
): Promise<PlankaBoardMembership> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/board-memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
}

export async function updateBoardMembership(
  auth: PlankaAuth,
  membershipId: string,
  updates: { role?: string; canComment?: boolean },
): Promise<PlankaBoardMembership> {
  return await plankaFetch(auth, `/api/board-memberships/${encodeURIComponent(membershipId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteBoardMembership(auth: PlankaAuth, membershipId: string): Promise<PlankaBoardMembership> {
  return await plankaFetch(auth, `/api/board-memberships/${encodeURIComponent(membershipId)}`, {
    method: 'DELETE',
  });
}
