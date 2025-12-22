import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, VersionId, PlankaProjectVersion } from '../types/index.js';

/**
 * Project Versions API
 * Version control for projects
 */

export interface ProjectVersion {
  id: VersionId;
  projectId: ProjectId;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  snapshot: any;
}

/**
 * Create project version
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param name - Version name
 */
export async function createProjectVersion(
  auth: PlankaAuth,
  projectId: ProjectId,
  name: string = 'Version',
): Promise<ProjectVersion> {
  return plankaFetch<ProjectVersion>(auth, `/api/projects/${projectId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

/**
 * List project versions
 * @param auth - Planka authentication
 * @param projectId - Project ID
 */
export async function listProjectVersions(
  auth: PlankaAuth,
  projectId: ProjectId,
): Promise<ProjectVersion[]> {
  return plankaFetch<ProjectVersion[]>(auth, `/api/projects/${projectId}/versions`, {
    method: 'GET',
  });
}

/**
 * Delete project version
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param versionId - Version ID
 */
export async function deleteProjectVersion(
  auth: PlankaAuth,
  projectId: ProjectId,
  versionId: VersionId,
): Promise<ProjectVersion> {
  return plankaFetch<ProjectVersion>(auth, `/api/projects/${projectId}/versions/${versionId}`, {
    method: 'DELETE',
  });
}

/**
 * Restore project version
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param versionId - Version ID
 */
export async function restoreProjectVersion(
  auth: PlankaAuth,
  projectId: ProjectId,
  versionId: VersionId,
): Promise<PlankaProjectVersion> {
  return plankaFetch<any>(auth, `/api/projects/${projectId}/versions/${versionId}/restore`, {
    method: 'POST',
  });
}
