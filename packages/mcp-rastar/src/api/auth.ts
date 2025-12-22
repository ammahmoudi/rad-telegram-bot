import { rastarFetch } from './client.js';
import type { RastarTokenResponse } from '../types/index.js';

const THIRD_PARTY_TOKEN_PATH = process.env.THIRD_PARTY_TOKEN_PATH || '/auth/v1/token';
const THIRD_PARTY_API_KEY = process.env.THIRD_PARTY_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnlmbXVleXJrYm5qeGdqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDMwMDYsImV4cCI6MjA1NTQ3OTAwNn0.zB6aDG8aTVqXkyguz1u35rGYlz05bDy20d5GXjhxirU';
const THIRD_PARTY_API_KEY_HEADER = process.env.THIRD_PARTY_API_KEY_HEADER || 'apikey';

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<RastarTokenResponse> {
  return rastarFetch<RastarTokenResponse>(THIRD_PARTY_TOKEN_PATH, undefined, {
    method: 'POST',
    params: { grant_type: 'password' },
    headers: {
      [THIRD_PARTY_API_KEY_HEADER]: THIRD_PARTY_API_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RastarTokenResponse> {
  return rastarFetch<RastarTokenResponse>(THIRD_PARTY_TOKEN_PATH, undefined, {
    method: 'POST',
    params: { grant_type: 'refresh_token' },
    headers: {
      [THIRD_PARTY_API_KEY_HEADER]: THIRD_PARTY_API_KEY,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
