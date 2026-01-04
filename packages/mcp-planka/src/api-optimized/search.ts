/**
 * Search APIs
 * 
 * Individual and global search endpoints matching api-docs.json
 */

import type { PlankaAuth } from '../planka.js';
import { plankaFetch } from '../api/client.js';
import type { PlankaUser, PlankaProject, PlankaBoard, PlankaList, PlankaCard } from '../types/index.js';

// ============= Search Users =============

/**
 * Search users by name, username, or email
 * Endpoint: GET /users/search
 */
export async function searchUsers(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<PlankaUser[]> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<PlankaUser[]>(auth, `/users/search?${params}`);
}

// ============= Search Projects =============

/**
 * Search projects by name or description
 * Endpoint: GET /projects/search
 */
export async function searchProjects(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<PlankaProject[]> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<PlankaProject[]>(auth, `/projects/search?${params}`);
}

// ============= Search Boards =============

/**
 * Search boards by name
 * Endpoint: GET /boards/search
 */
export async function searchBoards(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<PlankaBoard[]> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<PlankaBoard[]>(auth, `/boards/search?${params}`);
}

// ============= Search Lists =============

/**
 * Search lists by name
 * Endpoint: GET /lists/search
 */
export async function searchLists(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<PlankaList[]> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<PlankaList[]>(auth, `/lists/search?${params}`);
}

// ============= Search Cards =============

/**
 * Search cards by name, description, or comments
 * Endpoint: GET /cards/search
 */
export async function searchCards(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<PlankaCard[]> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<PlankaCard[]>(auth, `/cards/search?${params}`);
}

// ============= Global Search =============

export interface GlobalSearchOptions {
  query: string; // Min 2 characters
  types?: string[]; // ['project', 'board', 'card', 'user']
  limit?: number; // Max results per type, 1-50, default: 10
}

export interface GlobalSearchResponse {
  projects?: PlankaProject[];
  boards?: PlankaBoard[];
  cards?: PlankaCard[];
  users?: PlankaUser[];
}

/**
 * Global search across all entities
 * Endpoint: GET /search
 * 
 * @param auth - Authentication credentials
 * @param options - Search options
 */
export async function globalSearch(
  auth: PlankaAuth,
  options: GlobalSearchOptions
): Promise<GlobalSearchResponse> {
  const params = new URLSearchParams({ q: options.query });
  
  if (options.types && options.types.length > 0) {
    params.append('types', options.types.join(','));
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  return await plankaFetch<GlobalSearchResponse>(auth, `/search?${params}`);
}
