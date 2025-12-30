/**
 * Unit Tests for Daily Reports Helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDailyReportProjects,
  getUserDailyReports,
  getMissingDailyReports,
  generateDailyReportFromTasks,
  getTodayDate,
  getYesterdayDate,
} from '../daily-reports.js';
import type { PlankaAuth } from '../../types/index.js';
import * as api from '../../api/index.js';
import * as userActivity from '../user-activity.js';

vi.mock('../../api/index.js');
vi.mock('../user-activity.js');

describe('Daily Reports Helpers - Unit Tests', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  describe('getDailyReportProjects', () => {
    it('should filter daily report projects', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Daily report - Team A' },
        { id: 'proj-2', name: 'Regular Project' },
        { id: 'proj-3', name: 'Daily Report - Team B' }, // Different case
      ];

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      const result = await getDailyReportProjects(auth);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Daily report - Team A');
      expect(result[1].name).toBe('Daily Report - Team B');
    });
  });

  describe('getUserDailyReports', () => {
    it('should get current user daily reports when userId is undefined', async () => {
      const mockCurrentUser = { item: { id: 'current-user-123' } };
      const mockProjects = [];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);

      await getUserDailyReports(auth);

      expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
    });

    it('should return daily report entries with parsed dates', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Daily report - Team' },
      ];

      const mockProjectDetails = {
        id: 'proj-1',
        name: 'Daily report - Team',
        included: {
          boards: [{ id: 'board-1', name: 'John Doe' }],
          users: [{ id: 'user-1', name: 'John Doe' }],
        },
      };

      const mockBoardDetails = {
        included: {
          lists: [{ id: 'list-1', name: 'Season 1' }],
          cards: [
            {
              id: 'card-1',
              name: '2024-12-29',
              description: 'Did some work',
              listId: 'list-1',
              createdAt: '2024-12-29T10:00:00Z',
            },
          ],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const reports = await getUserDailyReports(auth, 'user-1');

      expect(reports).toHaveLength(1);
      expect(reports[0]).toMatchObject({
        date: '2024-12-29',
        cardName: '2024-12-29',
        content: 'Did some work',
        userName: 'John Doe',
        listName: 'Season 1',
      });
    });

    it('should filter by date range', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Daily report - Team' }];
      const mockProjectDetails = {
        included: {
          boards: [{ id: 'board-1', name: 'John Doe' }],
          users: [{ id: 'user-1', name: 'John Doe' }],
        },
      };
      const mockBoardDetails = {
        included: {
          lists: [{ id: 'list-1', name: 'Season 1' }],
          cards: [
            { id: 'card-1', name: '2024-12-15', listId: 'list-1', createdAt: '2024-12-15' },
            { id: 'card-2', name: '2024-12-25', listId: 'list-1', createdAt: '2024-12-25' },
            { id: 'card-3', name: '2024-12-30', listId: 'list-1', createdAt: '2024-12-30' },
          ],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const reports = await getUserDailyReports(auth, 'user-1', {
        startDate: '2024-12-20',
        endDate: '2024-12-29',
      });

      expect(reports).toHaveLength(1);
      expect(reports[0].date).toBe('2024-12-25');
    });
  });

  describe('getMissingDailyReports', () => {
    it('should return users with missing dates in date range', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Daily report - Team' }];
      const mockProjectDetails = {
        id: 'proj-1',
        included: {
          boards: [
            { id: 'board-1', name: 'John Doe' },
            { id: 'board-2', name: 'Jane Smith' },
          ],
          users: [
            { id: 'user-1', name: 'John Doe' },
            { id: 'user-2', name: 'Jane Smith' },
          ],
        },
      };

      // John has report on 29th, Jane doesn't have any
      const mockBoard1Details = {
        included: {
          cards: [
            { id: 'card-1', name: '2024-12-29', createdAt: '2024-12-29T10:00:00Z' },
          ],
        },
      };
      const mockBoard2Details = {
        included: {
          cards: [],
        },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard)
        .mockResolvedValueOnce(mockBoard1Details)
        .mockResolvedValueOnce(mockBoard2Details);

      // Check for 3 days (Sun, Mon, Tue) - Thu/Fri are weekends so skipped
      const missing = await getMissingDailyReports(auth, '2024-12-29', '2024-12-31');

      expect(missing).toHaveLength(2); // Both users have some missing dates
      
      const johnMissing = missing.find(u => u.userName === 'John Doe');
      const janeMissing = missing.find(u => u.userName === 'Jane Smith');
      
      expect(johnMissing?.missingDates).toContain('2024-12-30'); // Missing Mon
      expect(johnMissing?.missingDates).toContain('2024-12-31'); // Missing Tue
      expect(johnMissing?.missingDates).not.toContain('2024-12-29'); // Has report
      
      expect(janeMissing?.missingDates).toHaveLength(3); // Missing all 3 days
    });

    it('should filter to specific user when userId provided', async () => {
      const mockProjects = [{ id: 'proj-1', name: 'Daily report - Team' }];
      const mockProjectDetails = {
        id: 'proj-1',
        included: {
          boards: [
            { id: 'board-1', name: 'John Doe' },
            { id: 'board-2', name: 'Jane Smith' },
          ],
          users: [
            { id: 'user-1', name: 'John Doe' },
            { id: 'user-2', name: 'Jane Smith' },
          ],
        },
      };

      const mockBoardDetails = {
        included: { cards: [] },
      };

      vi.mocked(api.listProjects).mockResolvedValueOnce(mockProjects);
      vi.mocked(api.getProject).mockResolvedValueOnce(mockProjectDetails);
      vi.mocked(api.getBoard).mockResolvedValueOnce(mockBoardDetails);

      const missing = await getMissingDailyReports(auth, '2024-12-29', '2024-12-31', {
        userId: 'user-1',
      });

      expect(missing).toHaveLength(1);
      expect(missing[0].userName).toBe('John Doe');
    });
  });

  describe('generateDailyReportFromTasks', () => {
    it('should generate report from user activities', async () => {
      const mockCurrentUser = { item: { id: 'user-1' } };
      const mockActivities = [
        {
          id: 'act-1',
          type: 'updateTask',
          data: { name: 'Fix bug', isCompleted: true },
          cardName: 'Bug fixes',
          projectName: 'Project A',
          timestamp: '2024-12-29T10:00:00Z',
          description: 'Completed task',
          userId: 'user-1',
          userName: 'John',
        },
        {
          id: 'act-2',
          type: 'createCard',
          cardName: 'New feature',
          projectName: 'Project B',
          timestamp: '2024-12-29T14:00:00Z',
          description: 'Created card',
          userId: 'user-1',
          userName: 'John',
          data: {},
        },
      ];

      vi.mocked(api.getCurrentUser).mockResolvedValueOnce(mockCurrentUser);
      vi.mocked(userActivity.getUserActions).mockResolvedValueOnce(mockActivities);

      const report = await generateDailyReportFromTasks(auth, '2024-12-29');

      expect(report).toContain('# Daily Report - 2024-12-29');
      expect(report).toContain('## Completed Tasks');
      expect(report).toContain('Fix bug');
      expect(report).toContain('## Card Activities');
      expect(report).toContain('New feature');
    });
  });

  describe('Date Helpers', () => {
    it('should get today date', () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should get yesterday date', () => {
      const yesterday = getYesterdayDate();
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const todayDate = new Date(getTodayDate());
      const yesterdayDate = new Date(yesterday);
      const diff = todayDate.getTime() - yesterdayDate.getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeCloseTo(1, 0);
    });
  });
});
