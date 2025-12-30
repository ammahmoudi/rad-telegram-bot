/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlankaAuth } from '../../types/index.js';
import * as boardsApi from '../../api/boards.js';
import * as usersApi from '../../api/users.js';
import * as membershipApi from '../../api/board-memberships.js';
import {
  getBoardMembers,
  addUserToBoard,
  removeUserFromBoard,
  updateBoardMemberPermissions,
  getAvailableUsersForBoard,
  addMultipleUsersToBoard,
  getUserBoardMembership,
} from '../board-membership.js';

vi.mock('../../api/boards.js');
vi.mock('../../api/users.js');
vi.mock('../../api/board-memberships.js');

describe('Board Membership Helpers', () => {
  const mockAuth: PlankaAuth = {
    plankaUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBoardMembers', () => {
    it('returns board members with details', async () => {
      const mockBoardDetails = {
        included: {
          boardMemberships: [
            {
              id: 'mem-1',
              userId: 'user-1',
              role: 'editor',
              canComment: true,
            },
          ],
          users: [
            { id: 'user-1', name: 'John Doe', email: 'john@test.com' },
          ],
        },
      };

      vi.mocked(boardsApi.getBoard).mockResolvedValue(mockBoardDetails);

      const result = await getBoardMembers(mockAuth, 'board-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user-1',
        userName: 'John Doe',
        email: 'john@test.com',
        membershipId: 'mem-1',
        role: 'editor',
        canComment: true,
      });
    });
  });

  describe('addUserToBoard', () => {
    it('adds user as editor by default', async () => {
      const mockResponse = {
        item: {
          id: 'mem-1',
          userId: 'user-1',
          role: 'editor',
        },
      };

      vi.mocked(membershipApi.addBoardMembership).mockResolvedValue(mockResponse);

      const result = await addUserToBoard(mockAuth, 'board-1', 'user-1');

      expect(membershipApi.addBoardMembership).toHaveBeenCalledWith(
        mockAuth,
        'board-1',
        'user-1',
        'editor'
      );
      expect(result.role).toBe('editor');
    });

    it('adds user as viewer', async () => {
      const mockResponse = {
        item: {
          id: 'mem-1',
          userId: 'user-1',
          role: 'viewer',
        },
      };

      vi.mocked(membershipApi.addBoardMembership).mockResolvedValue(mockResponse);

      await addUserToBoard(mockAuth, 'board-1', 'user-1', 'viewer');

      expect(membershipApi.addBoardMembership).toHaveBeenCalledWith(
        mockAuth,
        'board-1',
        'user-1',
        'viewer'
      );
    });
  });

  describe('removeUserFromBoard', () => {
    it('removes board membership', async () => {
      await removeUserFromBoard(mockAuth, 'mem-1');
      expect(membershipApi.deleteBoardMembership).toHaveBeenCalledWith(
        mockAuth,
        'mem-1'
      );
    });
  });

  describe('updateBoardMemberPermissions', () => {
    it('updates role and comment permission', async () => {
      await updateBoardMemberPermissions(mockAuth, 'mem-1', {
        role: 'viewer',
        canComment: false,
      });

      expect(membershipApi.updateBoardMembership).toHaveBeenCalledWith(
        mockAuth,
        'mem-1',
        { role: 'viewer', canComment: false }
      );
    });
  });

  describe('getAvailableUsersForBoard', () => {
    it('returns users not in board', async () => {
      vi.mocked(usersApi.listUsers).mockResolvedValue([
        { id: 'user-1', name: 'John', email: 'john@test.com' },
        { id: 'user-2', name: 'Jane', email: 'jane@test.com' },
      ]);

      vi.mocked(boardsApi.getBoard).mockResolvedValue({
        included: {
          boardMemberships: [{ id: 'mem-1', userId: 'user-1', role: 'editor' }],
          users: [{ id: 'user-1', name: 'John', email: 'john@test.com' }],
        },
      });

      const result = await getAvailableUsersForBoard(mockAuth, 'board-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-2');
    });
  });

  describe('addMultipleUsersToBoard', () => {
    it('adds multiple users', async () => {
      vi.mocked(membershipApi.addBoardMembership)
        .mockResolvedValueOnce({ item: { id: 'mem-1', userId: 'user-1' } })
        .mockResolvedValueOnce({ item: { id: 'mem-2', userId: 'user-2' } });

      const result = await addMultipleUsersToBoard(
        mockAuth,
        'board-1',
        ['user-1', 'user-2'],
        'viewer'
      );

      expect(result).toHaveLength(2);
      expect(membershipApi.addBoardMembership).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserBoardMembership', () => {
    it('returns membership details', async () => {
      vi.mocked(boardsApi.getBoard).mockResolvedValue({
        included: {
          boardMemberships: [
            {
              id: 'mem-1',
              userId: 'user-1',
              role: 'editor',
              canComment: true,
            },
          ],
          users: [{ id: 'user-1', name: 'John', email: 'john@test.com' }],
        },
      });

      const result = await getUserBoardMembership(mockAuth, 'board-1', 'user-1');

      expect(result).toEqual({
        membershipId: 'mem-1',
        role: 'editor',
        canComment: true,
      });
    });

    it('returns null if user not a member', async () => {
      vi.mocked(boardsApi.getBoard).mockResolvedValue({
        included: {
          boardMemberships: [],
          users: [],
        },
      });

      const result = await getUserBoardMembership(mockAuth, 'board-1', 'user-1');

      expect(result).toBeNull();
    });
  });
});
