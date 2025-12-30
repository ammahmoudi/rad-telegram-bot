import { plankaFetch } from './client.js';
import type { PlankaAuth } from '../types/index.js';

/**
 * Access Tokens API
 * Extended authentication operations
 */

/**
 * Accept terms and conditions
 * @param auth - Planka authentication
 */
export async function acceptTerms(auth: PlankaAuth): Promise<{ item: string }> {
  return plankaFetch<any>(auth, '/api/access-tokens/accept-terms', {
    method: 'POST',
  });
}

/**
 * Exchange OIDC code for access token
 * @param plankaBaseUrl - Planka base URL
 * @param code - OIDC authorization code
 * @param redirectUri - OAuth redirect URI
 */
export async function exchangeWithOIDC(
  plankaBaseUrl: string,
  code: string,
  redirectUri: string,
): Promise<{ item: string }> {
  const auth: PlankaAuth = { plankaBaseUrl, accessToken: '' };
  return plankaFetch<{ item: string }>(auth, '/api/access-tokens/exchange-with-oidc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
}

/**
 * Revoke pending token
 * @param auth - Planka authentication
 */
export async function revokePendingToken(auth: PlankaAuth): Promise<{ success: boolean }> {
  return plankaFetch<any>(auth, '/api/access-tokens/revoke-pending-token', {
    method: 'POST',
  });
}

/**
 * User logout
 * @param auth - Planka authentication
 */
export async function logout(auth: PlankaAuth): Promise<{ success: boolean }> {
  return plankaFetch<any>(auth, '/api/access-tokens/me', {
    method: 'DELETE',
  });
}

/**
 * Get current authenticated user ID from token
 * @param auth - Planka authentication
 * @returns Current user ID extracted from JWT token
 */
export async function getCurrentUser(auth: PlankaAuth): Promise<{ id: string }> {
  // Decode JWT token to extract user ID from 'sub' claim
  const parts = auth.accessToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format');
  }
  
  try {
    // Decode base64 payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    
    return { id: payload.sub };
  } catch (error: any) {
    throw new Error(`Failed to decode JWT token: ${error.message}`);
  }
}
