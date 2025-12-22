import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, UserId, ProjectManagerId } from '../types/index.js';

/**
 * Project Managers API
 * Assign project managers
 */

export interface ProjectManager {
  id: ProjectManagerId;
  projectId: ProjectId;
  userId: UserId;
  createdAt: string;
}

/**
 * Create project manager
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param userId - User ID to assign as manager
 */
export async function createProjectManager(
  auth: PlankaAuth,
  projectId: ProjectId,
  userId: UserId,
): Promise<ProjectManager> {
  return plankaFetch<ProjectManager>(auth, `/api/projects/${projectId}/project-managers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

/**
 * Delete project manager
 * @param auth - Planka authentication
 * @param id - Project manager ID
 */
export async function deleteProjectManager(
  auth: PlankaAuth,
  id: ProjectManagerId,
): Promise<ProjectManager> {
  return plankaFetch<ProjectManager>(auth, `/api/project-managers/${id}`, {
    method: 'DELETE',
  });
}
