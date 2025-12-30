/**
 * Unit Tests for User Activity Helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserNotifications,
  getUserActivity,
  getUserTodayActivity,
  getUserWeekActivity,
} from '../user-activity.js';
import type { PlankaAuth } from '../../types/index.js';
import * as api from '../../api/index.js';
import * as notifications from '../../api/notifications.js';
import * as actions from '../../api/actions.js';

vi.mock('../../api/index.js');
vi.mock('../../api/notifications.js');
vi.mock('../../api/actions.js');

describe('User Activity Helpers - Unit Tests', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should get current user notifications when userId is undefined', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockNotifications = [
        { id: 'notif-1', userId: 'current-user-123', isRead: false, createdAt: '2024-01-01' },
      ];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(notifications.getNotifications).mockResolvedValueOnce(mockNotifications);

      const result = await getUserNotifications(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
      expect(result).toHaveLength(1);
    });

    it('should filter notifications by user', async () => {
      const mockNotifications = [
        { id: 'notif-1', userId: 'user-1', isRead: false, createdAt: '2024-01-01' },
        { id: 'notif-2', userId: 'user-2', isRead: false, createdAt: '2024-01-02' },
      ];

      vi.mocked(notifications.getNotifications).mockResolvedValueOnce(mockNotifications);

      const result = await getUserNotifications(auth, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should filter unread notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', userId: 'user-1', isRead: false, createdAt: '2024-01-01' },
        { id: 'notif-2', userId: 'user-1', isRead: true, createdAt: '2024-01-02' },
      ];

      vi.mocked(notifications.getNotifications).mockResolvedValueOnce(mockNotifications);

      const result = await getUserNotifications(auth, 'user-1', { unreadOnly: true });

      expect(result).toHaveLength(1);
      expect(result[0].isRead).toBe(false);
    });

    it('should limit results', async () => {
      const mockNotifications = Array.from({ length: 10 }, (_, i) => ({
        id: `notif-${i}`,
        userId: 'user-1',
        isRead: false,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      vi.mocked(notifications.getNotifications).mockResolvedValueOnce(mockNotifications);

      const result = await getUserNotifications(auth, 'user-1', { limit: 5 });

      expect(result).toHaveLength(5);
    });
  });

  describe('getUserActivity', () => {
    it('should get current user activity when userId is undefined', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserActivity(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
    });

    it('should return activities with enriched context', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: {
          boards: [{ id: 'board-1', name: 'Test Board' }],
          users: [{ id: 'user-1', name: 'Test User' }],
        },
      };
      const mockActions = [
        {
          id: 'action-1',
          type: 'createCard',
          userId: 'user-1',
          cardId: 'card-1',
          createdAt: '2024-01-01T10:00:00Z',
          data: {},
        },
      ];
      const mockBoardDetails = {
        included: {
          cards: [{ id: 'card-1', name: 'Test Card' }],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(actions.getBoardActions).mockResolvedValueOnce(mockActions);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const result = await getUserActivity(auth, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'action-1',
        type: 'createCard',
        userName: 'Test User',
        cardName: 'Test Card',
        boardName: 'Test Board',
        projectName: 'Test Project',
      });
    });

    it('should filter by date range', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: {
          boards: [{ id: 'board-1' }],
          users: [{ id: 'user-1' }],
        },
      };
      const mockActions = [
        {
          id: 'action-1',
          type: 'createCard',
          userId: 'user-1',
          createdAt: '2024-01-15T10:00:00Z',
          data: {},
        },
        {
          id: 'action-2',
          type: 'updateCard',
          userId: 'user-1',
          createdAt: '2024-01-25T10:00:00Z',
          data: {},
        },
      ];

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(actions.getBoardActions).mockResolvedValueOnce(mockActions);

      const result = await getUserActivity(auth, 'user-1', {
        startDate: '2024-01-10T00:00:00Z',
        endDate: '2024-01-20T00:00:00Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('action-1');
    });

    it('should limit results', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Test Project' }];
      const mockProjectDetails = {
        included: {
          boards: [{ id: 'board-1' }],
          users: [{ id: 'user-1', name: 'Test User' }],
        },
      };
      const mockActions = Array.from({ length: 10 }, (_, i) => ({
        id: `action-${i}`,
        type: 'updateCard',
        userId: 'user-1',
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        data: {},
      }));

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(actions.getBoardActions).mockResolvedValueOnce(mockActions);

      const result = await getUserActivity(auth, 'user-1', { limit: 5 });

      expect(result).toHaveLength(5);
    });
  });

  describe('getUserTodayActivity', () => {
    it('should get activities for today', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserTodayActivity(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
      expect(api.listProjects).toHaveBeenCalled();
    });
  });

  describe('getUserWeekActivity', () => {
    it('should get activities for this week', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserWeekActivity(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
      expect(api.listProjects).toHaveBeenCalled();
    });
  });
});
