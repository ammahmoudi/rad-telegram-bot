import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listProjects, getProject } from '../projects.js';
import type { PlankaAuth, PlankaProject } from '../../types/index.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  plankaFetch: vi.fn(),
}));

describe('Projects API', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  // ==================== READ ====================
  describe('listProjects', () => {
    it('should return projects from items array', async () => {
      const mockProjects: PlankaProject[] = [
        {
          id: '1',
          name: 'Project 1',
          description: 'First project',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Project 2',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      vi.mocked(client.plankaFetch).mockResolvedValueOnce({ items: mockProjects });

      const result = await listProjects(auth);

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/projects', {
        method: 'GET',
      });
      expect(result).toEqual(mockProjects);
    });

    it('should return projects from item array', async () => {
      const mockProjects: PlankaProject[] = [
        {
          id: '1',
          name: 'Project 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(client.plankaFetch).mockResolvedValueOnce({ item: mockProjects });

      const result = await listProjects(auth);

      expect(result).toEqual(mockProjects);
    });

    it('should return empty array if no projects', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({});

      const result = await listProjects(auth);

      expect(result).toEqual([]);
    });

    it('should handle direct array response', async () => {
      const mockProjects: PlankaProject[] = [
        {
          id: '1',
          name: 'Project 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(client.plankaFetch).mockResolvedValueOnce({ items: mockProjects } as any);

      const result = await listProjects(auth);

      expect(result).toEqual(mockProjects);
    });
  });

  describe('getProject', () => {
    it('should fetch a specific project by ID', async () => {
      const mockProject = {
        id: '123',
        name: 'My Project',
        description: 'Test project',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockProject);

      const result = await getProject(auth, '123');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/projects/123', {
        method: 'GET',
      });
      expect(result).toEqual(mockProject);
    });

    it('should encode special characters in project ID', async () => {
      const mockProject = { id: 'proj-123', name: 'Test' };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockProject);

      await getProject(auth, 'proj with spaces');

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/projects/proj%20with%20spaces',
        { method: 'GET' }
      );
    });
  });
});
