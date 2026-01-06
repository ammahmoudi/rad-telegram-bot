/**
 * Optimized Activity & History APIs
 * 
 * Matches api-docs.json specifications exactly:
 * - GET /users/{id}/actions - User actions
 * - GET /history - System-wide history  
 * - GET /feed - Combined activity feed
 */

import type { PlankaAuth } from '../planka.js';
import { plankaFetch } from '../api/client.js';
import { getCurrentUser } from '../api/access-tokens.js';
import type { PlankaAction, PlankaNotification, PlankaUser, PlankaBoard, PlankaCard, PlankaProject } from '../types/index.js';

// ============= User Actions =============

export interface GetUserActionsOptions {
  userId: string; // User ID (required) - use 'me' for current authenticated user
  actionTypes?: string[]; // e.g., ['createCard', 'moveCard', 'addMemberToCard']
  projectIds?: string[]; // Comma-separated project IDs
  boardIds?: string[]; // Comma-separated board IDs
  from?: string; // ISO 8601 date-time
  to?: string; // ISO 8601 date-time
  page?: number; // 1-based, default: 1
  pageSize?: number; // 1-100, default: 50
}

export interface GetUserActionsResponse {
  items: PlankaAction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  included: {
    boards: PlankaBoard[];
    cards: PlankaCard[];
  };
}

/**
 * Get all actions performed by a specific user
 * 
 * Endpoint: GET /users/{id}/actions
 * All parameters from api-docs.json included
 * 
 * Supports 'me' as userId to get current user's actions
 * 
 * @param auth - Authentication credentials
 * @param options - Filter options with required userId (can be 'me' for current user)
 */
export async function getUserActions(
  auth: PlankaAuth,
  options: GetUserActionsOptions
): Promise<GetUserActionsResponse> {
  // Convert 'me' to actual user ID (backend doesn't support 'me' alias yet)
  let userId = options.userId;
  if (userId === 'me') {
    const currentUser = await getCurrentUser(auth);
    userId = currentUser.id;
  }

  const params = new URLSearchParams();
  
  if (options.actionTypes && options.actionTypes.length > 0) {
    params.append('actionTypes', options.actionTypes.join(','));
  }
  if (options.projectIds && options.projectIds.length > 0) {
    params.append('projectIds', options.projectIds.join(','));
  }
  if (options.boardIds && options.boardIds.length > 0) {
    params.append('boardIds', options.boardIds.join(','));
  }
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.page) params.append('page', options.page.toString());
  if (options.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = `/api/users/${userId}/actions${queryString ? `?${queryString}` : ''}`;

  return await plankaFetch<GetUserActionsResponse>(auth, endpoint);
}

// ============= System History =============

export interface GetHistoryOptions {
  types?: string[]; // ['project-history', 'action']
  projectIds?: string[]; // Comma-separated project IDs
  boardIds?: string[]; // Comma-separated board IDs (for actions only)
  userIds?: string[]; // Comma-separated user IDs (who performed the action)
  from?: string; // ISO 8601 date-time
  to?: string; // ISO 8601 date-time
  page?: number; // 1-based, default: 1
  pageSize?: number; // 1-100, default: 50
}

export interface HistoryItem {
  type: 'project-history' | 'action';
  data: Record<string, any>;
  createdAt: string;
}

export interface GetHistoryResponse {
  items: HistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  included: {
    users: PlankaUser[];
    projects: PlankaProject[];
    boards: PlankaBoard[];
    cards: PlankaCard[];
  };
}

/**
 * Get system-wide history combining project history and card actions
 * 
 * Endpoint: GET /history
 * All parameters from api-docs.json included
 * 
 * @param auth - Authentication credentials
 * @param options - Filter options
 */
export async function getHistory(
  auth: PlankaAuth,
  options: GetHistoryOptions = {}
): Promise<GetHistoryResponse> {
  const params = new URLSearchParams();
  
  if (options.types && options.types.length > 0) {
    params.append('types', options.types.join(','));
  }
  if (options.projectIds && options.projectIds.length > 0) {
    params.append('projectIds', options.projectIds.join(','));
  }
  if (options.boardIds && options.boardIds.length > 0) {
    params.append('boardIds', options.boardIds.join(','));
  }
  if (options.userIds && options.userIds.length > 0) {
    params.append('userIds', options.userIds.join(','));
  }
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.page) params.append('page', options.page.toString());
  if (options.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = `/api/history${queryString ? `?${queryString}` : ''}`;

  return await plankaFetch<GetHistoryResponse>(auth, endpoint);
}

// ============= Combined Activity Feed =============

export interface GetFeedOptions {
  types?: string[]; // ['action', 'notification']
  projectIds?: string[]; // Comma-separated project IDs
  boardIds?: string[]; // Comma-separated board IDs
  cardIds?: string[]; // Comma-separated card IDs
  userIds?: string[]; // Comma-separated user IDs (who performed the action)
  from?: string; // ISO 8601 date-time
  to?: string; // ISO 8601 date-time
  page?: number; // 1-based, default: 1
  pageSize?: number; // 1-100, default: 50
}

export interface FeedItem {
  type: 'action' | 'notification';
  data: PlankaAction | PlankaNotification;
  createdAt: string;
}

export interface GetFeedResponse {
  items: FeedItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  included: {
    users: PlankaUser[];
    boards: PlankaBoard[];
    cards: PlankaCard[];
  };
}

/**
 * Get combined activity feed with actions and notifications
 * 
 * Endpoint: GET /feed
 * Replaces 40+ API calls with 1
 * All parameters from api-docs.json included
 * 
 * @param auth - Authentication credentials
 * @param options - Filter options
 */
export async function getFeed(
  auth: PlankaAuth,
  options: GetFeedOptions = {}
): Promise<GetFeedResponse> {
  const params = new URLSearchParams();
  
  if (options.types && options.types.length > 0) {
    params.append('types', options.types.join(','));
  }
  if (options.projectIds && options.projectIds.length > 0) {
    params.append('projectIds', options.projectIds.join(','));
  }
  if (options.boardIds && options.boardIds.length > 0) {
    params.append('boardIds', options.boardIds.join(','));
  }
  if (options.cardIds && options.cardIds.length > 0) {
    params.append('cardIds', options.cardIds.join(','));
  }
  if (options.userIds && options.userIds.length > 0) {
    params.append('userIds', options.userIds.join(','));
  }
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);
  if (options.page) params.append('page', options.page.toString());
  if (options.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = `/api/feed${queryString ? `?${queryString}` : ''}`;

  return await plankaFetch<GetFeedResponse>(auth, endpoint);
}
