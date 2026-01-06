/**
 * Search APIs
 * 
 * Individual and global search endpoints matching api-docs.json
 */

import type { PlankaAuth } from '../planka.js';
import { plankaFetch } from '../api/client.js';
import type { PlankaUser, PlankaProject, PlankaBoard, PlankaList, PlankaCard } from '../types/index.js';

// Common search response structure
interface SearchResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============= Search Users =============

/**
 * Search users by name, username, or email
 * Endpoint: GET /api/users/search
 */
export async function searchUsers(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<SearchResponse<PlankaUser>> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<SearchResponse<PlankaUser>>(auth, `/api/users/search?${params}`);
}

// ============= Search Projects =============

/**
 * Search projects by name or description
 * Endpoint: GET /api/projects/search
 */
export async function searchProjects(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<SearchResponse<PlankaProject>> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<SearchResponse<PlankaProject>>(auth, `/api/projects/search?${params}`);
}

// ============= Search Boards =============

/**
 * Search boards by name
 * Endpoint: GET /api/boards/search
 */
export async function searchBoards(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<SearchResponse<PlankaBoard>> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<SearchResponse<PlankaBoard>>(auth, `/api/boards/search?${params}`);
}

// ============= Search Lists =============

/**
 * Search lists by name
 * Endpoint: GET /api/lists/search
 */
export async function searchLists(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<SearchResponse<PlankaList>> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<SearchResponse<PlankaList>>(auth, `/api/lists/search?${params}`);
}

// ============= Search Cards =============

/**
 * Search cards by name, description, or comments
 * Endpoint: GET /api/cards/search
 */
export async function searchCards(
  auth: PlankaAuth,
  query: string,
  limit: number = 20
): Promise<SearchResponse<PlankaCard>> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return await plankaFetch<SearchResponse<PlankaCard>>(auth, `/api/cards/search?${params}`);
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

  return await plankaFetch<GlobalSearchResponse>(auth, `/api/search?${params}`);
}
