import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, BoardLinkId, PlankaBoardLink } from '../types/index.js';

/**
 * Board Links API
 * Handles board link operations
 */

export interface BoardLink {
  id: BoardLinkId;
  boardId: BoardId;
  url: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBoardLinkData {
  url?: string;
  name?: string;
  position?: number;
}

/**
 * Get all links for a board
 * @param auth - Planka authentication
 * @param boardId - Board ID
 */
export async function getBoardLinks(
  auth: PlankaAuth,
  boardId: BoardId,
): Promise<BoardLink[]> {
  return plankaFetch<BoardLink[]>(auth, `/api/boards/${boardId}/links`, {
    method: 'GET',
  });
}

/**
 * Update board link
 * @param auth - Planka authentication
 * @param id - Board link ID
 * @param data - Link data to update
 */
export async function updateBoardLink(
  auth: PlankaAuth,
  id: BoardLinkId,
  data: UpdateBoardLinkData,
): Promise<BoardLink> {
  return plankaFetch<BoardLink>(auth, `/api/board-links/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete board link
 * @param auth - Planka authentication
 * @param id - Board link ID
 */
export async function deleteBoardLink(
  auth: PlankaAuth,
  id: BoardLinkId,
): Promise<BoardLink> {
  return plankaFetch<BoardLink>(auth, `/api/board-links/${id}`, {
    method: 'DELETE',
  });
}
