import type { RastarAuth } from '../types/index.js';

const THIRD_PARTY_BASE_URL = process.env.THIRD_PARTY_BASE_URL || 'https://hhryfmueyrkbnjxgjzlf.supabase.co';
const THIRD_PARTY_API_KEY = process.env.THIRD_PARTY_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhocnlmbXVleXJrYm5qeGdqemxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MDMwMDYsImV4cCI6MjA1NTQ3OTAwNn0.zB6aDG8aTVqXkyguz1u35rGYlz05bDy20d5GXjhxirU';
const THIRD_PARTY_API_KEY_HEADER = process.env.THIRD_PARTY_API_KEY_HEADER || 'apikey';

export interface RastarFetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function rastarFetch<T>(
  path: string,
  auth?: RastarAuth,
  options?: RastarFetchOptions
): Promise<T> {
  const { params, ...init } = options || {};
  
  let url = `${THIRD_PARTY_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    [THIRD_PARTY_API_KEY_HEADER]: THIRD_PARTY_API_KEY,
    ...(init.headers as Record<string, string> || {}),
  };

  if (auth) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

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
    if (error.name === 'AbortError') {
      throw new Error('Rastar API timeout after 30 seconds');
    }
    throw error;
  }
}
