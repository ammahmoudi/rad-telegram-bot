/**
 * DEPRECATED: Standalone getUserTasks function
 * This function is kept for backup purposes only.
 * Use getUserCards() with includeTasks: true instead.
 * 
 * Backup date: 2025-12-30
 */

import type { PlankaAuth } from '../../types/index.js';
import { listProjects, getProject, getBoard, getCurrentUser } from '../../api/index.js';
import type { EnrichedTask, FilterOptions, SortOptions } from '../types.js';

/**
 * Resolve user ID - if "me" or undefined, get current user
 */
async function resolveUserId(auth: PlankaAuth, userId?: string): Promise<string> {
  if (!userId || userId === 'me') {
    const currentUser = await getCurrentUser(auth);
    return currentUser.id;
  }
  return userId;
}

/**
 * Get all tasks (checklist items) for a user across all their cards
 * @deprecated Use getUserCards() with includeTasks: true instead
 * @param userId - User ID or "me" for current user, or undefined for current user
 */
export async function getUserTasks(
  auth: PlankaAuth,
  userId?: string,
  options: FilterOptions & { includeCompleted?: boolean } = {},
  sort: SortOptions = { by: 'updatedAt', order: 'desc' }
): Promise<EnrichedTask[]> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const projects = await listProjects(auth);
  const allTasks: EnrichedTask[] = [];

  for (const project of projects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    if (options.projectId && projectId !== options.projectId) continue;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];

      for (const board of boards) {
        const boardId = board.id;
        const boardName = board.name;

        if (options.boardId && boardId !== options.boardId) continue;

        try {
          const boardDetails = await getBoard(auth, boardId);
          const cards = (boardDetails as any)?.included?.cards ?? [];
          const cardMemberships = (boardDetails as any)?.included?.cardMemberships ?? [];
          const tasks = (boardDetails as any)?.included?.tasks ?? [];
          const taskLists = (boardDetails as any)?.included?.taskLists ?? [];

          // Get cards assigned to user
          const userCardIds = new Set(
            cardMemberships
              .filter((cm: any) => cm.userId === resolvedUserId)
              .map((cm: any) => cm.cardId)
          );

          for (const card of cards) {
            if (!userCardIds.has(card.id)) continue;

            const cardTaskLists = taskLists.filter((tl: any) => tl.cardId === card.id);

            for (const taskList of cardTaskLists) {
              const taskListTasks = tasks.filter((t: any) => t.taskListId === taskList.id);

              for (const task of taskListTasks) {
                // Filter by completion status
                if (!options.includeCompleted && task.isCompleted) continue;
                if (options.done !== undefined) {
                  if (options.done && !task.isCompleted) continue;
                  if (!options.done && task.isCompleted) continue;
                }

                const enrichedTask: EnrichedTask = {
                  id: task.id,
                  name: task.name,
                  isCompleted: task.isCompleted,
                  position: task.position,
                  taskListId: task.taskListId,
                  taskListName: taskList.name,
                  createdAt: task.createdAt,
                  updatedAt: task.updatedAt,
                  cardId: card.id,
                  cardName: card.name,
                  boardId,
                  boardName,
                  projectId,
                  projectName,
                };

                allTasks.push(enrichedTask);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching board ${boardId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
    }
  }

  // Sort tasks
  allTasks.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sort.by) {
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aVal = new Date(a.updatedAt || a.createdAt).getTime();
        bVal = new Date(b.updatedAt || b.createdAt).getTime();
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'position':
        aVal = a.position;
        bVal = b.position;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (sort.order === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  return allTasks;
}
