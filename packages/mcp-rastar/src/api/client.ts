import type { RastarAuth } from '../types/index.js';

const RASTAR_SUPABASE_URL = process.env.RASTAR_SUPABASE_URL;
const RASTAR_SUPABASE_ANON_KEY = process.env.RASTAR_SUPABASE_ANON_KEY;
const RASTAR_SUPABASE_KEY_HEADER = process.env.RASTAR_SUPABASE_KEY_HEADER || 'apikey';

if (!RASTAR_SUPABASE_URL || !RASTAR_SUPABASE_ANON_KEY) {
  throw new Error('RASTAR_SUPABASE_URL and RASTAR_SUPABASE_ANON_KEY environment variables are required');
}

// Asserted as non-null after the check above
const baseUrl = RASTAR_SUPABASE_URL!;
const anonKey = RASTAR_SUPABASE_ANON_KEY!;

export interface RastarFetchOptions extends RequestInit {
  params?: Record<string, string>;
}

const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function rastarFetch<T>(
  path: string,
  auth?: RastarAuth,
  options?: RastarFetchOptions
): Promise<T> {
  const { params, ...init } = options || {};
  
  let url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    [RASTAR_SUPABASE_KEY_HEADER]: anonKey,
    ...(init.headers as Record<string, string> || {}),
  };

  if (auth) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (resp.status === 204 || resp.headers.get('content-length') === '0') {
        return null as T;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Rastar API error (${resp.status}): ${text}`);
      }

      const contentType = resp.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await resp.json()) as T;
      }

      return (await resp.text()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const isAbort = error?.name === 'AbortError';
      const canRetry = attempt < MAX_RETRIES;

      if (isAbort && canRetry) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (isAbort) {
        throw new Error(`Rastar API timeout after ${REQUEST_TIMEOUT_MS / 1000} seconds`);
      }

      if (canRetry) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Rastar API request failed after retries');
}
