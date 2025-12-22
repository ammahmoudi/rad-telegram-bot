import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardId, UserId, NotificationServiceId } from '../types/index.js';

/**
 * Notification Services API
 * Handles notification service configurations (webhooks, integrations)
 */

export interface NotificationService {
  id: NotificationServiceId;
  type: 'slack' | 'webhook' | 'email';
  name: string;
  config: {
    url?: string;
    channel?: string;
    email?: string;
    [key: string]: any;
  };
  boardId?: BoardId;
  userId?: UserId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationServiceData {
  type: 'slack' | 'webhook' | 'email';
  name: string;
  config: {
    url?: string;
    channel?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface UpdateNotificationServiceData {
  name?: string;
  config?: {
    url?: string;
    channel?: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * Create notification service for board
 * @param auth - Planka authentication
 * @param boardId - Board ID
 * @param data - Notification service data
 */
export async function createBoardNotificationService(
  auth: PlankaAuth,
  boardId: BoardId,
  data: CreateNotificationServiceData,
): Promise<NotificationService> {
  return plankaFetch<NotificationService>(auth, `/api/boards/${boardId}/notification-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Create notification service for user
 * @param auth - Planka authentication
 * @param userId - User ID
 * @param data - Notification service data
 */
export async function createUserNotificationService(
  auth: PlankaAuth,
  userId: UserId,
  data: CreateNotificationServiceData,
): Promise<NotificationService> {
  return plankaFetch<NotificationService>(auth, `/api/users/${userId}/notification-services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update notification service
 * @param auth - Planka authentication
 * @param id - Notification service ID
 * @param data - Notification service data to update
 */
export async function updateNotificationService(
  auth: PlankaAuth,
  id: NotificationServiceId,
  data: UpdateNotificationServiceData,
): Promise<NotificationService> {
  return plankaFetch<NotificationService>(auth, `/api/notification-services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete notification service
 * @param auth - Planka authentication
 * @param id - Notification service ID
 */
export async function deleteNotificationService(
  auth: PlankaAuth,
  id: NotificationServiceId,
): Promise<NotificationService> {
  return plankaFetch<NotificationService>(auth, `/api/notification-services/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Test notification service
 * @param auth - Planka authentication
 * @param id - Notification service ID
 */
export async function testNotificationService(
  auth: PlankaAuth,
  id: NotificationServiceId,
): Promise<{ success: boolean; message?: string }> {
  return plankaFetch<{ success: boolean; message?: string }>(auth, `/api/notification-services/${id}/test`, {
    method: 'POST',
  });
}
