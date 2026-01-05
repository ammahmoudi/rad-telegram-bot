/**
 * Optimized Cards API
 * 
 * GET /cards/filter - Filter cards across projects with permission-based access
 * Matches api-docs.json specification exactly
 */

import type { PlankaAuth } from '../planka.js';
import { plankaFetch } from '../api/client.js';
import { getCurrentUser } from '../api/access-tokens.js';
import type { PlankaCard, PlankaProject, PlankaBoard, PlankaList, PlankaUser, PlankaLabel } from '../types/index.js';

export interface FilterCardsOptions {
  projectIds?: string[]; // Comma-separated project IDs
  userIds?: string[]; // Filter by card members
  labelIds?: string[]; // Filter by labels
  cardType?: 'project' | 'story' | 'epic' | 'other';
  status?: 'open' | 'closed' | 'all'; // Default: 'all'
  createdByUserId?: string; // Use 'me' for current user
  assignedToUserId?: string; // Use 'me' for current user
  startDateFrom?: string; // ISO 8601 date-time
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  weightFrom?: number; // 1-10
  weightTo?: number; // 1-10
  sortBy?: 'createdAt' | 'dueDate' | 'weight' | 'name' | 'position'; // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
  page?: number; // 1-based, default: 1
  pageSize?: number; // 1-500, default: 100
}

export interface FilterCardsResponse {
  items: PlankaCard[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  included: {
    projects: PlankaProject[];
    boards: PlankaBoard[];
    lists: PlankaList[];
    users: PlankaUser[];
    labels: PlankaLabel[];
  };
}

/**
 * Filter cards across projects with comprehensive options
 * 
 * Endpoint: GET /cards/filter
 * Replaces 21+ API calls with 1
 * 
 * Supports 'me' for createdByUserId and assignedToUserId parameters
 * 
 * @param auth - Authentication credentials
 * @param options - Filter options (all parameters from api-docs.json)
 */
export async function filterCards(
  auth: PlankaAuth,
  options: FilterCardsOptions = {}
): Promise<FilterCardsResponse> {
  // Convert 'me' to actual user ID if needed
  let createdByUserId = options.createdByUserId;
  let assignedToUserId = options.assignedToUserId;
  
  if (createdByUserId === 'me' || assignedToUserId === 'me') {
    const currentUser = await getCurrentUser(auth);
    if (createdByUserId === 'me') createdByUserId = currentUser.id;
    if (assignedToUserId === 'me') assignedToUserId = currentUser.id;
  }

  const params = new URLSearchParams();
  
  if (options.projectIds && options.projectIds.length > 0) {
    params.append('projectIds', options.projectIds.join(','));
  }
  if (options.userIds && options.userIds.length > 0) {
    params.append('userIds', options.userIds.join(','));
  }
  if (options.labelIds && options.labelIds.length > 0) {
    params.append('labelIds', options.labelIds.join(','));
  }
  if (options.cardType) params.append('cardType', options.cardType);
  if (options.status) params.append('status', options.status);
  if (createdByUserId) params.append('createdByUserId', createdByUserId);
  if (assignedToUserId) params.append('assignedToUserId', assignedToUserId);
  if (options.startDateFrom) params.append('startDateFrom', options.startDateFrom);
  if (options.startDateTo) params.append('startDateTo', options.startDateTo);
  if (options.dueDateFrom) params.append('dueDateFrom', options.dueDateFrom);
  if (options.dueDateTo) params.append('dueDateTo', options.dueDateTo);
  if (options.weightFrom) params.append('weightFrom', options.weightFrom.toString());
  if (options.weightTo) params.append('weightTo', options.weightTo.toString());
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.page) params.append('page', options.page.toString());
  if (options.pageSize) params.append('pageSize', options.pageSize.toString());

  const queryString = params.toString();
  const endpoint = `/api/cards/filter${queryString ? `?${queryString}` : ''}`;

  return await plankaFetch<FilterCardsResponse>(auth, endpoint);
}
