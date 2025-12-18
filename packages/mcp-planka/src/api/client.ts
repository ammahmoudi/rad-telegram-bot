import type { PlankaAuth } from '../types/index.js';

export async function plankaFetch<T>(auth: PlankaAuth, path: string, init?: RequestInit): Promise<T> {
  const url = `${auth.plankaBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const resp = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Planka API error (${resp.status}): ${text}`);
  }

  return (await resp.json()) as T;
}
