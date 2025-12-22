import { plankaFetch } from './client.js';
import type { PlankaAuth, ProjectId, BackgroundImageId, UploadedFile, PlankaBackgroundImage } from '../types/index.js';

/**
 * Background Images API
 * Handles project background image operations
 */

export interface BackgroundImage {
  id: BackgroundImageId;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Upload background image for a project
 * @param auth - Planka authentication
 * @param projectId - Project ID
 * @param file - Image file to upload
 */
export async function uploadBackgroundImage(
  auth: PlankaAuth,
  projectId: ProjectId,
  file: File | Buffer,
): Promise<BackgroundImage> {
  const formData = new FormData();
  if (file instanceof Buffer) {
    formData.append('file', new Blob([file]), 'background.jpg');
  } else {
    formData.append('file', file);
  }

  return plankaFetch<BackgroundImage>(auth, `/api/projects/${projectId}/background-images`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Delete background image
 * @param auth - Planka authentication
 * @param id - Background image ID
 */
export async function deleteBackgroundImage(
  auth: PlankaAuth,
  id: BackgroundImageId,
): Promise<BackgroundImage> {
  return plankaFetch<BackgroundImage>(auth, `/api/background-images/${id}`, {
    method: 'DELETE',
  });
}
