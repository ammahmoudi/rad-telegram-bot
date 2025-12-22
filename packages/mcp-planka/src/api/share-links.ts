import { plankaFetch } from './client.js';
import type { PlankaAuth, ShareLinkId, FileId, FolderId, SpaceId } from '../types/index.js';

/**
 * Share Links API
 * Create and manage public share links
 */

export interface ShareLink {
  id: ShareLinkId;
  token: string;
  resourceType: 'file' | 'folder' | 'space';
  resourceId: FileId | FolderId | SpaceId;
  expiresAt?: string;
  password?: string;
  downloadLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareLinkData {
  resourceType: 'file' | 'folder' | 'space';
  resourceId: string;
  expiresAt?: string;
  password?: string;
  downloadLimit?: number;
}

export interface UpdateShareLinkData {
  expiresAt?: string;
  password?: string;
  downloadLimit?: number;
}

/**
 * Create share link
 * @param auth - Planka authentication
 * @param data - Share link data
 */
export async function createShareLink(
  auth: PlankaAuth,
  data: CreateShareLinkData,
): Promise<ShareLink> {
  return plankaFetch<ShareLink>(auth, '/api/share-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update share link
 * @param auth - Planka authentication
 * @param id - Share link ID
 * @param data - Update data
 */
export async function updateShareLink(
  auth: PlankaAuth,
  id: ShareLinkId,
  data: UpdateShareLinkData,
): Promise<ShareLink> {
  return plankaFetch<ShareLink>(auth, `/api/share-links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Revoke share link
 * @param auth - Planka authentication
 * @param id - Share link ID
 */
export async function revokeShareLink(
  auth: PlankaAuth,
  id: ShareLinkId,
): Promise<ShareLink> {
  return plankaFetch<ShareLink>(auth, `/api/share-links/${id}`, {
    method: 'DELETE',
  });
}
