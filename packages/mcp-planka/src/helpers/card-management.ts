/**
 * Card Management Helpers
 * High-level functions for creating, updating, moving, and deleting cards
 */

import type { PlankaAuth } from '../types/index.js';
import { 
  createCard, 
  updateCard, 
  moveCard, 
  deleteCard, 
  duplicateCard,
  assignMemberToCard,
  removeMemberFromCard,
  getCard,
} from '../api/cards.js';
import { getBoard, getCurrentUser } from '../api/index.js';

/**
 * Create a new card in a list
 * @param listId - List ID
 * @param name - Card name
 * @param options - Optional card details
 */
export async function createNewCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  options?: {
    description?: string;
    dueDate?: string;
    position?: number;
    assignToMe?: boolean;
  }
): Promise<{
  id: string;
  name: string;
  listId: string;
  description?: string;
  dueDate?: string;
}> {
  const card = await createCard(
    auth,
    listId,
    name,
    options?.description,
    options?.position,
    options?.dueDate
  );

  const cardId = (card as any).item.id;

  // Assign to current user if requested
  if (options?.assignToMe) {
    const currentUser = await getCurrentUser(auth);
    await assignMemberToCard(auth, cardId, currentUser.id);
  }

  return {
    id: cardId,
    name: (card as any).item.name,
    listId: (card as any).item.listId,
    description: (card as any).item.description,
    dueDate: (card as any).item.dueDate,
  };
}

/**
 * Update card details
 * @param cardId - Card ID
 * @param updates - Fields to update
 */
export async function updateCardDetails(
  auth: PlankaAuth,
  cardId: string,
  updates: {
    name?: string;
    description?: string;
    dueDate?: string;
  }
): Promise<void> {
  await updateCard(auth, cardId, updates);
}

/**
 * Move a card to a different list
 * @param cardId - Card ID
 * @param targetListId - Target list ID
 * @param position - Optional position in target list
 */
export async function moveCardToList(
  auth: PlankaAuth,
  cardId: string,
  targetListId: string,
  position?: number
): Promise<void> {
  await moveCard(auth, cardId, targetListId, position);
}

/**
 * Reorder a card within its current list
 * @param cardId - Card ID
 * @param position - New position
 */
export async function reorderCard(
  auth: PlankaAuth,
  cardId: string,
  position: number
): Promise<void> {
  const card = await getCard(auth, cardId);
  const listId = (card as any).item.listId;
  await moveCard(auth, cardId, listId, position);
}

/**
 * Delete a card
 * @param cardId - Card ID
 */
export async function removeCard(
  auth: PlankaAuth,
  cardId: string
): Promise<void> {
  await deleteCard(auth, cardId);
}

/**
 * Duplicate a card in the same list
 * @param cardId - Card ID to duplicate
 * @param position - Optional position for the duplicate
 */
export async function copyCard(
  auth: PlankaAuth,
  cardId: string,
  position?: number
): Promise<{
  id: string;
  name: string;
  listId: string;
}> {
  const duplicate = await duplicateCard(auth, cardId, position);

  return {
    id: (duplicate as any).item.id,
    name: (duplicate as any).item.name,
    listId: (duplicate as any).item.listId,
  };
}

/**
 * Assign a user to a card
 * @param cardId - Card ID
 * @param userId - User ID to assign
 */
export async function assignUserToCard(
  auth: PlankaAuth,
  cardId: string,
  userId: string
): Promise<void> {
  await assignMemberToCard(auth, cardId, userId);
}

/**
 * Remove a user from a card
 * @param cardId - Card ID
 * @param userId - User ID to remove
 */
export async function unassignUserFromCard(
  auth: PlankaAuth,
  cardId: string,
  userId: string
): Promise<void> {
  await removeMemberFromCard(auth, cardId, userId);
}

/**
 * Create multiple cards at once
 * @param listId - List ID
 * @param cardNames - Array of card names
 */
export async function createMultipleCards(
  auth: PlankaAuth,
  listId: string,
  cardNames: string[]
): Promise<Array<{ id: string; name: string }>> {
  const results = [];
  
  for (let i = 0; i < cardNames.length; i++) {
    const card = await createNewCard(auth, listId, cardNames[i], {
      position: (i + 1) * 65535,
    });
    results.push({ id: card.id, name: card.name });
  }
  
  return results;
}

/**
 * Get cards in a list
 * @param boardId - Board ID
 * @param listId - List ID
 */
export async function getCardsInList(
  auth: PlankaAuth,
  boardId: string,
  listId: string
): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  position: number;
  dueDate?: string;
  assignees: Array<{ id: string; name: string }>;
}>> {
  const boardDetails = await getBoard(auth, boardId);
  const cards = (boardDetails as any)?.included?.cards ?? [];
  const cardMemberships = (boardDetails as any)?.included?.cardMemberships ?? [];
  const users = (boardDetails as any)?.included?.users ?? [];

  return cards
    .filter((c: any) => c.listId === listId)
    .map((card: any) => {
      const memberships = cardMemberships.filter((m: any) => m.cardId === card.id);
      const assignees = memberships.map((m: any) => {
        const user = users.find((u: any) => u.id === m.userId);
        return { id: m.userId, name: user?.name || 'Unknown' };
      });

      return {
        id: card.id,
        name: card.name,
        description: card.description,
        position: card.position,
        dueDate: card.dueDate,
        assignees,
      };
    })
    .sort((a: any, b: any) => a.position - b.position);
}
