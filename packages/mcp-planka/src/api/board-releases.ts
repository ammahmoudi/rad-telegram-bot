import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, ReleaseId, PlankaBoardRelease } from '../types/index.js';

/**
 * Board Releases API
 * Handles board release operations
 */

export interface BoardRelease {
  id: ReleaseId;
  boardId: BoardId;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  releaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardReleaseData {
  name: string;
  description?: string;
  releaseDate?: string;
}

export interface UpdateBoardReleaseData {
  name?: string;
  description?: string;
  releaseDate?: string;
}

export interface UpdateBoardReleaseStatusData {
  status: 'draft' | 'published' | 'archived';
}

/**
 * Create a new release for a board
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param data - Release data
 */
export async function createBoardRelease(
  auth: PlankaAuth,
  boardId: BoardId,
  data: CreateBoardReleaseData,
): Promise<BoardRelease> {
  return plankaFetch<BoardRelease>(auth, `/api/boards/${boardId}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all releases for a board
 * @param auth - Planka authentication
 * @param boardId - Board ID
 */
export async function getBoardReleases(
  auth: PlankaAuth,
  boardId: BoardId,
): Promise<BoardRelease[]> {
  return plankaFetch<BoardRelease[]>(auth, `/api/boards/${boardId}/releases`, {
    method: 'GET',
  });
}

/**
 * Update a release
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param id - Release ID
 * @param data - Release data to update
 */
export async function updateBoardRelease(
  auth: PlankaAuth,
  boardId: BoardId,
  id: ReleaseId,
  data: UpdateBoardReleaseData,
): Promise<BoardRelease> {
  return plankaFetch<BoardRelease>(auth, `/api/boards/${boardId}/releases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update release status
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param id - Release ID
 * @param data - Status data
 */
export async function updateBoardReleaseStatus(
  auth: PlankaAuth,
  boardId: BoardId,
  id: ReleaseId,
  data: UpdateBoardReleaseStatusData,
): Promise<BoardRelease> {
  return plankaFetch<BoardRelease>(auth, `/api/boards/${boardId}/releases/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get release snapshot
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param id - Release ID
 */
export async function getBoardReleaseSnapshot(
  auth: PlankaAuth,
  boardId: BoardId,
  id: ReleaseId,
): Promise<any> {
  return plankaFetch<any>(auth, `/api/boards/${boardId}/releases/${id}/snapshot`, {
    method: 'GET',
  });
}

/**
 * Delete a release
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param id - Release ID
 */
export async function deleteBoardRelease(
  auth: PlankaAuth,
  boardId: BoardId,
  id: ReleaseId,
): Promise<BoardRelease> {
  return plankaFetch<BoardRelease>(auth, `/api/boards/${boardId}/releases/${id}`, {
    method: 'DELETE',
  });
}
