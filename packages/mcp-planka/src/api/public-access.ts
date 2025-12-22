import { plankaFetch } from './client.js';
import type { PlankaAuth, FileId } from '../types/index.js';

/**
 * Public Access API
 * Access public share links without authentication
 */

export interface PublicAccessInfo {
  token: string;
  type: 'file' | 'folder' | 'space';
  name: string;
  metadata?: any;
}

/**
 * Access public share link
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 */
export async function accessPublicLink(
  plankaBaseUrl: string,
  token: string,
): Promise<PublicAccessInfo> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<PublicAccessInfo>(auth, `/api/public/${token}`, {
    method: 'GET',
  });
}

/**
 * Download via public link
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 */
export async function downloadViaPublicLink(
  plankaBaseUrl: string,
  token: string,
): Promise<Blob> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<Blob>(auth, `/api/public/${token}/download`, {
    method: 'GET',
  });
}

/**
 * Preview file via public link
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 */
export async function previewViaPublicLink(
  plankaBaseUrl: string,
  token: string,
): Promise<any> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<any>(auth, `/api/public/${token}/preview`, {
    method: 'GET',
  });
}

/**
 * Download file within shared folder/space
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 * @param fileId - File ID
 */
export async function downloadFileViaPublicLink(
  plankaBaseUrl: string,
  token: string,
  fileId: FileId,
): Promise<Blob> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<Blob>(auth, `/api/public/${token}/file/${fileId}/download`, {
    method: 'GET',
  });
}

/**
 * Preview file within shared folder/space
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 * @param fileId - File ID
 */
export async function previewFileViaPublicLink(
  plankaBaseUrl: string,
  token: string,
  fileId: FileId,
): Promise<any> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<any>(auth, `/api/public/${token}/file/${fileId}/preview`, {
    method: 'GET',
  });
}

/**
 * Download folder as ZIP via public link
 * @param plankaBaseUrl - Planka base URL
 * @param token - Public share token
 */
export async function downloadFolderViaPublicLink(
  plankaBaseUrl: string,
  token: string,
): Promise<Blob> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<Blob>(auth, `/api/public/${token}/download-folder`, {
    method: 'GET',
  });
}
