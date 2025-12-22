import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plankaFetch } from '../client.js';
import type { PlankaAuth } from '../../types/index.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('plankaFetch', () => {
  let auth: PlankaAuth;

  beforeEach(() => {
    auth = {
      plankaBaseUrl: 'https://planka.example.com',
      accessToken: 'test-token-123',
    };
    vi.clearAllMocks();
  });

  it('should successfully fetch data from Planka API', async () => {
    const mockResponse = { id: '1', name: 'Test Project' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await plankaFetch(auth, '/api/projects');

    expect(fetch).toHaveBeenCalledWith(
      'https://planka.example.com/api/projects',
      expect.objectContaining({
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
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await plankaFetch(auth, '/api/projects');

    expect(fetch).toHaveBeenCalledWith(
      'https://planka.example.com/api/projects',
      expect.any(Object)
    );
  });

  it('should handle paths without leading slash', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await plankaFetch(auth, 'api/projects');

    expect(fetch).toHaveBeenCalledWith(
      'https://planka.example.com/api/projects',
      expect.any(Object)
    );
  });

  it('should include custom headers in request', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await plankaFetch(auth, '/api/projects', {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://planka.example.com/api/projects',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer test-token-123',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should pass through other fetch options', async () => {
    const mockResponse = { success: true };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await plankaFetch(auth, '/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://planka.example.com/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })
    );
  });

  it('should throw error on non-ok response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    await expect(plankaFetch(auth, '/api/projects/invalid')).rejects.toThrow(
      'Planka API error (404): Not Found'
    );
  });

  it('should handle error response without text', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => {
        throw new Error('Cannot read text');
      },
    });

    await expect(plankaFetch(auth, '/api/projects')).rejects.toThrow(
      'Planka API error (500):'
    );
  });

  it('should handle 401 unauthorized error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(plankaFetch(auth, '/api/projects')).rejects.toThrow(
      'Planka API error (401): Unauthorized'
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(plankaFetch(auth, '/api/projects')).rejects.toThrow('Network error');
  });
});
