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

export async function getProject(auth: PlankaAuth, projectId: string): Promise<PlankaProject> {
  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
}

export async function createProject(
  auth: PlankaAuth,
  name: string,
  description?: string,
  type: 'private' | 'shared' = 'private'
): Promise<PlankaProject> {
  return await plankaFetch(auth, '/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, type }),
  });
}

export async function updateProject(
  auth: PlankaAuth,
  projectId: string,
  updates: { name?: string; description?: string; backgroundImageId?: string },
): Promise<PlankaProject> {
  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(auth: PlankaAuth, projectId: string): Promise<PlankaProject> {
  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}

export async function duplicateProject(auth: PlankaAuth, projectId: string, name?: string): Promise<PlankaProject> {
  const body: any = {};
  if (name) body.name = name;

  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
