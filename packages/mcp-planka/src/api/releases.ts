import { plankaFetch } from './client.js';
import type { PlankaAuth, ReleaseId, CardId } from '../types/index.js';

/**
 * Releases API
 * Manage card assignments to releases
 */

export interface ReleaseCard {
  releaseId: ReleaseId;
  cardId: CardId;
  createdAt: string;
}

/**
 * Add card to release
 * @param auth - Planka authentication
 * @param releaseId - Release ID
 * @param cardId - Card ID
 */
export async function addCardToRelease(
  auth: PlankaAuth,
  releaseId: ReleaseId,
  cardId: CardId,
): Promise<ReleaseCard> {
  return plankaFetch<ReleaseCard>(auth, `/api/releases/${releaseId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId }),
  });
}

/**
 * Remove card from release
 * @param auth - Planka authentication
 * @param releaseId - Release ID
 * @param cardId - Card ID
 */
export async function removeCardFromRelease(
  auth: PlankaAuth,
  releaseId: ReleaseId,
  cardId: CardId,
): Promise<ReleaseCard> {
  return plankaFetch<ReleaseCard>(auth, `/api/releases/${releaseId}/cards/${cardId}`, {
    method: 'DELETE',
  });
}
