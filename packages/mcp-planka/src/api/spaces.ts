import { plankaFetch } from './client.js';
import type { PlankaAuth, SpaceId, PlankaSpace } from '../types/index.js';

/**
 * Spaces API
 * Handles space (document storage) operations
 */

export interface Space {
  id: SpaceId;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceData {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSpaceData {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Create a new space
 * @param auth - Planka authentication
 * @param data - Space data
 */
export async function createSpace(
  auth: PlankaAuth,
  data: CreateSpaceData,
): Promise<Space> {
  return plankaFetch<Space>(auth, '/api/spaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all spaces
 * @param auth - Planka authentication
 */
export async function listSpaces(
  auth: PlankaAuth,
): Promise<Space[]> {
  return plankaFetch<Space[]>(auth, '/api/spaces', {
    method: 'GET',
  });
}

/**
 * Get space by ID
 * @param auth - Planka authentication
 * @param id - Space ID
 */
export async function getSpace(
  auth: PlankaAuth,
  id: SpaceId,
): Promise<Space> {
  return plankaFetch<Space>(auth, `/api/spaces/${id}`, {
    method: 'GET',
  });
}

/**
 * Update space
 * @param auth - Planka authentication
 * @param id - Space ID
 * @param data - Space data to update
 */
export async function updateSpace(
  auth: PlankaAuth,
  id: SpaceId,
  data: UpdateSpaceData,
): Promise<Space> {
  return plankaFetch<Space>(auth, `/api/spaces/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete space
 * @param auth - Planka authentication
 * @param id - Space ID
 */
export async function deleteSpace(
  auth: PlankaAuth,
  id: SpaceId,
): Promise<Space> {
  return plankaFetch<Space>(auth, `/api/spaces/${id}`, {
    method: 'DELETE',
  });
}
