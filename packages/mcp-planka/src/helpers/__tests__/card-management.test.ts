/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlankaAuth } from '../../types/index.js';
import * as cardsApi from '../../api/cards.js';
import * as boardsApi from '../../api/boards.js';
import * as api from '../../api/index.js';
import {
  createNewCard,
  updateCardDetails,
  moveCardToList,
  reorderCard,
  removeCard,
  copyCard,
  assignUserToCard,
  unassignUserFromCard,
  createMultipleCards,
  getCardsInList,
} from '../card-management.js';

vi.mock('../../api/cards.js');
vi.mock('../../api/boards.js');
vi.mock('../../api/index.js');

describe('Card Management Helpers', () => {
  const mockAuth: PlankaAuth = {
    plankaUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNewCard', () => {
    it('creates a basic card', async () => {
      const mockResponse = {
        item: {
          id: 'card-1',
          name: 'New Task',
          listId: 'list-1',
        },
      };

      vi.mocked(cardsApi.createCard).mockResolvedValue(mockResponse);

      const result = await createNewCard(mockAuth, 'list-1', 'New Task');

      expect(cardsApi.createCard).toHaveBeenCalledWith(
        mockAuth,
        'list-1',
        'New Task',
        undefined,
        undefined,
        undefined
      );
      expect(result.id).toBe('card-1');
      expect(result.name).toBe('New Task');
    });

    it('creates a card and assigns to current user', async () => {
      const mockCard = {
        item: { id: 'card-1', name: 'Task', listId: 'list-1' },
      };
      const mockUser = { id: 'user-1', name: 'Test User' };

      vi.mocked(cardsApi.createCard).mockResolvedValue(mockCard);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(cardsApi.assignMemberToCard).mockResolvedValue({});

      await createNewCard(mockAuth, 'list-1', 'Task', { assignToMe: true });

      expect(cardsApi.assignMemberToCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        'user-1'
      );
    });
  });

  describe('updateCardDetails', () => {
    it('updates card fields', async () => {
      await updateCardDetails(mockAuth, 'card-1', {
        name: 'Updated',
        description: 'New description',
      });

      expect(cardsApi.updateCard).toHaveBeenCalledWith(mockAuth, 'card-1', {
        name: 'Updated',
        description: 'New description',
      });
    });
  });

  describe('moveCardToList', () => {
    it('moves card to different list', async () => {
      await moveCardToList(mockAuth, 'card-1', 'list-2', 100);

      expect(cardsApi.moveCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        'list-2',
        100
      );
    });
  });

  describe('reorderCard', () => {
    it('reorders card in same list', async () => {
      vi.mocked(cardsApi.getCard).mockResolvedValue({
        item: { id: 'card-1', listId: 'list-1' },
      });

      await reorderCard(mockAuth, 'card-1', 50);

      expect(cardsApi.moveCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        'list-1',
        50
      );
    });
  });

  describe('copyCard', () => {
    it('duplicates a card', async () => {
      const mockDuplicate = {
        item: {
          id: 'card-2',
          name: 'Task (Copy)',
          listId: 'list-1',
        },
      };

      vi.mocked(cardsApi.duplicateCard).mockResolvedValue(mockDuplicate);

      const result = await copyCard(mockAuth, 'card-1');

      expect(result.id).toBe('card-2');
      expect(cardsApi.duplicateCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        undefined
      );
    });
  });

  describe('card membership', () => {
    it('assigns user to card', async () => {
      await assignUserToCard(mockAuth, 'card-1', 'user-1');
      expect(cardsApi.assignMemberToCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        'user-1'
      );
    });

    it('removes user from card', async () => {
      await unassignUserFromCard(mockAuth, 'card-1', 'user-1');
      expect(cardsApi.removeMemberFromCard).toHaveBeenCalledWith(
        mockAuth,
        'card-1',
        'user-1'
      );
    });
  });

  describe('createMultipleCards', () => {
    it('creates multiple cards', async () => {
      vi.mocked(cardsApi.createCard)
        .mockResolvedValueOnce({
          item: { id: 'card-1', name: 'Card 1', listId: 'list-1' },
        })
        .mockResolvedValueOnce({
          item: { id: 'card-2', name: 'Card 2', listId: 'list-1' },
        });

      const result = await createMultipleCards(mockAuth, 'list-1', ['Card 1', 'Card 2']);

      expect(result).toHaveLength(2);
      expect(cardsApi.createCard).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCardsInList', () => {
    it('calls getBoard with correct parameters', async () => {
      const mockBoardDetails = {
        included: {
          cards: [],
          cardMemberships: [],
          users: [],
        },
      };

      vi.mocked(api.getBoard).mockResolvedValue(mockBoardDetails);

      await getCardsInList(mockAuth, 'board-1', 'list-1');

      expect(api.getBoard).toHaveBeenCalledWith(mockAuth, 'board-1');
    });
  });
});
