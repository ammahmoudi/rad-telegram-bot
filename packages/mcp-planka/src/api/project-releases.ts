import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, ReleaseId } from '../types/index.js';

/**
 * Project Releases API
 * Manage project-level releases
 */

export interface ProjectRelease {
  id: ReleaseId;
  projectId: ProjectId;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  releaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectReleaseData {
  name: string;
  description?: string;
  releaseDate?: string;
}

export interface UpdateProjectReleaseData {
  name?: string;
  description?: string;
  releaseDate?: string;
}

/**
 * Create project release
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param data - Release data
 */
export async function createProjectRelease(
  auth: PlankaAuth,
  projectId: ProjectId,
  data: CreateProjectReleaseData,
): Promise<ProjectRelease> {
  return plankaFetch<ProjectRelease>(auth, `/api/projects/${projectId}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all project releases
 * @param auth - Planka authentication
 * @param projectId - Project ID
 */
export async function getProjectReleases(
  auth: PlankaAuth,
  projectId: ProjectId,
): Promise<ProjectRelease[]> {
  return plankaFetch<ProjectRelease[]>(auth, `/api/projects/${projectId}/releases`, {
    method: 'GET',
  });
}

/**
 * Update project release
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param id - Release ID
 * @param data - Update data
 */
export async function updateProjectRelease(
  auth: PlankaAuth,
  projectId: ProjectId,
  id: ReleaseId,
  data: UpdateProjectReleaseData,
): Promise<ProjectRelease> {
  return plankaFetch<ProjectRelease>(auth, `/api/projects/${projectId}/releases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update project release status
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param id - Release ID
 * @param status - New status
 */
export async function updateProjectReleaseStatus(
  auth: PlankaAuth,
  projectId: ProjectId,
  id: ReleaseId,
  status: 'draft' | 'published' | 'archived',
): Promise<ProjectRelease> {
  return plankaFetch<ProjectRelease>(auth, `/api/projects/${projectId}/releases/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

/**
 * Delete project release
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param id - Release ID
 */
export async function deleteProjectRelease(
  auth: PlankaAuth,
  projectId: ProjectId,
  id: ReleaseId,
): Promise<ProjectRelease> {
  return plankaFetch<ProjectRelease>(auth, `/api/projects/${projectId}/releases/${id}`, {
    method: 'DELETE',
  });
}
