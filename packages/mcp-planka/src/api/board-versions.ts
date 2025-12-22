import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, VersionId, PlankaBoardVersion } from '../types/index.js';

/**
 * Board Versions API
 * Version control for boards
 */

export interface BoardVersion {
  id: VersionId;
  boardId: BoardId;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  snapshot: any;
}

/**
 * Create board version
 * @param auth - Planka authentication
 * @param boardId - Board ID
 */
export async function createBoardVersion(
  auth: PlankaAuth,
  boardId: BoardId,
): Promise<BoardVersion> {
  return plankaFetch<BoardVersion>(auth, `/api/boards/${boardId}/versions`, {
    method: 'POST',
  });
}

/**
 * List board versions
 * @param auth - Planka authentication
 * @param boardId - Board ID
 */
export async function listBoardVersions(
  auth: PlankaAuth,
  boardId: BoardId,
): Promise<BoardVersion[]> {
  return plankaFetch<BoardVersion[]>(auth, `/api/boards/${boardId}/versions`, {
    method: 'GET',
  });
}

/**
 * Delete board version
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param versionId - Version ID
 */
export async function deleteBoardVersion(
  auth: PlankaAuth,
  boardId: BoardId,
  versionId: VersionId,
): Promise<BoardVersion> {
  return plankaFetch<BoardVersion>(auth, `/api/boards/${boardId}/versions/${versionId}`, {
    method: 'DELETE',
  });
}

/**
 * Restore board version
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param versionId - Version ID
 */
export async function restoreBoardVersion(
  auth: PlankaAuth,
  boardId: BoardId,
  versionId: VersionId,
): Promise<PlankaBoardVersion> {
  return plankaFetch<any>(auth, `/api/boards/${boardId}/versions/${versionId}/restore`, {
    method: 'POST',
  });
}
