import { plankaFetch } from './client.js';
import type { PlankaAuth, PlankaTerms } from '../types/index.js';

/**
 * Terms API
 * Get terms and conditions
 */

/**
 * Get terms and conditions
 * @param auth - Planka authentication
 * @param type - Terms type (e.g., 'privacy', 'service')
 */
export async function getTerms(auth: PlankaAuth, type: string): Promise<PlankaTerms> {
  return plankaFetch<PlankaTerms>(auth, `/api/terms/${type}`, {
    method: 'GET',
  });
}
