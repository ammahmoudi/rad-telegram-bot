/**
 * List Management Helpers
 * High-level functions for managing lists (create, update, reorder, archive)
 */

import type { PlankaAuth } from '../types/index.js';
import { getBoard } from '../api/index.js';
import { createList, updateList, archiveList, deleteList, moveCardsFromList, clearList, sortList } from '../api/lists.js';

/**
 * Create a new list in a board
 * @param boardId - Board ID
 * @param name - List name
 * @param options - Optional settings
 */
export async function createBoardList(
  auth: PlankaAuth,
  boardId: string,
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
  const list = await createList(
    auth,
    boardId,
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
 * @param listId - List ID
 * @param updates - Properties to update
 */
export async function updateBoardList(
  auth: PlankaAuth,
  listId: string,
  updates: {
    name?: string;
    position?: number;
    color?: string;
  }
): Promise<void> {
  await updateList(auth, listId, updates);
}

/**
 * Archive a list (closes it)
 * @param listId - List ID
 */
export async function archiveBoardList(
  auth: PlankaAuth,
  listId: string
): Promise<void> {
  await archiveList(auth, listId);
}

/**
 * Delete a list permanently
 * @param listId - List ID
 */
export async function deleteBoardList(
  auth: PlankaAuth,
  listId: string
): Promise<void> {
  await deleteList(auth, listId);
}

/**
 * Move all cards from one list to another
 * @param sourceListId - Source list ID
 * @param targetListId - Target list ID
 */
export async function moveAllCards(
  auth: PlankaAuth,
  sourceListId: string,
  targetListId: string
): Promise<void> {
  await moveCardsFromList(auth, sourceListId, targetListId);
}

/**
 * Clear all cards from a list (archives them)
 * @param listId - List ID
 */
export async function clearListCards(
  auth: PlankaAuth,
  listId: string
): Promise<void> {
  await clearList(auth, listId);
}

/**
 * Sort cards in a list by name
 * @param listId - List ID
 */
export async function sortListCards(
  auth: PlankaAuth,
  listId: string
): Promise<void> {
  await sortList(auth, listId);
}

/**
 * Create multiple lists at once
 * @param boardId - Board ID
 * @param names - Array of list names
 */
export async function createMultipleLists(
  auth: PlankaAuth,
  boardId: string,
  names: string[]
): Promise<Array<{ id: string; name: string; position: number }>> {
  const results = [];
  
  for (let i = 0; i < names.length; i++) {
    const list = await createBoardList(auth, boardId, names[i], {
      position: (i + 1) * 65535,
    });
    results.push(list);
  }
  
  return results;
}
