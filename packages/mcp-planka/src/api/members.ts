import type { PlankaAuth, PlankaUser } from '../types/index.js';
import { plankaFetch } from './client.js';
import { getProject } from './projects.js';

export async function getMembers(auth: PlankaAuth, projectId: string): Promise<PlankaUser[]> {
  const project = await getProject(auth, projectId);
  return (project as any)?.included?.users ?? [];
}

export async function assignMemberToCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function removeMemberFromCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships/userid:${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
