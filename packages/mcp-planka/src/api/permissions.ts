import type { PlankaAuth, PlankaPermission } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function getMyPermissions(auth: PlankaAuth): Promise<PlankaPermission[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(auth, '/api/permissions/my', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getPermissions(
  auth: PlankaAuth,
  resourceType: string,
  resourceId: string,
): Promise<any[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(
    auth,
    `/api/permissions/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
    { method: 'GET' },
  );

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function grantPermission(
  auth: PlankaAuth,
  resourceType: string,
  resourceId: string,
  userId: string,
  permissions: string[],
): Promise<any> {
  return await plankaFetch(auth, '/api/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceType, resourceId, userId, permissions }),
  });
}

export async function revokePermission(auth: PlankaAuth, permissionId: string): Promise<PlankaPermission> {
  return await plankaFetch(auth, `/api/permissions/${encodeURIComponent(permissionId)}`, {
    method: 'DELETE',
  });
}
