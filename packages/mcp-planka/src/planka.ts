export type PlankaAuth = {
  plankaBaseUrl: string;
  accessToken: string;
};

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

export async function listProjects(auth: PlankaAuth): Promise<any[]> {
  const data = await plankaFetch<{ items?: any[]; item?: any; included?: any }>(auth, '/api/projects', {
    method: 'GET',
  });

  // Planka list endpoints usually return { items: [...] }
  if (Array.isArray((data as any).items)) return (data as any).items;
  if (Array.isArray((data as any).item)) return (data as any).item;
  return (data as any).items ?? [];
}

export async function getProject(auth: PlankaAuth, projectId: string): Promise<any> {
  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}`, { method: 'GET' });
}

export async function getBoard(auth: PlankaAuth, boardId: string): Promise<any> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, { method: 'GET' });
}

export async function moveCard(auth: PlankaAuth, cardId: string, listId: string, position?: number): Promise<any> {
  const body: any = { listId };
  if (typeof position === 'number') body.position = position;

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function createCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  description?: string,
): Promise<any> {
  const body: any = {
    position: 0,
    name,
  };

  if (description) {
    body.description = description;
  }

  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateCard(
  auth: PlankaAuth,
  cardId: string,
  updates: { name?: string; description?: string },
): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}
