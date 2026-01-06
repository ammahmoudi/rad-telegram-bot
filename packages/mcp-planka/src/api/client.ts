import type { PlankaAuth } from '../types/index.js';

export async function plankaFetch<T>(auth: PlankaAuth, path: string, init?: RequestInit): Promise<T> {
  const url = `${auth.plankaBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  // Add timeout to prevent infinite hangs
  // Use shorter timeout for testing environment
  const timeout = process.env.INTEGRATION_TEST ? 10000 : 60000; // 10s for tests, 60s for production
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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
      // Log 401 errors with more details
      if (resp.status === 401) {
        console.error(`[plankaFetch] 401 Unauthorized for ${path}`, {
          url,
          tokenPrefix: auth.accessToken.substring(0, 20) + '...',
          responseBody: text,
        });
      }
      throw new Error(`Planka API error (${resp.status}): ${text}`);
    }

    return (await resp.json()) as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Planka API timeout after ${timeout/1000} seconds`);
    }
    throw error;
  }
}
