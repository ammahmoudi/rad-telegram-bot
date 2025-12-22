import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, CardId, CustomFieldGroupId } from '../types/index.js';

/**
 * Custom Field Groups API
 * Manage custom field groups for boards and cards
 */

export interface CustomFieldGroup {
  id: CustomFieldGroupId;
  name: string;
  boardId?: BoardId;
  cardId?: CardId;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldGroupData {
  name: string;
  position?: number;
}

export interface UpdateCustomFieldGroupData {
  name?: string;
  position?: number;
}

/**
 * Create board custom field group
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param data - Custom field group data
 */
export async function createBoardCustomFieldGroup(
  auth: PlankaAuth,
  boardId: BoardId,
  data: CreateCustomFieldGroupData,
): Promise<CustomFieldGroup> {
  return plankaFetch<CustomFieldGroup>(auth, `/api/boards/${boardId}/custom-field-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Create card custom field group
 * @param auth - Planka authentication
 * @param cardId - Card ID
 * @param data - Custom field group data
 */
export async function createCardCustomFieldGroup(
  auth: PlankaAuth,
  cardId: CardId,
  data: CreateCustomFieldGroupData,
): Promise<CustomFieldGroup> {
  return plankaFetch<CustomFieldGroup>(auth, `/api/cards/${cardId}/custom-field-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get custom field group details
 * @param auth - Planka authentication
 * @param id - Custom field group ID
 */
export async function getCustomFieldGroup(
  auth: PlankaAuth,
  id: CustomFieldGroupId,
): Promise<CustomFieldGroup> {
  return plankaFetch<CustomFieldGroup>(auth, `/api/custom-field-groups/${id}`, {
    method: 'GET',
  });
}

/**
 * Update custom field group
 * @param auth - Planka authentication
 * @param id - Custom field group ID
 * @param data - Update data
 */
export async function updateCustomFieldGroup(
  auth: PlankaAuth,
  id: CustomFieldGroupId,
  data: UpdateCustomFieldGroupData,
): Promise<CustomFieldGroup> {
  return plankaFetch<CustomFieldGroup>(auth, `/api/custom-field-groups/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete custom field group
 * @param auth - Planka authentication
 * @param id - Custom field group ID
 */
export async function deleteCustomFieldGroup(
  auth: PlankaAuth,
  id: CustomFieldGroupId,
): Promise<CustomFieldGroup> {
  return plankaFetch<CustomFieldGroup>(auth, `/api/custom-field-groups/${id}`, {
    method: 'DELETE',
  });
}
