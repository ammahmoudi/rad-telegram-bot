import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMenuSchedule,
  getUserMenuSelections,
  createMenuSelection,
  deleteMenuSelection,
} from '../menu.js';
import type { RastarAuth, MenuSchedule, UserMenuSelection } from '../../types/index.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  rastarFetch: vi.fn(),
}));

describe('Menu API', () => {
  let auth: RastarAuth;

  beforeEach(() => {
    auth = {
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  // ==================== READ ====================
  describe('getMenuSchedule', () => {
    it('should fetch menu schedule with menu items', async () => {
      const mockSchedule: MenuSchedule[] = [
        {
          id: 'schedule-1',
          date: '2024-01-15',
          updated_at: '2024-01-01T00:00:00.000Z',
          menu_item: {
            id: 'item-1',
            name: 'Pizza',
            description: 'Delicious cheese pizza',
          },
        },
        {
          id: 'schedule-2',
          date: '2024-01-16',
          updated_at: '2024-01-01T00:00:00.000Z',
          menu_item: {
            id: 'item-2',
            name: 'Pasta',
            description: 'Fresh pasta with tomato sauce',
          },
        },
      ];

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSchedule);

      const result = await getMenuSchedule(auth);

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/rest/v1/menu_schedule',
        auth,
        {
          method: 'GET',
          params: {
            select: '*,menu_item:menu_items(id,name,description)',
            order: 'date.asc',
          },
        }
      );
      expect(result).toEqual(mockSchedule);
      expect(result[0].menu_item?.name).toBe('Pizza');
      expect(result[1].menu_item?.name).toBe('Pasta');
    });

    it('should return empty array if no schedule exists', async () => {
      vi.mocked(client.rastarFetch).mockResolvedValueOnce([]);

      const result = await getMenuSchedule(auth);

      expect(result).toEqual([]);
    });

    it('should handle menu items without description', async () => {
      const mockSchedule: MenuSchedule[] = [
        {
          id: 'schedule-1',
          date: '2024-01-15',
          updated_at: '2024-01-01T00:00:00.000Z',
          menu_item: {
            id: 'item-1',
            name: 'Simple Dish',
          },
        },
      ];

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSchedule);

      const result = await getMenuSchedule(auth);

      expect(result[0].menu_item?.description).toBeUndefined();
    });
  });

  describe('getUserMenuSelections', () => {
    it('should fetch user menu selections with nested data', async () => {
      const mockSelections: UserMenuSelection[] = [
        {
          id: 'selection-1',
          user_id: 'user-123',
          menu_schedule_id: 'schedule-1',
          created_at: '2024-01-01T10:00:00.000Z',
          menu_schedule: {
            id: 'schedule-1',
            date: '2024-01-15',
            menu_item: {
              id: 'item-1',
              name: 'Pizza',
              description: 'Cheese pizza',
            },
          },
        },
      ];

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSelections);

      const result = await getUserMenuSelections(auth, 'user-123');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/rest/v1/user_menu_selections',
        auth,
        {
          method: 'GET',
          params: {
            select:
              'id,user_id,menu_schedule_id,created_at,menu_schedule:menu_schedule(id,date,menu_item:menu_items(id,name,description))',
            user_id: 'eq.user-123',
            order: 'created_at.asc',
          },
        }
      );
      expect(result).toEqual(mockSelections);
      expect(result[0].menu_schedule?.menu_item?.name).toBe('Pizza');
    });

    it('should return empty array for user with no selections', async () => {
      vi.mocked(client.rastarFetch).mockResolvedValueOnce([]);

      const result = await getUserMenuSelections(auth, 'user-456');

      expect(result).toEqual([]);
    });

    it('should handle selections without nested menu data', async () => {
      const mockSelections = [
        {
          id: 'selection-1',
          user_id: 'user-123',
          menu_schedule_id: 'schedule-1',
          created_at: '2024-01-01T10:00:00.000Z',
        },
      ] as any;

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSelections);

      const result = await getUserMenuSelections(auth, 'user-123');

      expect(result[0].menu_schedule).toBeUndefined();
    });
  });

  // ==================== CREATE ====================
  describe('createMenuSelection', () => {
    it('should create a new menu selection', async () => {
      const mockSelection = {
        id: 'selection-new',
        user_id: 'user-123',
        menu_schedule_id: 'schedule-1',
        created_at: '2024-01-01T10:00:00.000Z',
      } as any;

      vi.mocked(client.rastarFetch).mockResolvedValueOnce([mockSelection]);

      const result = await createMenuSelection(auth, 'user-123', 'schedule-1');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/rest/v1/user_menu_selections',
        auth,
        {
          method: 'POST',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            user_id: 'user-123',
            menu_schedule_id: 'schedule-1',
          }),
        }
      );
      expect(result).toEqual(mockSelection);
    });

    it('should handle array response from Supabase', async () => {
      const mockSelection = {
        id: 'selection-new',
        user_id: 'user-123',
        menu_schedule_id: 'schedule-1',
        created_at: '2024-01-01T10:00:00.000Z',
      } as any;

      vi.mocked(client.rastarFetch).mockResolvedValueOnce([mockSelection]);

      const result = await createMenuSelection(auth, 'user-123', 'schedule-1');

      expect(result).toEqual(mockSelection);
      expect(result.id).toBe('selection-new');
    });

    it('should handle non-array response from Supabase', async () => {
      const mockSelection = {
        id: 'selection-new',
        user_id: 'user-123',
        menu_schedule_id: 'schedule-1',
        created_at: '2024-01-01T10:00:00.000Z',
      } as any;

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSelection);

      const result = await createMenuSelection(auth, 'user-123', 'schedule-1');

      expect(result).toEqual(mockSelection);
    });

    it('should handle creation errors', async () => {
      vi.mocked(client.rastarFetch).mockRejectedValueOnce(
        new Error('Duplicate selection')
      );

      await expect(
        createMenuSelection(auth, 'user-123', 'schedule-1')
      ).rejects.toThrow('Duplicate selection');
    });
  });

  // ==================== DELETE ====================
  describe('deleteMenuSelection', () => {
    it('should delete a menu selection by ID', async () => {
      vi.mocked(client.rastarFetch).mockResolvedValueOnce(undefined);

      await deleteMenuSelection(auth, 'selection-123');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/rest/v1/user_menu_selections',
        auth,
        {
          method: 'DELETE',
          params: {
            id: 'eq.selection-123',
          },
        }
      );
    });

    it('should handle deletion of non-existent selection', async () => {
      vi.mocked(client.rastarFetch).mockResolvedValueOnce(undefined);

      await expect(
        deleteMenuSelection(auth, 'non-existent')
      ).resolves.toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(client.rastarFetch).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      await expect(deleteMenuSelection(auth, 'selection-123')).rejects.toThrow(
        'Permission denied'
      );
    });
  });
});
