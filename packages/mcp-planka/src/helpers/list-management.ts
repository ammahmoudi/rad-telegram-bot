/**
 * List Management Helpers
 * High-level functions for managing lists (create, update, reorder, archive)
 */

import type { PlankaAuth } from '../types/index.js';
import { getBoard } from '../api/index.js';
import { createList, updateList, archiveList, deleteList, moveCardsFromList, clearList, sortList } from '../api/lists.js';
import { resolveBoard, resolveList } from './resolvers.js';

/**
 * Create a new list in a board
 * @param projectIdentifier - Project ID or name
 * @param boardIdentifier - Board ID or name
 * @param name - List name
 * @param options - Optional settings
 */
export async function createBoardList(
  auth: PlankaAuth,
  projectIdentifier: string,
  boardIdentifier: string,
  name: string,
  options?: {
    position?: number;
    color?: string;
  }
): Promise<{
  id: string;
  name: string;
  boardId: string;
  position: number;
  color?: string;
}> {
  const board = await resolveBoard(auth, projectIdentifier, boardIdentifier);
  const list = await createList(
    auth,
    board.id,
    name,
    options?.position,
    options?.color
  );

  return {
    id: (list as any).item.id,
    name: (list as any).item.name,
    boardId: (list as any).item.boardId,
    position: (list as any).item.position,
    color: (list as any).item.color,
  };
}

/**
 * Get all lists in a board with their cards count
 * @param boardId - Board ID
 */
export async function getBoardLists(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  id: string;
  name: string;
  position: number;
  color?: string;
  cardCount: number;
}>> {
  const boardDetails = await getBoard(auth, boardId);
  const lists = (boardDetails as any)?.included?.lists ?? [];
  const cards = (boardDetails as any)?.included?.cards ?? [];

  return lists
    .map((list: any) => ({
      id: list.id,
      name: list.name,
      position: list.position,
      color: list.color,
      cardCount: cards.filter((c: any) => c.listId === list.id).length,
    }))
    .sort((a: any, b: any) => a.position - b.position);
}

/**
 * Update list properties (name, position, color)
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 * @param updates - Properties to update
 */
export async function updateBoardList(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string,
  updates: {
    name?: string;
    position?: number;
    color?: string;
  }
): Promise<void> {
  const list = await resolveList(auth, boardId, listIdentifier);
  await updateList(auth, list.id, updates);
}

/**
 * Archive a list (closes it)
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 */
export async function archiveBoardList(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string
): Promise<void> {
  const list = await resolveList(auth, boardId, listIdentifier);
  await archiveList(auth, list.id);
}

/**
 * Delete a list permanently
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 */
export async function deleteBoardList(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string
): Promise<void> {
  const list = await resolveList(auth, boardId, listIdentifier);
  await deleteList(auth, list.id);
}

/**
 * Move all cards from one list to another
 * @param boardId - Board ID
 * @param sourceListIdentifier - Source list ID or name
 * @param targetListIdentifier - Target list ID or name
 */
export async function moveAllCards(
  auth: PlankaAuth,
  boardId: string,
  sourceListIdentifier: string,
  targetListIdentifier: string
): Promise<void> {
  const sourceList = await resolveList(auth, boardId, sourceListIdentifier);
  const targetList = await resolveList(auth, boardId, targetListIdentifier);
  await moveCardsFromList(auth, sourceList.id, targetList.id);
}

/**
 * Clear all cards from a list (archives them)
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 */
export async function clearListCards(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string
): Promise<void> {
  const list = await resolveList(auth, boardId, listIdentifier);
  await clearList(auth, list.id);
}

/**
 * Sort cards in a list by name
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 */
export async function sortListCards(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string
): Promise<void> {
  const list = await resolveList(auth, boardId, listIdentifier);
  await sortList(auth, list.id);
}

/**
 * Create multiple lists at once
 * @param projectIdentifier - Project ID or name
 * @param boardIdentifier - Board ID or name
 * @param names - Array of list names
 */
export async function createMultipleLists(
  auth: PlankaAuth,
  projectIdentifier: string,
  boardIdentifier: string,
  names: string[]
): Promise<Array<{ id: string; name: string; position: number }>> {
  const results = [];
  
  for (let i = 0; i < names.length; i++) {
    const list = await createBoardList(auth, projectIdentifier, boardIdentifier, names[i], {
      position: (i + 1) * 65535,
    });
    results.push(list);
  }
  
  return results;
}
