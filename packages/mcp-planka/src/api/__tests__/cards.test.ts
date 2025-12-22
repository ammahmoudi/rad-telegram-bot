import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCard, updateCard, moveCard, deleteCard } from '../cards.js';
import type { PlankaAuth, PlankaCard } from '../../types/index.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  plankaFetch: vi.fn(),
}));

describe('Cards API', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  // ==================== CREATE ====================
  describe('createCard', () => {
    it('should create a card with required fields', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'New Task',
        position: 65535,
        listId: 'list-1',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      const result = await createCard(auth, 'list-1', 'New Task');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/lists/list-1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Task',
          position: 65535,
          type: 'project',
        }),
      });
      expect(result).toEqual(mockCard);
    });

    it('should create card with description', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'New Task',
        description: 'Task details',
        position: 65535,
        listId: 'list-1',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await createCard(auth, 'list-1', 'New Task', 'Task details');

      const callArgs = vi.mocked(client.plankaFetch).mock.calls[0];
      const body = JSON.parse(callArgs[2]?.body as string);
      
      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/lists/list-1/cards',
        expect.any(Object)
      );
      expect(body).toMatchObject({
        name: 'New Task',
        description: 'Task details',
        position: 65535,
        type: 'project',
      });
    });

    it('should create card with custom position', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'New Task',
        position: 100,
        listId: 'list-1',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await createCard(auth, 'list-1', 'New Task', undefined, 100);

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/lists/list-1/cards',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'New Task',
            position: 100,
            type: 'project',
          }),
        })
      );
    });

    it('should create card with due date', async () => {
      const dueDate = '2024-12-31';
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'New Task',
        position: 65535,
        listId: 'list-1',
        boardId: 'board-1',
        dueDate: new Date(dueDate).toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await createCard(auth, 'list-1', 'New Task', undefined, undefined, dueDate);

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/lists/list-1/cards',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'New Task',
            position: 65535,
            type: 'project',
            dueDate: new Date(dueDate).toISOString(),
          }),
        })
      );
    });

    it('should create card with all optional fields', async () => {
      const dueDate = '2024-12-31';
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Complete Task',
        description: 'Full description',
        position: 200,
        listId: 'list-1',
        boardId: 'board-1',
        dueDate: new Date(dueDate).toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await createCard(auth, 'list-1', 'Complete Task', 'Full description', 200, dueDate);

      const callArgs = vi.mocked(client.plankaFetch).mock.calls[0];
      const body = JSON.parse(callArgs[2]?.body as string);

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/lists/list-1/cards',
        expect.any(Object)
      );
      expect(body).toMatchObject({
        name: 'Complete Task',
        description: 'Full description',
        position: 200,
        type: 'project',
        dueDate: new Date(dueDate).toISOString(),
      });
    });
  });

  // ==================== UPDATE ====================
  describe('updateCard', () => {
    it('should update card name', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Updated Name',
        position: 100,
        listId: 'list-1',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      const result = await updateCard(auth, 'card-123', { name: 'Updated Name' });

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      expect(result).toEqual(mockCard);
    });

    it('should update card description', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Task',
        description: 'New description',
        position: 100,
        listId: 'list-1',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await updateCard(auth, 'card-123', { description: 'New description' });

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/cards/card-123',
        expect.objectContaining({
          body: JSON.stringify({ description: 'New description' }),
        })
      );
    });

    it('should update card due date', async () => {
      const dueDate = '2024-12-31';
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Task',
        position: 100,
        listId: 'list-1',
        boardId: 'board-1',
        dueDate: new Date(dueDate).toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await updateCard(auth, 'card-123', { dueDate });

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/cards/card-123',
        expect.objectContaining({
          body: JSON.stringify({ dueDate: new Date(dueDate).toISOString() }),
        })
      );
    });

    it('should update multiple fields', async () => {
      const dueDate = '2024-12-31';
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Updated Task',
        description: 'Updated description',
        position: 150,
        listId: 'list-1',
        boardId: 'board-1',
        dueDate: new Date(dueDate).toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await updateCard(auth, 'card-123', {
        name: 'Updated Task',
        description: 'Updated description',
        dueDate,
        position: 150,
      });

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/cards/card-123',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Updated Task',
            description: 'Updated description',
            dueDate: new Date(dueDate).toISOString(),
            position: 150,
          }),
        })
      );
    });
  });

  describe('moveCard (Update)', () => {
    it('should move card to different list', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Task',
        position: 100,
        listId: 'list-2',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      const result = await moveCard(auth, 'card-123', 'list-2');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: 'list-2' }),
      });
      expect(result).toEqual(mockCard);
    });

    it('should move card with specific position', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Task',
        position: 50,
        listId: 'list-2',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await moveCard(auth, 'card-123', 'list-2', 50);

      expect(client.plankaFetch).toHaveBeenCalledWith(
        auth,
        '/api/cards/card-123',
        expect.objectContaining({
          body: JSON.stringify({ listId: 'list-2', position: 50 }),
        })
      );
    });

    it('should not include position if not provided', async () => {
      const mockCard: PlankaCard = {
        id: 'card-123',
        name: 'Task',
        position: 100,
        listId: 'list-2',
        boardId: 'board-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockCard);

      await moveCard(auth, 'card-123', 'list-2');

      const callArgs = vi.mocked(client.plankaFetch).mock.calls[0];
      const body = JSON.parse(callArgs[2]?.body as string);
      
      expect(body).toEqual({ listId: 'list-2' });
      expect(body).not.toHaveProperty('position');
    });
  });

  // ==================== DELETE ====================
  describe('deleteCard', () => {
    it('should delete a card by ID', async () => {
      const mockResponse = { success: true };

      vi.mocked(client.plankaFetch).mockResolvedValueOnce(mockResponse);

      const result = await deleteCard(auth, 'card-123');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/cards/card-123', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should encode card ID in URL', async () => {
      vi.mocked(client.plankaFetch).mockResolvedValueOnce({});

      await deleteCard(auth, 'card/special');

      expect(client.plankaFetch).toHaveBeenCalledWith(auth, '/api/cards/card%2Fspecial', {
        method: 'DELETE',
      });
    });
  });
});
