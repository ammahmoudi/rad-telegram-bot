import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBoard, createBoard, updateBoard, deleteBoard } from '../boards.js';
import type { PlankaAuth, PlankaBoard } from '../../types/index.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  plankaFetch: vi.fn(),
}));

describe('Boards API', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  // ==================== CREATE ====================
  describe('createBoard', () => {
    it('should fetch a specific board by ID', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-123',
        name: 'Development Board',
        position: 1,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      const result = await getBoard(auth, 'board-123');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/boards/board-123', {
        method: 'GET',
      });
      expect(result).toEqual(mockBoard);
    });

    it('should encode special characters in board ID', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({});

      await getBoard(auth, 'board with spaces');

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/boards/board%20with%20spaces',
        { method: 'GET' }
      );
    });
  });

  describe('createBoard', () => {
    it('should create a new board with required fields', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-new',
        name: 'New Board',
        position: 65535,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      const result = await createBoard(auth, 'proj-1', 'New Board');

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/projects/proj-1/boards',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Board',
            position: 65535,
          }),
        }
      );
      expect(result).toEqual(mockBoard);
    });

    it('should create board with custom position', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-new',
        name: 'New Board',
        position: 100,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      await createBoard(auth, 'proj-1', 'New Board', 100);

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/projects/proj-1/boards',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'New Board',
            position: 100,
          }),
        })
      );
    });

    it('should encode project ID in URL', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({} as PlankaBoard);

      await createBoard(auth, 'project with spaces', 'Board');

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/projects/project%20with%20spaces/boards',
        expect.any(Object)
      );
    });
  });

  // ==================== READ ====================
  describe('getBoard', () => {
    it('should fetch a specific board by ID', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-123',
        name: 'Development Board',
        position: 1,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      const result = await getBoard(auth, 'board-123');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/boards/board-123', {
        method: 'GET',
      });
      expect(result).toEqual(mockBoard);
    });

    it('should encode special characters in board ID', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({});

      await getBoard(auth, 'board with spaces');

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/boards/board%20with%20spaces',
        { method: 'GET' }
      );
    });
  });

  // ==================== UPDATE ====================
  describe('updateBoard', () => {
    it('should update board name', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-123',
        name: 'Updated Board',
        position: 1,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      const result = await updateBoard(auth, 'board-123', { name: 'Updated Board' });

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/boards/board-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Board' }),
      });
      expect(result).toEqual(mockBoard);
    });

    it('should update board position', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-123',
        name: 'Board',
        position: 200,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      await updateBoard(auth, 'board-123', { position: 200 });

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/boards/board-123',
        expect.objectContaining({
          body: JSON.stringify({ position: 200 }),
        })
      );
    });

    it('should update multiple fields', async () => {
      const mockBoard: PlankaBoard = {
        id: 'board-123',
        name: 'New Name',
        position: 150,
        projectId: 'proj-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockBoard);

      await updateBoard(auth, 'board-123', { name: 'New Name', position: 150 });

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/boards/board-123',
        expect.objectContaining({
          body: JSON.stringify({ name: 'New Name', position: 150 }),
        })
      );
    });
  });

  // ==================== DELETE ====================
  describe('deleteBoard', () => {
    it('should delete a board by ID', async () => {
      const mockResponse = { success: true };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockResponse);

      const result = await deleteBoard(auth, 'board-123');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/boards/board-123', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should encode board ID in URL', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({});

      await deleteBoard(auth, 'board/special');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/boards/board%2Fspecial', {
        method: 'DELETE',
      });
    });
  });
});
