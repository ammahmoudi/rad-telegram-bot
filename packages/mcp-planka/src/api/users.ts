import type { PlankaAuth, PlankaUser } from '../types/index.js';
import { plankaFetch } from './client.js';

export async function listUsers(auth: PlankaAuth): Promise<any[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any }>(auth, '/api/users', {
    method: 'GET',
  });

  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getUser(auth: PlankaAuth, userId: string): Promise<PlankaUser> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
}

export async function createUser(
  auth: PlankaAuth,
  email: string,
  password: string,
  name: string,
  username?: string,
): Promise<any> {
  return await plankaFetch(auth, '/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, username }),
  });
}

export async function updateUser(
  auth: PlankaAuth,
  userId: string,
  updates: { name?: string; email?: string; username?: string },
): Promise<PlankaUser> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(auth: PlankaAuth, userId: string): Promise<PlankaUser> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export async function updateUserPassword(
  auth: PlankaAuth,
  userId: string,
  password: string,
  currentPassword?: string,
): Promise<PlankaUser> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, currentPassword }),
  });
}

export async function updateUserEmail(
  auth: PlankaAuth,
  userId: string,
  email: string,
): Promise<any> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}/email`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function updateUserUsername(
  auth: PlankaAuth,
  userId: string,
  username: string,
): Promise<any> {
  return await plankaFetch(auth, `/api/users/${encodeURIComponent(userId)}/username`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}
