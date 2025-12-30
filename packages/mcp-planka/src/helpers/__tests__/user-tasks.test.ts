/**
 * Unit Tests for User Tasks Helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getUserCards, getUserTasks, getCardHistory } from '../user-tasks.js';
import type { PlankaAuth } from '../../types/index.js';
import * as api from '../../api/index.js';
import * as actions from '../../api/actions.js';

vi.mock('../../api/index.js');
vi.mock('../../api/actions.js');

describe('User Tasks Helpers - Unit Tests', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  describe('getUserCards', () => {
    it('should get current user cards when userId is undefined', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project',
          included: { boards: [] },
        },
      ];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserCards(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
      expect(api.listProjects).toHaveBeenCalledWith(auth);
    });

    it('should get current user cards when userId is "me"', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserCards(auth, 'me');

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
    });

    it('should use provided userId when specified', async () => {
      const mockProjects = [];
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserCards(auth, 'user-123');

      expect(api.getCurrentUser).not.toHaveBeenCalled();
      expect(api.listProjects).toHaveBeenCalledWith(auth);
    });

    it('should return enriched cards with full context', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project',
        },
      ];

      const mockProjectDetails = {
        id: 'proj-1',
        name: 'Test Project',
        included: {
          boards: [{ id: 'board-1', name: 'Test Board' }],
          users: [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }],
        },
      };

      const mockBoardDetails = {
        id: 'board-1',
        name: 'Test Board',
        included: {
          lists: [{ id: 'list-1', name: 'To Do' }],
          cards: [
            {
              id: 'card-1',
              name: 'Test Card',
              description: 'Test description',
              position: 1,
              listId: 'list-1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
            },
          ],
          cardMemberships: [{ cardId: 'card-1', userId: 'user-1' }],
          cardLabels: [],
          labels: [],
          tasks: [],
          taskLists: [],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const cards = await getUserCards(auth, 'user-1');

      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({
        id: 'card-1',
        name: 'Test Card',
        projectName: 'Test Project',
        projectId: 'proj-1',
        boardName: 'Test Board',
        boardId: 'board-1',
        listName: 'To Do',
        assignees: [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }],
        isDone: false,
      });
    });

    it('should filter by done status', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: { boards: [{ id: 'board-1' }], users: [] },
      };
      const mockBoardDetails = {
        included: {
          lists: [{ id: 'list-1', name: 'To Do' }],
          cards: [
            { id: 'card-1', name: 'Done Card', listId: 'list-1', createdAt: '2024-01-01' },
            { id: 'card-2', name: 'Not Done Card', listId: 'list-1', createdAt: '2024-01-01' },
          ],
          cardMemberships: [
            { cardId: 'card-1', userId: 'user-1' },
            { cardId: 'card-2', userId: 'user-1' },
          ],
          cardLabels: [],
          labels: [],
          taskLists: [
            { id: 'tl-1', cardId: 'card-1' },
            { id: 'tl-2', cardId: 'card-2' },
          ],
          tasks: [
            { id: 't-1', taskListId: 'tl-1', isCompleted: true },
            { id: 't-2', taskListId: 'tl-2', isCompleted: false },
          ],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const doneCards = await getUserCards(auth, 'user-1', { done: true });
      expect(doneCards).toHaveLength(1);
      expect(doneCards[0].id).toBe('card-1');

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const undoneCards = await getUserCards(auth, 'user-1', { done: false });
      expect(undoneCards).toHaveLength(1);
      expect(undoneCards[0].id).toBe('card-2');
    });

    it('should sort cards by specified field', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: { boards: [{ id: 'board-1' }], users: [] },
      };
      const mockBoardDetails = {
        included: {
          lists: [{ id: 'list-1', name: 'To Do' }],
          cards: [
            { id: 'card-1', name: 'B Card', listId: 'list-1', createdAt: '2024-01-01', updatedAt: '2024-01-03' },
            { id: 'card-2', name: 'A Card', listId: 'list-1', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
            { id: 'card-3', name: 'C Card', listId: 'list-1', createdAt: '2024-01-03', updatedAt: '2024-01-01' },
          ],
          cardMemberships: [
            { cardId: 'card-1', userId: 'user-1' },
            { cardId: 'card-2', userId: 'user-1' },
            { cardId: 'card-3', userId: 'user-1' },
          ],
          cardLabels: [],
          labels: [],
          tasks: [],
          taskLists: [],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const sortedByName = await getUserCards(auth, 'user-1', {}, { by: 'name', order: 'asc' });
      expect(sortedByName[0].name).toBe('A Card');
      expect(sortedByName[1].name).toBe('B Card');
      expect(sortedByName[2].name).toBe('C Card');
    });
  });

  describe('getUserTasks', () => {
    it('should get current user tasks when userId is undefined', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserTasks(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
    });

    it('should return enriched tasks with card context', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: { boards: [{ id: 'board-1', name: 'Test Board' }] },
      };
      const mockBoardDetails = {
        included: {
          cards: [
            { id: 'card-1', name: 'Test Card', listId: 'list-1' },
          ],
          cardMemberships: [{ cardId: 'card-1', userId: 'user-1' }],
          taskLists: [{ id: 'tl-1', cardId: 'card-1', name: 'Task List' }],
          tasks: [
            { id: 't-1', name: 'Test Task', taskListId: 'tl-1', isCompleted: false, position: 1, createdAt: '2024-01-01' },
          ],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const tasks = await getUserTasks(auth, 'user-1');

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        id: 't-1',
        name: 'Test Task',
        isCompleted: false,
        cardName: 'Test Card',
        boardName: 'Test Board',
        projectName: 'Test Project',
      });
    });

    it('should filter completed tasks by default', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: { boards: [{ id: 'board-1' }] },
      };
      const mockBoardDetails = {
        included: {
          cards: [{ id: 'card-1', listId: 'list-1' }],
          cardMemberships: [{ cardId: 'card-1', userId: 'user-1' }],
          taskLists: [{ id: 'tl-1', cardId: 'card-1' }],
          tasks: [
            { id: 't-1', taskListId: 'tl-1', isCompleted: true, position: 1, createdAt: '2024-01-01' },
            { id: 't-2', taskListId: 'tl-1', isCompleted: false, position: 2, createdAt: '2024-01-01' },
          ],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const tasks = await getUserTasks(auth, 'user-1', { includeCompleted: false });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('t-2');
      expect(tasks[0].isCompleted).toBe(false);
    });
  });

  describe('getCardHistory', () => {
    it('should get card action history', async () => {
      const mockActions = [
        {
          id: 'action-1',
          type: 'createCard',
          userId: 'user-1',
          createdAt: '2024-01-01',
          data: {},
        },
        {
          id: 'action-2',
          type: 'updateCard',
          userId: 'user-2',
          createdAt: '2024-01-02',
          data: { name: 'Updated Name' },
        },
      ];

      vi.mocked(actions.getCardActions).mockResolvedValueOnce(mockActions);

      const history = await getCardHistory(auth, 'card-1');

      expect(actions.getCardActions).toHaveBeenCalledWith(auth, 'card-1');
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('createCard');
      expect(history[1].type).toBe('updateCard');
    });
  });
});
