/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlankaAuth } from '../../types/index.js';
import * as listsApi from '../../api/lists.js';
import * as boardsApi from '../../api/boards.js';
import {
  createBoardList,
  getBoardLists,
  updateBoardList,
  archiveBoardList,
  deleteBoardList,
  moveAllCards,
  clearListCards,
  sortListCards,
  createMultipleLists,
} from '../list-management.js';

vi.mock('../../api/lists.js');
vi.mock('../../api/boards.js');

describe('List Management Helpers', () => {
  const mockAuth: PlankaAuth = {
    plankaUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBoardList', () => {
    it('creates a new list with basic info', async () => {
      const mockResponse = {
        item: {
          id: 'list-1',
          name: 'To Do',
          boardId: 'board-1',
          position: 65535,
        },
      };

      vi.mocked(listsApi.createList).mockResolvedValue(mockResponse);

      const result = await createBoardList(mockAuth, 'board-1', 'To Do');

      expect(listsApi.createList).toHaveBeenCalledWith(
        mockAuth,
        'board-1',
        'To Do',
        undefined,
        undefined
      );
      expect(result).toEqual({
        id: 'list-1',
        name: 'To Do',
        boardId: 'board-1',
        position: 65535,
      });
    });

    it('creates a list with position and color', async () => {
      const mockResponse = {
        item: {
          id: 'list-2',
          name: 'Done',
          boardId: 'board-1',
          position: 131070,
          color: 'green',
        },
      };

      vi.mocked(listsApi.createList).mockResolvedValue(mockResponse);

      const result = await createBoardList(mockAuth, 'board-1', 'Done', {
        position: 131070,
        color: 'green',
      });

      expect(result.color).toBe('green');
      expect(result.position).toBe(131070);
    });
  });

  describe('getBoardLists', () => {
    it('returns lists with card counts', async () => {
      const mockBoardDetails = {
        included: {
          lists: [
            { id: 'list-1', name: 'To Do', position: 1 },
            { id: 'list-2', name: 'Done', position: 2 },
          ],
          cards: [
            { id: 'card-1', listId: 'list-1' },
            { id: 'card-2', listId: 'list-1' },
            { id: 'card-3', listId: 'list-2' },
          ],
        },
      };

      vi.mocked(boardsApi.getBoard).mockResolvedValue(mockBoardDetails);

      const result = await getBoardLists(mockAuth, 'board-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'list-1',
        name: 'To Do',
        position: 1,
        cardCount: 2,
      });
      expect(result[1].cardCount).toBe(1);
    });
  });

  describe('updateBoardList', () => {
    it('updates list properties', async () => {
      await updateBoardList(mockAuth, 'list-1', {
        name: 'New Name',
        position: 100,
      });

      expect(listsApi.updateList).toHaveBeenCalledWith(mockAuth, 'list-1', {
        name: 'New Name',
        position: 100,
      });
    });
  });

  describe('createMultipleLists', () => {
    it('creates multiple lists with increasing positions', async () => {
      vi.mocked(listsApi.createList)
        .mockResolvedValueOnce({
          item: { id: 'list-1', name: 'List 1', boardId: 'board-1', position: 65535 },
        })
        .mockResolvedValueOnce({
          item: { id: 'list-2', name: 'List 2', boardId: 'board-1', position: 131070 },
        });

      const result = await createMultipleLists(mockAuth, 'board-1', ['List 1', 'List 2']);

      expect(result).toHaveLength(2);
      expect(listsApi.createList).toHaveBeenCalledTimes(2);
      expect(result[0].name).toBe('List 1');
      expect(result[1].name).toBe('List 2');
    });
  });

  describe('list operations', () => {
    it('archives a list', async () => {
      await archiveBoardList(mockAuth, 'list-1');
      expect(listsApi.archiveList).toHaveBeenCalledWith(mockAuth, 'list-1');
    });

    it('deletes a list', async () => {
      await deleteBoardList(mockAuth, 'list-1');
      expect(listsApi.deleteList).toHaveBeenCalledWith(mockAuth, 'list-1');
    });

    it('moves all cards', async () => {
      await moveAllCards(mockAuth, 'list-1', 'list-2');
      expect(listsApi.moveCardsFromList).toHaveBeenCalledWith(mockAuth, 'list-1', 'list-2');
    });

    it('clears list cards', async () => {
      await clearListCards(mockAuth, 'list-1');
      expect(listsApi.clearList).toHaveBeenCalledWith(mockAuth, 'list-1');
    });

    it('sorts list cards', async () => {
      await sortListCards(mockAuth, 'list-1');
      expect(listsApi.sortList).toHaveBeenCalledWith(mockAuth, 'list-1');
    });
  });
});
