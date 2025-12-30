/**
 * Board Membership Helpers
 * High-level functions for managing board members and permissions
 */

import type { PlankaAuth } from '../types/index.js';
import { getBoard } from '../api/index.js';
import { listUsers } from '../api/users.js';
import { addBoardMembership, updateBoardMembership, deleteBoardMembership } from '../api/board-memberships.js';

/**
 * Get all members of a board
 * @param boardId - Board ID
 */
export async function getBoardMembers(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  userId: string;
  userName: string;
  email: string;
  membershipId: string;
  role: string;
  canComment: boolean;
}>> {
  const boardDetails = await getBoard(auth, boardId);
  const memberships = (boardDetails as any)?.included?.boardMemberships ?? [];
  const users = (boardDetails as any)?.included?.users ?? [];

  return memberships.map((membership: any) => {
    const user = users.find((u: any) => u.id === membership.userId);
    return {
      userId: membership.userId,
      userName: user?.name || 'Unknown',
      email: user?.email || '',
      membershipId: membership.id,
      role: membership.role,
      canComment: membership.canComment ?? true,
    };
  });
}

/**
 * Add a user to a board
 * @param boardId - Board ID
 * @param userId - User ID to add
 * @param role - Role ('editor' or 'viewer')
 */
export async function addUserToBoard(
  auth: PlankaAuth,
  boardId: string,
  userId: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<{
  membershipId: string;
  userId: string;
  role: string;
}> {
  const membership = await addBoardMembership(auth, boardId, userId, role);

  return {
    membershipId: (membership as any).item.id,
    userId: (membership as any).item.userId,
    role: (membership as any).item.role,
  };
}

/**
 * Remove a user from a board
 * @param membershipId - Board membership ID
 */
export async function removeUserFromBoard(
  auth: PlankaAuth,
  membershipId: string
): Promise<void> {
  await deleteBoardMembership(auth, membershipId);
}

/**
 * Update a board member's permissions
 * @param membershipId - Board membership ID
 * @param updates - Role and/or comment permission
 */
export async function updateBoardMemberPermissions(
  auth: PlankaAuth,
  membershipId: string,
  updates: {
    role?: 'editor' | 'viewer';
    canComment?: boolean;
  }
): Promise<void> {
  await updateBoardMembership(auth, membershipId, updates);
}

/**
 * Find users not in a board (for adding)
 * @param boardId - Board ID
 */
export async function getAvailableUsersForBoard(
  auth: PlankaAuth,
  boardId: string
): Promise<Array<{
  id: string;
  name: string;
  email: string;
}>> {
  const allUsers = await listUsers(auth);
  const boardMembers = await getBoardMembers(auth, boardId);
  const memberUserIds = new Set(boardMembers.map(m => m.userId));

  return (allUsers as any)
    .filter((user: any) => !memberUserIds.has(user.id))
    .map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
}

/**
 * Add multiple users to a board at once
 * @param boardId - Board ID
 * @param userIds - Array of user IDs
 * @param role - Role for all users ('editor' or 'viewer')
 */
export async function addMultipleUsersToBoard(
  auth: PlankaAuth,
  boardId: string,
  userIds: string[],
  role: 'editor' | 'viewer' = 'editor'
): Promise<Array<{ userId: string; membershipId: string }>> {
  const results = [];
  
  for (const userId of userIds) {
    const membership = await addUserToBoard(auth, boardId, userId, role);
    results.push({
      userId: membership.userId,
      membershipId: membership.membershipId,
    });
  }
  
  return results;
}

/**
 * Get user's membership info on a board (returns null if not a member)
 * @param boardId - Board ID
 * @param userId - User ID
 */
export async function getUserBoardMembership(
  auth: PlankaAuth,
  boardId: string,
  userId: string
): Promise<{
  membershipId: string;
  role: string;
  canComment: boolean;
} | null> {
  const members = await getBoardMembers(auth, boardId);
  const membership = members.find(m => m.userId === userId);
  
  if (!membership) return null;
  
  return {
    membershipId: membership.membershipId,
    role: membership.role,
    canComment: membership.canComment,
  };
}
