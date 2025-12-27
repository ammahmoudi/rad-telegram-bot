import { rastarFetch } from './client.js';
import type { RastarTokenResponse } from '../types/index.js';

const RASTAR_SUPABASE_AUTH_PATH = process.env.RASTAR_SUPABASE_AUTH_PATH || '/auth/v1/token';
const RASTAR_SUPABASE_ANON_KEY = process.env.RASTAR_SUPABASE_ANON_KEY;
const RASTAR_SUPABASE_KEY_HEADER = process.env.RASTAR_SUPABASE_KEY_HEADER || 'apikey';

if (!RASTAR_SUPABASE_ANON_KEY) {
  throw new Error('RASTAR_SUPABASE_ANON_KEY environment variable is required');
}

// Asserted as non-null after the check above
const anonKey = RASTAR_SUPABASE_ANON_KEY!;

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<RastarTokenResponse> {
  return rastarFetch<RastarTokenResponse>(RASTAR_SUPABASE_AUTH_PATH, undefined, {
    method: 'POST',
    params: { grant_type: 'password' },
    headers: {
      [RASTAR_SUPABASE_KEY_HEADER]: anonKey,
    },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RastarTokenResponse> {
  return rastarFetch<RastarTokenResponse>(RASTAR_SUPABASE_AUTH_PATH, undefined, {
    method: 'POST',
    params: { grant_type: 'refresh_token' },
    headers: {
      [RASTAR_SUPABASE_KEY_HEADER]: anonKey,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
