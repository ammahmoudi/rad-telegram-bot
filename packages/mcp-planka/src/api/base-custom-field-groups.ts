import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, BaseCustomFieldGroupId } from '../types/index.js';

/**
 * Base Custom Field Groups API
 * Manage base custom field groups at project level
 */

export interface BaseCustomFieldGroup {
  id: BaseCustomFieldGroupId;
  projectId: ProjectId;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBaseCustomFieldGroupData {
  name: string;
  position?: number;
}

export interface UpdateBaseCustomFieldGroupData {
  name?: string;
  position?: number;
}

/**
 * Create base custom field group
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param data - Custom field group data
 */
export async function createBaseCustomFieldGroup(
  auth: PlankaAuth,
  projectId: ProjectId,
  data: CreateBaseCustomFieldGroupData,
): Promise<BaseCustomFieldGroup> {
  return plankaFetch<BaseCustomFieldGroup>(auth, `/api/projects/${projectId}/base-custom-field-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update base custom field group
 * @param auth - Planka authentication
 * @param id - Base custom field group ID
 * @param data - Update data
 */
export async function updateBaseCustomFieldGroup(
  auth: PlankaAuth,
  id: BaseCustomFieldGroupId,
  data: UpdateBaseCustomFieldGroupData,
): Promise<BaseCustomFieldGroup> {
  return plankaFetch<BaseCustomFieldGroup>(auth, `/api/base-custom-field-groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete base custom field group
 * @param auth - Planka authentication
 * @param id - Base custom field group ID
 */
export async function deleteBaseCustomFieldGroup(
  auth: PlankaAuth,
  id: BaseCustomFieldGroupId,
): Promise<BaseCustomFieldGroup> {
  return plankaFetch<BaseCustomFieldGroup>(auth, `/api/base-custom-field-groups/${id}`, {
    method: 'DELETE',
  });
}
