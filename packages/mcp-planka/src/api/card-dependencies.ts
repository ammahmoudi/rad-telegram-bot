import type { PlankaAuth, PlankaCardDependency } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function addCardDependency(
  auth: PlankaAuth,
  cardId: string,
  dependsOnCardId: string,
): Promise<PlankaCardDependency> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dependsOnCardId }),
  });
}

export async function removeCardDependency(
  auth: PlankaAuth,
  cardId: string,
  dependsOnCardId: string,
): Promise<PlankaCardDependency> {
  return await plankaFetch(
    auth,
    `/api/cards/${encodeURIComponent(cardId)}/card-dependencies/dependsOnCardId:${encodeURIComponent(dependsOnCardId)}`,
    { method: 'DELETE' },
  );
}
