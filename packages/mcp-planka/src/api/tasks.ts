import type { PlankaAuth, PlankaTaskList, PlankaTask } from '../types/index.js';
import { plankaFetch } from './client.js';

// ===== Task List Operations =====
export async function createTaskList(
  auth: PlankaAuth,
  cardId: string,
  name: string,
  position?: number,
): Promise<PlankaTaskList> {
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
): Promise<PlankaTaskList> {
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
): Promise<PlankaTask> {
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
): Promise<PlankaTask> {
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
