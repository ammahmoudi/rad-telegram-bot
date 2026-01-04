/**
 * Unit tests for api-optimized endpoints
 * These test parameter building and type correctness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterCards } from '../cards.js';
import { getUserActions, getHistory, getFeed } from '../activity.js';
import { searchUsers, searchProjects, searchBoards, searchLists, searchCards, globalSearch } from '../search.js';
import { checkOptimizedEndpointsAvailable } from '../index.js';
import type { PlankaAuth } from '../../planka.js';

// Mock plankaFetch
vi.mock('../../api/client.js', () => ({
  plankaFetch: vi.fn(),
}));

import { plankaFetch } from '../../api/client.js';

describe('API Optimized - Cards', () => {
  const mockAuth: PlankaAuth = {
    plankaBaseUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filterCards', () => {
    it('should build query with all parameters', async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
        included: { projects: [], boards: [], lists: [], users: [], labels: [] },
      };
      vi.mocked(plankaFetch).mockResolvedValue(mockResponse);

      await filterCards(mockAuth, {
        projectIds: ['proj1', 'proj2'],
        userIds: ['user1'],
        labelIds: ['label1'],
        cardType: 'story',
        status: 'open',
        createdByUserId: 'user1',
        assignedToUserId: 'user2',
        startDateFrom: '2026-01-01T00:00:00Z',
        startDateTo: '2026-01-31T23:59:59Z',
        dueDateFrom: '2026-02-01T00:00:00Z',
        dueDateTo: '2026-02-28T23:59:59Z',
        weightFrom: 1,
        weightTo: 5,
        sortBy: 'dueDate',
        sortOrder: 'asc',
        page: 2,
        pageSize: 50,
      });

      expect(plankaFetch).toHaveBeenCalledWith(
        mockAuth,
        expect.stringContaining('/cards/filter?')
      );

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('projectIds=proj1%2Cproj2');
      expect(callUrl).toContain('userIds=user1');
      expect(callUrl).toContain('labelIds=label1');
      expect(callUrl).toContain('cardType=story');
      expect(callUrl).toContain('status=open');
      expect(callUrl).toContain('createdByUserId=user1');
      expect(callUrl).toContain('assignedToUserId=user2');
      expect(callUrl).toContain('weightFrom=1');
      expect(callUrl).toContain('weightTo=5');
      expect(callUrl).toContain('sortBy=dueDate');
      expect(callUrl).toContain('sortOrder=asc');
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('pageSize=50');
    });

    it('should handle empty options', async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
        included: { projects: [], boards: [], lists: [], users: [], labels: [] },
      };
      vi.mocked(plankaFetch).mockResolvedValue(mockResponse);

      await filterCards(mockAuth, {});

      expect(plankaFetch).toHaveBeenCalledWith(mockAuth, '/cards/filter');
    });
  });
});

describe('API Optimized - Activity', () => {
  const mockAuth: PlankaAuth = {
    plankaBaseUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserActions', () => {
    it('should build query with all parameters', async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
        included: { boards: [], cards: [] },
      };
      vi.mocked(plankaFetch).mockResolvedValue(mockResponse);

      await getUserActions(mockAuth, {
        userId: 'user123',
        actionTypes: ['createCard', 'moveCard'],
        projectIds: ['proj1'],
        boardIds: ['board1'],
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-31T23:59:59Z',
        page: 2,
        pageSize: 25,
      });

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('/users/user123/actions?');
      expect(callUrl).toContain('actionTypes=createCard%2CmoveCard');
      expect(callUrl).toContain('projectIds=proj1');
      expect(callUrl).toContain('boardIds=board1');
      expect(callUrl).toContain('from=2026-01-01T00%3A00%3A00Z');
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('pageSize=25');
    });
  });

  describe('getHistory', () => {
    it('should build query with all parameters', async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
        included: { users: [], projects: [], boards: [], cards: [] },
      };
      vi.mocked(plankaFetch).mockResolvedValue(mockResponse);

      await getHistory(mockAuth, {
        types: ['project-history', 'action'],
        projectIds: ['proj1'],
        boardIds: ['board1'],
        userIds: ['user1'],
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-31T23:59:59Z',
      });

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('/history?');
      expect(callUrl).toContain('types=project-history%2Caction');
    });
  });

  describe('getFeed', () => {
    it('should build query with all parameters', async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
        included: { users: [], boards: [], cards: [] },
      };
      vi.mocked(plankaFetch).mockResolvedValue(mockResponse);

      await getFeed(mockAuth, {
        types: ['action', 'notification'],
        projectIds: ['proj1'],
        boardIds: ['board1'],
        cardIds: ['card1'],
        userIds: ['user1'],
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-31T23:59:59Z',
      });

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('/feed?');
      expect(callUrl).toContain('types=action%2Cnotification');
      expect(callUrl).toContain('cardIds=card1');
    });
  });
});

describe('API Optimized - Search', () => {
  const mockAuth: PlankaAuth = {
    plankaBaseUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should build query correctly', async () => {
      vi.mocked(plankaFetch).mockResolvedValue([]);

      await searchUsers(mockAuth, 'john', 10);

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('/users/search?');
      expect(callUrl).toContain('q=john');
      expect(callUrl).toContain('limit=10');
    });
  });

  describe('globalSearch', () => {
    it('should build query with all parameters', async () => {
      vi.mocked(plankaFetch).mockResolvedValue({
        projects: [],
        boards: [],
        cards: [],
        users: [],
      });

      await globalSearch(mockAuth, {
        query: 'test',
        types: ['project', 'card'],
        limit: 5,
      });

      const callUrl = vi.mocked(plankaFetch).mock.calls[0][1] as string;
      expect(callUrl).toContain('/search?');
      expect(callUrl).toContain('q=test');
      expect(callUrl).toContain('types=project%2Ccard');
      expect(callUrl).toContain('limit=5');
    });
  });
});

describe('API Optimized - Availability Check', () => {
  const mockAuth: PlankaAuth = {
    plankaBaseUrl: 'https://planka.test',
    accessToken: 'test-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true if endpoint exists', async () => {
    vi.mocked(plankaFetch).mockResolvedValue({ items: [] });

    const available = await checkOptimizedEndpointsAvailable(mockAuth);

    expect(available).toBe(true);
    expect(plankaFetch).toHaveBeenCalledWith(
      mockAuth,
      expect.stringContaining('/cards/filter')
    );
  });

  it('should return false if endpoint returns 404', async () => {
    vi.mocked(plankaFetch).mockRejectedValue(new Error('Planka API error (404): Not Found'));

    const available = await checkOptimizedEndpointsAvailable(mockAuth);

    expect(available).toBe(false);
  });

  it('should return false if endpoint returns HTML', async () => {
    vi.mocked(plankaFetch).mockRejectedValue(
      new Error(`Unexpected token '<', "<!doctype "... is not valid JSON`)
    );

    const available = await checkOptimizedEndpointsAvailable(mockAuth);

    expect(available).toBe(false);
  });

  it('should return true for other errors (auth, network)', async () => {
    vi.mocked(plankaFetch).mockRejectedValue({ status: 401 });

    const available = await checkOptimizedEndpointsAvailable(mockAuth);

    expect(available).toBe(true);
  });
});
