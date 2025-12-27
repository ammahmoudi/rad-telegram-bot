import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, refreshToken } from '../auth.js';
import type { RastarTokenResponse } from '../../types/index.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  rastarFetch: vi.fn(),
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RASTAR_SUPABASE_URL = 'https://test.supabase.co';
    process.env.RASTAR_SUPABASE_AUTH_PATH = '/auth/v1/token';
    process.env.RASTAR_SUPABASE_ANON_KEY = 'test-api-key';
    process.env.RASTAR_SUPABASE_KEY_HEADER = 'apikey';
  });

  describe('login', () => {
    it('should authenticate user with email and password', async () => {
      const mockResponse: RastarTokenResponse = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockResponse);

      const result = await login('test@example.com', 'password123');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/auth/v1/token',
        undefined,
        {
          method: 'POST',
          params: { grant_type: 'password' },
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnlmbXVleXJrYm5qeGdqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDMwMDYsImV4cCI6MjA1NTQ3OTAwNn0.zB6aDG8aTVqXkyguz1u35rGYlz05bDy20d5GXjhxirU',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('access-token-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle login errors', async () => {
      vi.mocked(client.rastarFetch).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await expect(login('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should use default API key from module', async () => {
      // The API key is loaded at module import time, so changing env vars after won't affect it
      
      const mockResponse: RastarTokenResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockResponse);

      await login('test@example.com', 'password');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/auth/v1/token',
        undefined,
        expect.objectContaining({
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnlmbXVleXJrYm5qeGdqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDMwMDYsImV4cCI6MjA1NTQ3OTAwNn0.zB6aDG8aTVqXkyguz1u35rGYlz05bDy20d5GXjhxirU',
          },
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token using refresh token', async () => {
      const mockResponse: RastarTokenResponse = {
        access_token: 'new-access-token-789',
        refresh_token: 'new-refresh-token-012',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockResponse);

      const result = await refreshToken('old-refresh-token');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/auth/v1/token',
        undefined,
        {
          method: 'POST',
          params: { grant_type: 'refresh_token' },
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnlmbXVleXJrYm5qeGdqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDMwMDYsImV4cCI6MjA1NTQ3OTAwNn0.zB6aDG8aTVqXkyguz1u35rGYlz05bDy20d5GXjhxirU',
          },
          body: JSON.stringify({
            refresh_token: 'old-refresh-token',
          }),
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('new-access-token-789');
    });

    it('should handle refresh token errors', async () => {
      vi.mocked(client.rastarFetch).mockRejectedValueOnce(
        new Error('Invalid refresh token')
      );

      await expect(refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should use default token path from module', async () => {
      // The token path is loaded at module import time
      
      const mockResponse: RastarTokenResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Date.now() + 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          aud: 'authenticated',
          role: 'authenticated',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockResponse);

      // Re-import to get updated env vars
      const { refreshToken: refreshTokenFunc } = await import('../auth.js');
      await refreshTokenFunc('token');

      expect(client.rastarFetch).toHaveBeenCalledWith(
        '/auth/v1/token',
        undefined,
        expect.any(Object)
      );
    });
  });
});
