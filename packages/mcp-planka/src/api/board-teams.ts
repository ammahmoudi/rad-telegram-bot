import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, TeamId, BoardTeamId } from '../types/index.js';

/**
 * Board Teams API
 * Handles board team assignments
 */

export interface BoardTeam {
  id: BoardTeamId;
  boardId: BoardId;
  teamId: TeamId;
  role: 'viewer' | 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AddBoardTeamData {
  teamId: TeamId;
  role?: 'viewer' | 'member' | 'admin';
}

export interface UpdateBoardTeamData {
  role?: 'viewer' | 'member' | 'admin';
}

/**
 * Add team to board
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param data - Team data
 */
export async function addBoardTeam(
  auth: PlankaAuth,
  boardId: BoardId,
  data: AddBoardTeamData,
): Promise<BoardTeam> {
  return plankaFetch<BoardTeam>(auth, `/api/boards/${boardId}/board-teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get board teams
 * @param auth - Planka authentication
 * @param boardId - Board ID
 */
export async function getBoardTeams(
  auth: PlankaAuth,
  boardId: BoardId,
): Promise<BoardTeam[]> {
  return plankaFetch<BoardTeam[]>(auth, `/api/boards/${boardId}/board-teams`, {
    method: 'GET',
  });
}

/**
 * Update board team
 * @param auth - Planka authentication
 * @param id - Board team ID
 * @param data - Team data to update
 */
export async function updateBoardTeam(
  auth: PlankaAuth,
  id: BoardTeamId,
  data: UpdateBoardTeamData,
): Promise<BoardTeam> {
  return plankaFetch<BoardTeam>(auth, `/api/board-teams/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Remove team from board
 * @param auth - Planka authentication
 * @param id - Board team ID
 */
export async function removeBoardTeam(
  auth: PlankaAuth,
  id: BoardTeamId,
): Promise<BoardTeam> {
  return plankaFetch<BoardTeam>(auth, `/api/board-teams/${id}`, {
    method: 'DELETE',
  });
}
