/**
 * Unit Tests for Project Status Helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProjectStatus,
  getBoardStatus,
} from '../project-status.js';
import type { PlankaAuth } from '../../types/index.js';
import * as api from '../../api/index.js';
import * as actions from '../../api/actions.js';

vi.mock('../../api/index.js');
vi.mock('../../api/actions.js');

describe('Project Status Helpers - Unit Tests', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  describe('getProjectStatus', () => {
    it('should return project status with board summaries', async () => {
      const mockProjectDetails = {
        name: 'Test Project',
        included: {
          boards: [
            { id: 'board-1', name: 'Board 1' },
            { id: 'board-2', name: 'Board 2' },
          ],
        },
      };

      const mockBoard1Details = {
        included: {
          cards: [
            { id: 'card-1', dueDate: null, updatedAt: '2024-01-01' },
            { id: 'card-2', dueDate: null, updatedAt: '2024-01-02' },
          ],
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

      const mockBoard2Details = {
        included: {
          cards: [],
          taskLists: [],
          tasks: [],
        },
      };

      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard)
        .mockResolvedValueOnce(mockBoard1Details)
        .mockResolvedValueOnce(mockBoard2Details);
      vi.mocked(actions.getBoardActions).mockResolvedValue([]);

      const status = await getProjectStatus(auth, 'proj-1');

      expect(status.projectName).toBe('Test Project');
      expect(status.boards).toHaveLength(2);
      expect(status.totalCards).toBe(2);
      expect(status.doneCards).toBe(1);
      expect(status.completionPercentage).toBe(50);
    });

    it('should calculate overdue cards', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockProjectDetails = {
        name: 'Test Project',
        included: {
          boards: [{ id: 'board-1', name: 'Board 1' }],
        },
      };

      const mockBoardDetails = {
        included: {
          cards: [
            { id: 'card-1', dueDate: yesterday.toISOString(), updatedAt: '2024-01-01' },
          ],
          taskLists: [{ id: 'tl-1', cardId: 'card-1' }],
          tasks: [{ id: 't-1', taskListId: 'tl-1', isCompleted: false }],
        },
      };

      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);
      vi.mocked(actions.getBoardActions).mockResolvedValue([]);

      const status = await getProjectStatus(auth, 'proj-1');

      expect(status.boards[0].overdueCards).toBe(1);
    });
  });

  describe('getBoardStatus', () => {
    it('should return board status with list summaries', async () => {
      const mockBoardDetails = {
        name: 'Test Board',
        projectId: 'proj-1',
        included: {
          lists: [
            { id: 'list-1', name: 'To Do' },
            { id: 'list-2', name: 'Done' },
          ],
          cards: [
            { id: 'card-1', listId: 'list-1', updatedAt: '2024-01-01' },
            { id: 'card-2', listId: 'list-2', updatedAt: '2024-01-02' },
          ],
          taskLists: [
            { id: 'tl-1', cardId: 'card-1' },
            { id: 'tl-2', cardId: 'card-2' },
          ],
          tasks: [
            { id: 't-1', taskListId: 'tl-1', isCompleted: false },
            { id: 't-2', taskListId: 'tl-2', isCompleted: true },
          ],
        },
      };

      const mockProjectDetails = {
        name: 'Test Project',
      };

      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(actions.getBoardActions).mockResolvedValue([]);

      const status = await getBoardStatus(auth, 'board-1');

      expect(status.boardName).toBe('Test Board');
      expect(status.projectName).toBe('Test Project');
      expect(status.lists).toHaveLength(2);
      expect(status.totalCards).toBe(2);
      expect(status.doneCards).toBe(1);
      expect(status.completionPercentage).toBe(50);
    });
  });

  describe('getProjectUndoneTasks', () => {
    it.skip('should return undone tasks for project (function not implemented)', async () => {
      const mockProjectDetails = {
        included: {
          boards: [{ id: 'board-1', name: 'Board 1' }],
        },
      };

      const mockBoardDetails = {
        name: 'Board 1',
        projectId: 'proj-1',
        included: {
          lists: [{ id: 'list-1', name: 'To Do' }],
          cards: [
            { id: 'card-1', listId: 'list-1', name: 'Undone Card', createdAt: '2024-01-01' },
            { id: 'card-2', listId: 'list-1', name: 'Done Card', createdAt: '2024-01-01' },
          ],
          cardMemberships: [],
          cardLabels: [],
          labels: [],
          taskLists: [
            { id: 'tl-1', cardId: 'card-1' },
            { id: 'tl-2', cardId: 'card-2' },
          ],
          tasks: [
            { id: 't-1', taskListId: 'tl-1', isCompleted: false },
            { id: 't-2', taskListId: 'tl-2', isCompleted: true },
          ],
          users: [],
        },
      };

      const mockProject = {
        name: 'Test Project',
      };

      vi.mocked(api.getProject)
        .mockResolvedValueOnce(mockProjectDetails)
        .mockResolvedValueOnce(mockProject);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const tasks = await getProjectUndoneTasks(auth, 'proj-1');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('card-1');
      expect(tasks[0].isDone).toBe(false);
    });
  });

  describe('getBoardUndoneTasks', () => {
    it.skip('should return undone tasks for board (function not implemented)', async () => {
      const mockBoardDetails = {
        name: 'Test Board',
        projectId: 'proj-1',
        included: {
          lists: [{ id: 'list-1', name: 'To Do' }],
          cards: [
            { id: 'card-1', listId: 'list-1', name: 'Undone', createdAt: '2024-01-01' },
          ],
          cardMemberships: [],
          cardLabels: [],
          labels: [],
          taskLists: [{ id: 'tl-1', cardId: 'card-1' }],
          tasks: [{ id: 't-1', taskListId: 'tl-1', isCompleted: false }],
          users: [],
        },
      };

      const mockProjectDetails = {
        name: 'Test Project',
      };

      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);

      const tasks = await getBoardUndoneTasks(auth, 'board-1');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].isDone).toBe(false);
    });
  });
});
