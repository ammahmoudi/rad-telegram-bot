import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectCategoryId, PlankaProjectCategory } from '../types/index.js';

/**
 * Project Categories API
 * Handles project categorization
 */

export interface ProjectCategory {
  id: ProjectCategoryId;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectCategoryData {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateProjectCategoryData {
  name?: string;
  color?: string;
  description?: string;
}

/**
 * Create project category
 * @param auth - Planka authentication
 * @param data - Category data
 */
export async function createProjectCategory(
  auth: PlankaAuth,
  data: CreateProjectCategoryData,
): Promise<ProjectCategory> {
  return plankaFetch<ProjectCategory>(auth, '/api/project-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all project categories
 * @param auth - Planka authentication
 */
export async function listProjectCategories(
  auth: PlankaAuth,
): Promise<ProjectCategory[]> {
  return plankaFetch<ProjectCategory[]>(auth, '/api/project-categories', {
    method: 'GET',
  });
}

/**
 * Get project category
 * @param auth - Planka authentication
 * @param id - Category ID
 */
export async function getProjectCategory(
  auth: PlankaAuth,
  id: ProjectCategoryId,
): Promise<ProjectCategory> {
  return plankaFetch<ProjectCategory>(auth, `/api/project-categories/${id}`, {
    method: 'GET',
  });
}

/**
 * Update project category
 * @param auth - Planka authentication
 * @param id - Category ID
 * @param data - Category data to update
 */
export async function updateProjectCategory(
  auth: PlankaAuth,
  id: ProjectCategoryId,
  data: UpdateProjectCategoryData,
): Promise<ProjectCategory> {
  return plankaFetch<ProjectCategory>(auth, `/api/project-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete project category
 * @param auth - Planka authentication
 * @param id - Category ID
 */
export async function deleteProjectCategory(
  auth: PlankaAuth,
  id: ProjectCategoryId,
): Promise<ProjectCategory> {
  return plankaFetch<ProjectCategory>(auth, `/api/project-categories/${id}`, {
    method: 'DELETE',
  });
}
