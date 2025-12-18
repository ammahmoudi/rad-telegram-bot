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

// ===== Board Operations =====
export async function createBoard(
  auth: PlankaAuth,
  projectId: string,
  name: string,
  position?: number,
): Promise<any> {
  const body: any = {
    name,
    position: position ?? 65535,
  };

  return await plankaFetch(auth, `/api/projects/${encodeURIComponent(projectId)}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateBoard(
  auth: PlankaAuth,
  boardId: string,
  updates: { name?: string; position?: number },
): Promise<any> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteBoard(auth: PlankaAuth, boardId: string): Promise<any> {
  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'DELETE',
  });
}

// ===== List Operations =====
export async function createList(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  position?: number,
  color?: string,
): Promise<any> {
  const body: any = {
    name,
    position: position ?? 65535,
    type: 'active',
  };

  if (color) body.color = color;

  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateList(
  auth: PlankaAuth,
  listId: string,
  updates: { name?: string; position?: number; color?: string },
): Promise<any> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function archiveList(auth: PlankaAuth, listId: string): Promise<any> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'archive' }),
  });
}

export async function deleteList(auth: PlankaAuth, listId: string): Promise<any> {
  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}`, {
    method: 'DELETE',
  });
}

// ===== Card Operations =====
export async function createCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  description?: string,
  position?: number,
  dueDate?: string,
): Promise<any> {
  const body: any = {
    name,
    position: position ?? 65535,
    type: 'project',
  };

  if (description) body.description = description;
  if (dueDate) body.dueDate = new Date(dueDate).toISOString();

  return await plankaFetch(auth, `/api/lists/${encodeURIComponent(listId)}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateCard(
  auth: PlankaAuth,
  cardId: string,
  updates: { name?: string; description?: string; dueDate?: string; position?: number },
): Promise<any> {
  const body: any = { ...updates };
  if (body.dueDate) body.dueDate = new Date(body.dueDate).toISOString();

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteCard(auth: PlankaAuth, cardId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'DELETE',
  });
}

// ===== Label Operations =====
export async function getLabels(auth: PlankaAuth, boardId: string): Promise<any> {
  const board = await getBoard(auth, boardId);
  return (board as any)?.included?.labels ?? [];
}

export async function createLabel(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  color: string,
  position?: number,
): Promise<any> {
  const body: any = {
    name,
    color,
    position: position ?? 65535,
    type: 'label',
  };

  return await plankaFetch(auth, `/api/boards/${encodeURIComponent(boardId)}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateLabel(
  auth: PlankaAuth,
  labelId: string,
  updates: { name?: string; color?: string; position?: number },
): Promise<any> {
  return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteLabel(auth: PlankaAuth, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/labels/${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
  });
}

export async function assignLabelToCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labelId }),
  });
}

export async function removeLabelFromCard(auth: PlankaAuth, cardId: string, labelId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-labels/labelid:${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
  });
}

// ===== Member Operations =====
export async function getMembers(auth: PlankaAuth, projectId: string): Promise<any> {
  const project = await getProject(auth, projectId);
  return (project as any)?.included?.users ?? [];
}

export async function assignMemberToCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export async function removeMemberFromCard(auth: PlankaAuth, cardId: string, userId: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/card-memberships/userid:${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

// ===== Comment Operations =====
export async function getComments(auth: PlankaAuth, cardId: string): Promise<any> {
  const card = await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'GET',
  });
  return (card as any)?.included?.actions?.filter((a: any) => a.type === 'commentCard') ?? [];
}

export async function createComment(auth: PlankaAuth, cardId: string, text: string): Promise<any> {
  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'commentCard', data: { text } }),
  });
}

export async function updateComment(auth: PlankaAuth, commentId: string, text: string): Promise<any> {
  return await plankaFetch(auth, `/api/actions/${encodeURIComponent(commentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { text } }),
  });
}

export async function deleteComment(auth: PlankaAuth, commentId: string): Promise<any> {
  return await plankaFetch(auth, `/api/actions/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

// ===== Task List Operations =====
export async function createTaskList(
  auth: PlankaAuth,
  cardId: string,
  name: string,
  position?: number,
): Promise<any> {
  const body: any = {
    name,
    position: position ?? 65535,
    showOnFrontOfCard: true,
  };

  return await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}/task-lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateTaskList(
  auth: PlankaAuth,
  taskListId: string,
  updates: { name?: string; position?: number },
): Promise<any> {
  return await plankaFetch(auth, `/api/task-lists/${encodeURIComponent(taskListId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteTaskList(auth: PlankaAuth, taskListId: string): Promise<any> {
  return await plankaFetch(auth, `/api/task-lists/${encodeURIComponent(taskListId)}`, {
    method: 'DELETE',
  });
}

// ===== Task Operations =====
export async function createTask(
  auth: PlankaAuth,
  taskListId: string,
  name: string,
  position?: number,
): Promise<any> {
  const body: any = {
    name,
    position: position ?? 65535,
  };

  return await plankaFetch(auth, `/api/task-lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateTask(
  auth: PlankaAuth,
  taskId: string,
  updates: { name?: string; isCompleted?: boolean; position?: number },
): Promise<any> {
  return await plankaFetch(auth, `/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(auth: PlankaAuth, taskId: string): Promise<any> {
  return await plankaFetch(auth, `/api/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  });
}

// ===== Attachment Operations =====
export async function getAttachments(auth: PlankaAuth, cardId: string): Promise<any> {
  const card = await plankaFetch(auth, `/api/cards/${encodeURIComponent(cardId)}`, {
    method: 'GET',
  });
  return (card as any)?.included?.attachments ?? [];
}

export async function deleteAttachment(auth: PlankaAuth, attachmentId: string): Promise<any> {
  return await plankaFetch(auth, `/api/attachments/${encodeURIComponent(attachmentId)}`, {
    method: 'DELETE',
  });
}
