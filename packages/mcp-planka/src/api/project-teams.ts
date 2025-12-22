import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, TeamId, ProjectTeamId } from '../types/index.js';

/**
 * Project Teams API
 * Assign teams to projects
 */

export interface ProjectTeam {
  id: ProjectTeamId;
  projectId: ProjectId;
  teamId: TeamId;
  role: 'viewer' | 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AddProjectTeamData {
  teamId: TeamId;
  role?: 'viewer' | 'member' | 'admin';
}

export interface UpdateProjectTeamData {
  role?: 'viewer' | 'member' | 'admin';
}

/**
 * Add team to project
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param data - Team data
 */
export async function addProjectTeam(
  auth: PlankaAuth,
  projectId: ProjectId,
  data: AddProjectTeamData,
): Promise<ProjectTeam> {
  return plankaFetch<ProjectTeam>(auth, `/api/projects/${projectId}/project-teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update project team
 * @param auth - Planka authentication
 * @param id - Project team ID
 * @param data - Update data
 */
export async function updateProjectTeam(
  auth: PlankaAuth,
  id: ProjectTeamId,
  data: UpdateProjectTeamData,
): Promise<ProjectTeam> {
  return plankaFetch<ProjectTeam>(auth, `/api/project-teams/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Remove team from project
 * @param auth - Planka authentication
 * @param id - Project team ID
 */
export async function removeProjectTeam(
  auth: PlankaAuth,
  id: ProjectTeamId,
): Promise<ProjectTeam> {
  return plankaFetch<ProjectTeam>(auth, `/api/project-teams/${id}`, {
    method: 'DELETE',
  });
}
