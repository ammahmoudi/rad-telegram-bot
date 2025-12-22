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
