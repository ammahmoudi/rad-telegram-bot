import type { PlankaAuth, PlankaConfig } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getConfig(auth: PlankaAuth): Promise<PlankaConfig> {
  return await plankaFetch(auth, '/api/config', {
    method: 'GET',
  });
}
