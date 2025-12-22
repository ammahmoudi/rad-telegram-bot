import { plankaFetch } from './client.js';
import type { PlankaAuth, SpaceId, FileId, FolderId } from '../types/index.js';

/**
 * Files API
 * Handles file operations in spaces
 */

export interface FileMetadata {
  id: FileId;
  spaceId: SpaceId;
  folderId?: FolderId;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFileData {
  name?: string;
  folderId?: FolderId;
}

/**
 * Upload file to space
 * @param auth - Planka authentication
 * @param spaceId - Space ID
 * @param file - File to upload
 * @param folderId - Optional folder ID
 */
export async function uploadFile(
  auth: PlankaAuth,
  spaceId: SpaceId,
  file: File | Buffer,
  folderId?: FolderId,
): Promise<FileMetadata> {
  const formData = new FormData();
  if (file instanceof Buffer) {
    formData.append('file', new Blob([file]), 'file');
  } else {
    formData.append('file', file);
  }
  
  if (folderId) {
    formData.append('folderId', folderId);
  }

  return plankaFetch<FileMetadata>(auth, `/api/spaces/${spaceId}/upload`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get file metadata
 * @param auth - Planka authentication
 * @param id - File ID
 */
export async function getFile(
  auth: PlankaAuth,
  id: FileId,
): Promise<FileMetadata> {
  return plankaFetch<FileMetadata>(auth, `/api/files/${id}`, {
    method: 'GET',
  });
}

/**
 * Update file metadata
 * @param auth - Planka authentication
 * @param id - File ID
 * @param data - File data to update
 */
export async function updateFile(
  auth: PlankaAuth,
  id: FileId,
  data: UpdateFileData,
): Promise<FileMetadata> {
  return plankaFetch<FileMetadata>(auth, `/api/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete file
 * @param auth - Planka authentication
 * @param id - File ID
 */
export async function deleteFile(
  auth: PlankaAuth,
  id: FileId,
): Promise<FileMetadata> {
  return plankaFetch<FileMetadata>(auth, `/api/files/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Download file
 * @param auth - Planka authentication
 * @param id - File ID
 */
export async function downloadFile(
  auth: PlankaAuth,
  id: FileId,
): Promise<Blob> {
  return plankaFetch<Blob>(auth, `/api/files/${id}/download`, {
    method: 'GET',
  });
}
