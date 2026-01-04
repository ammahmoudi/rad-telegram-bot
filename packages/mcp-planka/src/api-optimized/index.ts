/**
 * Optimized API Endpoints Module
 * 
 * Contains wrappers for Planka API endpoints from api-docs.json
 * 
 * Key endpoints:
 * - GET /cards/filter - Global card filtering (reduces 21+ calls to 1)
 * - GET /feed - Combined activity feed (reduces 40+ calls to 1)
 * - GET /history - System-wide history
 * - GET /users/{id}/actions - User actions
 * - GET /search - Global search across all entities
 * - Individual search endpoints for users, projects, boards, lists, cards
 */

import type { PlankaAuth } from '../planka.js';
import { plankaFetch } from '../api/client.js';

// Re-export all optimized API functions
export * from './cards.js';
export * from './search.js';
export * from './activity.js';

/**
 * Check if optimized endpoints are available on the Planka server
 * 
 * @param auth - Authentication credentials
 * @returns true if optimized endpoints are implemented, false if they return 404
 */
export async function checkOptimizedEndpointsAvailable(
  auth: PlankaAuth
): Promise<boolean> {
  try {
    // Test if /cards/filter endpoint exists (should return data or 400, not 404)
    await plankaFetch(auth, '/cards/filter?page=1&pageSize=1');
    return true;
  } catch (error: any) {
    // If we get 404 or HTML response (<!doctype), endpoints are not implemented yet
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('404') || 
        errorMessage.includes('<!doctype') || 
        errorMessage.includes('<!DOCTYPE') ||
        errorMessage.includes('Unexpected token')) {
      return false;
    }
    // Other errors (auth, network) mean endpoints might exist
    return true;
  }
}
