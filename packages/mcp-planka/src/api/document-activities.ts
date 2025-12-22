import { plankaFetch } from './client.js';
import type { PlankaAuth } from '../types/index.js';

/**
 * Document Activities API
 * Track document-related activities
 */

export interface DocumentActivity {
  id: string;
  type: string;
  userId: string;
  documentId: string;
  action: string;
  createdAt: string;
}

/**
 * Get document activities
 * @param auth - Planka authentication
 */
export async function getDocumentActivities(auth: PlankaAuth): Promise<DocumentActivity[]> {
  return plankaFetch<DocumentActivity[]>(auth, '/api/document-activities', {
    method: 'GET',
  });
}
