import { plankaFetch } from './client.js';
import type { PlankaAuth, SpaceId, FolderId, PlankaFolder } from '../types/index.js';

/**
 * Folders API
 * Handles folder operations in spaces
 */

export interface Folder {
  id: FolderId;
  spaceId: SpaceId;
  name: string;
  parentFolderId?: FolderId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderData {
  name: string;
  parentFolderId?: FolderId;
}

export interface UpdateFolderData {
  name?: string;
  parentFolderId?: FolderId;
}

/**
 * Create a new folder in a space
 * @param auth - Planka authentication
 * @param spaceId - Space ID
 * @param data - Folder data
 */
export async function createFolder(
  auth: PlankaAuth,
  spaceId: SpaceId,
  data: CreateFolderData,
): Promise<Folder> {
  return plankaFetch<Folder>(auth, `/api/spaces/${spaceId}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * List folders in a space
 * @param auth - Planka authentication
 * @param spaceId - Space ID
 */
export async function listFolders(
  auth: PlankaAuth,
  spaceId: SpaceId,
): Promise<Folder[]> {
  return plankaFetch<Folder[]>(auth, `/api/spaces/${spaceId}/folders`, {
    method: 'GET',
  });
}

/**
 * Get folder details
 * @param auth - Planka authentication
 * @param id - Folder ID
 */
export async function getFolder(
  auth: PlankaAuth,
  id: FolderId,
): Promise<Folder> {
  return plankaFetch<Folder>(auth, `/api/folders/${id}`, {
    method: 'GET',
  });
}

/**
 * Update folder
 * @param auth - Planka authentication
 * @param id - Folder ID
 * @param data - Folder data to update
 */
export async function updateFolder(
  auth: PlankaAuth,
  id: FolderId,
  data: UpdateFolderData,
): Promise<Folder> {
  return plankaFetch<Folder>(auth, `/api/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete folder
 * @param auth - Planka authentication
 * @param id - Folder ID
 */
export async function deleteFolder(
  auth: PlankaAuth,
  id: FolderId,
): Promise<Folder> {
  return plankaFetch<Folder>(auth, `/api/folders/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download folder as ZIP
 * @param auth - Planka authentication
 * @param id - Folder ID
 */
export async function downloadFolder(
  auth: PlankaAuth,
  id: FolderId,
): Promise<Blob> {
  return plankaFetch<Blob>(auth, `/api/folders/${id}/download`, {
    method: 'GET',
  });
}
