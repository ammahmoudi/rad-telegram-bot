import type { PlankaAuth } from '../types/index.js';

export async function plankaFetch<T>(auth: PlankaAuth, path: string, init?: RequestInit): Promise<T> {
  const url = `${auth.plankaBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  // Add timeout to prevent infinite hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const resp = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
        Authorization: `Bearer ${auth.accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Planka API error (${resp.status}): ${text}`);
    }

    return (await resp.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Planka API timeout after 60 seconds');
    }
    throw error;
  }
}
