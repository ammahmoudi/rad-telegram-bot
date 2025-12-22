import { plankaFetch } from './client.js';
import type { PlankaAuth, CardId, CustomFieldGroupId, CustomFieldId } from '../types/index.js';

/**
 * Custom Field Values API
 * Set and manage custom field values on cards
 */

export interface CustomFieldValue {
  cardId: CardId;
  customFieldGroupId: CustomFieldGroupId;
  customFieldId: CustomFieldId;
  value: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create or update custom field value
 * @param auth - Planka authentication
 * @param cardId - Card ID
 * @param customFieldGroupId - Custom field group ID
 * @param customFieldId - Custom field ID
 * @param value - Field value
 */
export async function setCustomFieldValue(
  auth: PlankaAuth,
  cardId: CardId,
  customFieldGroupId: CustomFieldGroupId,
  customFieldId: CustomFieldId,
  value: any,
): Promise<CustomFieldValue> {
  return plankaFetch<CustomFieldValue>(
    auth,
    `/api/cards/${cardId}/custom-field-values/customFieldGroupId:${customFieldGroupId}:customFieldId:${customFieldId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    },
  );
}

/**
 * Delete custom field value
 * @param auth - Planka authentication
 * @param cardId - Card ID
 * @param customFieldGroupId - Custom field group ID
 * @param customFieldId - Custom field ID
 */
export async function deleteCustomFieldValue(
  auth: PlankaAuth,
  cardId: CardId,
  customFieldGroupId: CustomFieldGroupId,
  customFieldId: CustomFieldId,
): Promise<CustomFieldValue> {
  return plankaFetch<CustomFieldValue>(
    auth,
    `/api/cards/${cardId}/custom-field-value/customFieldGroupId:${customFieldGroupId}:customFieldId:${customFieldId}`,
    {
      method: 'DELETE',
    },
  );
}
