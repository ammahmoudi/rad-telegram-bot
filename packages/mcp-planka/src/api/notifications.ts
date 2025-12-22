import type { PlankaAuth, PlankaNotification } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getNotifications(auth: PlankaAuth): Promise<PlankaNotification[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(auth, '/api/notifications', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getNotification(auth: PlankaAuth, notificationId: string): Promise<PlankaNotification> {
  return await plankaFetch(auth, `/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'GET',
  });
}

export async function updateNotification(
  auth: PlankaAuth,
  notificationId: string,
  updates: { isRead?: boolean },
): Promise<PlankaNotification> {
  return await plankaFetch(auth, `/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function markAllNotificationsAsRead(auth: PlankaAuth): Promise<{ success: boolean }> {
  return await plankaFetch(auth, '/api/notifications/read-all', {
    method: 'POST',
  });
}
