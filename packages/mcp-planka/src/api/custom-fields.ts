import { plankaFetch } from './client.js';
import type { PlankaAuth, BaseCustomFieldGroupId, CustomFieldGroupId, CustomFieldId } from '../types/index.js';

/**
 * Custom Fields API
 * Manage custom fields within field groups
 */

export interface CustomField {
  id: CustomFieldId;
  baseCustomFieldGroupId?: BaseCustomFieldGroupId;
  customFieldGroupId?: CustomFieldGroupId;
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  options?: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldData {
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  options?: string[];
  position?: number;
}

export interface UpdateCustomFieldData {
  name?: string;
  type?: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  options?: string[];
  position?: number;
}

/**
 * Create custom field in base custom field group
 * @param auth - Planka authentication
 * @param baseCustomFieldGroupId - Base custom field group ID
 * @param data - Custom field data
 */
export async function createCustomFieldInBaseGroup(
  auth: PlankaAuth,
  baseCustomFieldGroupId: BaseCustomFieldGroupId,
  data: CreateCustomFieldData,
): Promise<CustomField> {
  return plankaFetch<CustomField>(auth, `/api/base-custom-field-groups/${baseCustomFieldGroupId}/custom-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Create custom field in custom field group
 * @param auth - Planka authentication
 * @param customFieldGroupId - Custom field group ID
 * @param data - Custom field data
 */
export async function createCustomFieldInGroup(
  auth: PlankaAuth,
  customFieldGroupId: CustomFieldGroupId,
  data: CreateCustomFieldData,
): Promise<CustomField> {
  return plankaFetch<CustomField>(auth, `/api/custom-field-groups/${customFieldGroupId}/custom-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update custom field
 * @param auth - Planka authentication
 * @param id - Custom field ID
 * @param data - Update data
 */
export async function updateCustomField(
  auth: PlankaAuth,
  id: CustomFieldId,
  data: UpdateCustomFieldData,
): Promise<CustomField> {
  return plankaFetch<CustomField>(auth, `/api/custom-fields/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete custom field
 * @param auth - Planka authentication
 * @param id - Custom field ID
 */
export async function deleteCustomField(
  auth: PlankaAuth,
  id: CustomFieldId,
): Promise<CustomField> {
  return plankaFetch<CustomField>(auth, `/api/custom-fields/${id}`, {
    method: 'DELETE',
  });
}
