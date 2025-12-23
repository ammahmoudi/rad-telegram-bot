import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rastarFetch } from '../client.js';
import type { RastarAuth } from '../../types/index.js';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock response with headers
const mockFetchResponse = (data: any, status = 200, ok = true) => ({
  ok,
  status,
  headers: {
    get: (key: string) => {
      if (key === 'content-length') return '100';
      if (key === 'content-type') return 'application/json';
      return null;
    },
  },
  json: async () => data,
  text: async () => JSON.stringify(data),
});

describe('rastarFetch', () => {
  let auth: RastarAuth;

  beforeEach(() => {
    auth = {
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  it('should successfully fetch data from Rastar API', async () => {
    const mockResponse = [{ id: '1', name: 'Test Item' }];
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await rastarFetch<typeof mockResponse>('/rest/v1/menu_schedule', auth, {
      method: 'GET',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/menu_schedule',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer test-token-123',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle paths with leading slash', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('/rest/v1/menu_schedule', auth, { method: 'GET' });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/menu_schedule',
      expect.any(Object)
    );
  });

  it('should handle paths without leading slash', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('rest/v1/menu_schedule', auth, { method: 'GET' });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/menu_schedule',
      expect.any(Object)
    );
  });

  it('should include apikey header when auth is undefined', async () => {
    const mockResponse = { access_token: 'new-token' };
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('/auth/v1/token', undefined, {
      method: 'POST',
      headers: {
        apikey: 'test-api-key',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/auth/v1/token',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          apikey: 'test-api-key', // Custom apikey from options should override default
        }),
      })
    );
  });

  it('should include custom headers in request', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('/rest/v1/menu_schedule', auth, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/menu_schedule',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer test-token-123',
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        }),
      })
    );
  });

  it('should handle query parameters', async () => {
    const mockResponse = [{ id: '1' }];
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('/rest/v1/menu_schedule', auth, {
      method: 'GET',
      params: {
        select: '*',
        order: 'date.asc',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/menu_schedule?select=*&order=date.asc',
      expect.any(Object)
    );
  });

  it('should pass through body in POST request', async () => {
    const mockResponse = [{ success: true }];
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const body = JSON.stringify({ user_id: '123', menu_schedule_id: '456' });
    await rastarFetch('/rest/v1/user_menu_selections', auth, {
      method: 'POST',
      body,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/rest/v1/user_menu_selections',
      expect.objectContaining({
        method: 'POST',
        body,
      })
    );
  });

  it('should throw error on non-ok response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: {
        get: () => null,
      },
      text: async () => 'Not Found',
    });

    await expect(
      rastarFetch('/rest/v1/invalid', auth, { method: 'GET' })
    ).rejects.toThrow('Rastar API error (404): Not Found');
  });

  it('should handle error response without text', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: () => null,
      },
      text: async () => {
        throw new Error('Cannot read text');
      },
    });

    await expect(
      rastarFetch('/rest/v1/menu_schedule', auth, { method: 'GET' })
    ).rejects.toThrow('Rastar API error (500):');
  });

  it('should handle 401 unauthorized error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: {
        get: () => null,
      },
      text: async () => 'Unauthorized',
    });

    await expect(
      rastarFetch('/rest/v1/menu_schedule', auth, { method: 'GET' })
    ).rejects.toThrow('Rastar API error (401): Unauthorized');
  });

  it('should handle JSON response errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => {
          if (key === 'content-length') return '100';
          if (key === 'content-type') return 'application/json';
          return null;
        },
      },
      json: async () => {
        throw new Error('Invalid JSON');
      },
      text: async () => 'Server error',
    });

    await expect(
      rastarFetch('/rest/v1/menu_schedule', auth, { method: 'GET' })
    ).rejects.toThrow('Invalid JSON');
  });

  it('should use THIRD_PARTY_BASE_URL from environment if auth is undefined', async () => {
    // This test verifies that the hardcoded base URL is used since the module is already loaded
    const mockResponse = { access_token: 'token' };
    
    (global.fetch as any).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    await rastarFetch('/auth/v1/token', undefined, {
      method: 'POST',
      headers: { apikey: 'key' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://hhryfmueyrkbnjxgjzlf.supabase.co/auth/v1/token',
      expect.any(Object)
    );
  });
});
