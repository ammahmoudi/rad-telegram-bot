/**
 * Tests for search helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  searchUsers, 
  searchProjects, 
  searchBoards, 
  searchCards, 
  searchTasks, 
  globalSearch 
} from '../search.js';
import type { PlankaAuth } from '../../types/index.js';

// Mock the API modules
vi.mock('../../api/index.js', () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  getBoard: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../../api/users.js', () => ({
  getUsers: vi.fn(),
}));

vi.mock('../user-tasks.js', () => ({
  getUserCards: vi.fn(),
  getUserTasks: vi.fn(),
}));

import { getUsers } from '../../api/users.js';
import { listProjects, getProject, getBoard } from '../../api/index.js';
import { getUserCards, getUserTasks } from '../user-tasks.js';

describe('Search Helpers', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.test',
      accessToken: 'test-token',
    };
    vi.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should search users by name (case-insensitive by default)', async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: '1', name: 'John Doe', email: 'john@test.com', username: 'john' },
        { id: '2', name: 'Jane Smith', email: 'jane@test.com', username: 'jane' },
        { id: '3', name: 'Bob Johnson', email: 'bob@test.com', username: 'bob' },
      ] as any);

      const results = await searchUsers(auth, 'john');

      expect(results).toHaveLength(2); // John Doe and Bob Johnson
      expect(results[0].name).toBe('John Doe');
      expect(results[1].name).toBe('Bob Johnson');
    });

    it('should search users case-sensitively when specified', async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: '1', name: 'John Doe', email: 'john@test.com', username: 'john' },
        { id: '2', name: 'jane smith', email: 'jane@test.com', username: 'jane' },
      ] as any);

      const results = await searchUsers(auth, 'john', { caseSensitive: true });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should search by email', async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: '1', name: 'John Doe', email: 'john@test.com', username: 'john' },
        { id: '2', name: 'Jane Smith', email: 'jane@test.com', username: 'jane' },
      ] as any);

      const results = await searchUsers(auth, 'test.com');

      expect(results).toHaveLength(2);
    });

    it('should use regex when specified', async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: '1', name: 'John Doe', email: 'john@test.com', username: 'john' },
        { id: '2', name: 'Jane Smith', email: 'jane@test.com', username: 'jane' },
        { id: '3', name: 'Bob Smith', email: 'bob@test.com', username: 'bob' },
      ] as any);

      const results = await searchUsers(auth, 'J(ohn|ane)', { useRegex: true });

      expect(results).toHaveLength(2);
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name', async () => {
      vi.mocked(listProjects).mockResolvedValue([
        { id: '1', name: 'Project Alpha' },
        { id: '2', name: 'Project Beta' },
        { id: '3', name: 'Test Alpha' },
      ] as any);

      vi.mocked(getProject).mockResolvedValue({
        item: { id: '1', name: 'Project Alpha' },
        included: { boards: [] },
      } as any);

      const results = await searchProjects(auth, 'alpha');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Alpha');
    });
  });

  describe('searchBoards', () => {
    it('should search boards by name across projects', async () => {
      vi.mocked(listProjects).mockResolvedValue([
        { id: '1', name: 'Project 1' },
      ] as any);

      vi.mocked(getProject).mockResolvedValue({
        item: { id: '1' },
        included: {
          boards: [
            { id: 'b1', name: 'Development Board' },
            { id: 'b2', name: 'Testing Board' },
          ],
        },
      } as any);

      vi.mocked(getBoard).mockResolvedValue({
        item: { id: 'b1', name: 'Development Board' },
        included: { lists: [] },
      } as any);

      const results = await searchBoards(auth, 'development');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Development');
    });
  });

  describe('searchCards', () => {
    it('should search cards by name', async () => {
      vi.mocked(getUserCards).mockResolvedValue([
        {
          id: 'c1',
          name: 'Fix bug in login',
          description: 'User cannot login',
          projectName: 'Project 1',
          boardName: 'Board 1',
        },
        {
          id: 'c2',
          name: 'Add new feature',
          description: 'Implement dark mode',
          projectName: 'Project 1',
          boardName: 'Board 1',
        },
      ] as any);

      const results = await searchCards(auth, 'bug');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Fix bug in login');
      expect(results[0].matchedIn).toContain('title');
    });

    it('should search cards by description', async () => {
      vi.mocked(getUserCards).mockResolvedValue([
        {
          id: 'c1',
          name: 'Fix issue',
          description: 'User cannot login',
          projectName: 'Project 1',
          boardName: 'Board 1',
        },
      ] as any);

      const results = await searchCards(auth, 'login');

      expect(results).toHaveLength(1);
      expect(results[0].matchedIn).toContain('description');
    });
  });

  describe('searchTasks', () => {
    it('should search tasks by name', async () => {
      vi.mocked(getUserTasks).mockResolvedValue([
        {
          id: 't1',
          name: 'Write unit tests',
          cardTitle: 'Testing',
          projectName: 'Project 1',
        },
        {
          id: 't2',
          name: 'Update documentation',
          cardTitle: 'Docs',
          projectName: 'Project 1',
        },
      ] as any);

      const results = await searchTasks(auth, 'test');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Write unit tests');
    });
  });

  describe('globalSearch', () => {
    it('should search across all entity types', async () => {
      vi.mocked(getUsers).mockResolvedValue([
        { id: '1', name: 'Test User', email: 'test@test.com', username: 'test' },
      ] as any);

      vi.mocked(listProjects).mockResolvedValue([
        { id: '1', name: 'Test Project' },
      ] as any);

      vi.mocked(getProject).mockResolvedValue({
        item: { id: '1' },
        included: { boards: [] },
      } as any);

      vi.mocked(getUserCards).mockResolvedValue([
        {
          id: 'c1',
          name: 'Test Card',
          description: 'Test description',
        },
      ] as any);

      vi.mocked(getUserTasks).mockResolvedValue([
        {
          id: 't1',
          name: 'Test Task',
        },
      ] as any);

      const results = await globalSearch(auth, 'test');

      expect(results.users.length).toBeGreaterThan(0);
      expect(results.projects.length).toBeGreaterThan(0);
      expect(results.cards.length).toBeGreaterThan(0);
      expect(results.tasks.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getUsers).mockRejectedValue(new Error('API Error'));
      vi.mocked(listProjects).mockResolvedValue([]);
      vi.mocked(getUserCards).mockResolvedValue([]);
      vi.mocked(getUserTasks).mockResolvedValue([]);

      const results = await globalSearch(auth, 'test');

      // Should return empty arrays for failed searches
      expect(results.users).toEqual([]);
      expect(results.projects).toEqual([]);
    });
  });
});
