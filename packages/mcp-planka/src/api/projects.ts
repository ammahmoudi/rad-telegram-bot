import type { PlankaAuth, PlankaProject } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function listProjects(auth: PlankaAuth): Promise<PlankaProject[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any; included?: any }>(auth, '/api/projects', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getProject(auth: PlankaAuth, projectId: string): Promise<any> {
  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
}
