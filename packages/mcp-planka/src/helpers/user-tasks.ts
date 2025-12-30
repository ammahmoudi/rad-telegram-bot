/**
 * User tasks and cards management helpers
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard, getCurrentUser } from '../api/index.js';
import { getCardActions } from '../api/actions.js';
import type { EnrichedCard, EnrichedTask, FilterOptions, SortOptions } from './types.js';

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
 * Get all cards/tasks for a user with filtering and sorting
 * @param userId - User ID or "me" for current user, or undefined for current user
 */
export async function getUserCards(
  auth: PlankaAuth,
  userId?: string,
  options: FilterOptions = {},
  sort: SortOptions = { by: 'updatedAt', order: 'desc' }
): Promise<EnrichedCard[]> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const projects = await listProjects(auth);
  const allCards: EnrichedCard[] = [];

  for (const project of projects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    // Skip if filtering by project and this isn't it
    if (options.projectId && projectId !== options.projectId) continue;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      for (const board of boards) {
        const boardId = board.id;
        const boardName = board.name;

        // Skip if filtering by board and this isn't it
        if (options.boardId && boardId !== options.boardId) continue;

        try {
          const boardDetails = await getBoard(auth, boardId);
          const lists = (boardDetails as any)?.included?.lists ?? [];
          const cards = (boardDetails as any)?.included?.cards ?? [];
          const cardMemberships = (boardDetails as any)?.included?.cardMemberships ?? [];
          const cardLabels = (boardDetails as any)?.included?.cardLabels ?? [];
          const labels = (boardDetails as any)?.included?.labels ?? [];
          const tasks = (boardDetails as any)?.included?.tasks ?? [];
          const taskLists = (boardDetails as any)?.included?.taskLists ?? [];

          // Filter cards by user assignment
          const userCardIds = new Set(
            cardMemberships
              .filter((cm: any) => cm.userId === resolvedUserId)
              .map((cm: any) => cm.cardId)
          );

          for (const card of cards) {
            // Skip if not assigned to user (unless we're not filtering by user)
            if (!options.assignedTo && !userCardIds.has(card.id)) continue;
            if (options.assignedTo && !options.assignedTo.some(uid => 
              cardMemberships.some((cm: any) => cm.cardId === card.id && cm.userId === uid)
            )) continue;

            // Skip if filtering by list
            if (options.listId && card.listId !== options.listId) continue;

            // Get card details
            const list = lists.find((l: any) => l.id === card.listId);
            const listName = list?.name ?? 'Unknown List';

            // Get assignees
            const cardAssigneeIds = cardMemberships
              .filter((cm: any) => cm.cardId === card.id)
              .map((cm: any) => cm.userId);
            const assignees = users
              .filter((u: any) => cardAssigneeIds.includes(u.id))
              .map((u: any) => ({ id: u.id, name: u.name, email: u.email }));

            // Get labels
            const cardLabelIds = cardLabels
              .filter((cl: any) => cl.cardId === card.id)
              .map((cl: any) => cl.labelId);
            const cardLabelsData = labels
              .filter((l: any) => cardLabelIds.includes(l.id))
              .map((l: any) => ({ id: l.id, name: l.name, color: l.color }));

            // Skip if filtering by labels
            if (options.hasLabels && !options.hasLabels.some(lid => cardLabelIds.includes(lid))) continue;

            // Get tasks for this card
            const cardTaskLists = taskLists.filter((tl: any) => tl.cardId === card.id);
            const cardTasks = tasks.filter((t: any) =>
              cardTaskLists.some((tl: any) => tl.id === t.taskListId)
            );
            const completedTasks = cardTasks.filter((t: any) => t.isCompleted).length;
            const totalTasks = cardTasks.length;
            const taskPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Determine if card is done
            const isDone = totalTasks > 0 ? taskPercentage === 100 : false;

            // Apply done filter
            if (options.done !== undefined) {
              if (options.done && !isDone) continue;
              if (!options.done && isDone) continue;
            }

            // Apply due date filter
            if (options.dueDate) {
              if (options.dueDate.before && card.dueDate && card.dueDate >= options.dueDate.before) continue;
              if (options.dueDate.after && card.dueDate && card.dueDate <= options.dueDate.after) continue;
              if (options.dueDate.on && card.dueDate && !card.dueDate.startsWith(options.dueDate.on)) continue;
            }

            // Apply search filter
            if (options.search) {
              const searchLower = options.search.toLowerCase();
              const matchesSearch =
                card.name?.toLowerCase().includes(searchLower) ||
                card.description?.toLowerCase().includes(searchLower);
              if (!matchesSearch) continue;
            }

            const enrichedCard: EnrichedCard = {
              id: card.id,
              name: card.name,
              description: card.description,
              position: card.position,
              listId: card.listId,
              boardId: boardId,
              dueDate: card.dueDate,
              createdAt: card.createdAt,
              updatedAt: card.updatedAt,
              projectName,
              projectId,
              boardName,
              listName,
              assignees,
              labels: cardLabelsData,
              tasks: {
                total: totalTasks,
                completed: completedTasks,
                percentage: taskPercentage,
              },
              isDone,
            };

            // Include full task items if requested
            if (options.includeTasks && cardTasks.length > 0) {
              enrichedCard.taskItems = [];
              for (const taskList of cardTaskLists) {
                const taskListTasks = cardTasks.filter((t: any) => t.taskListId === taskList.id);
                for (const task of taskListTasks) {
                  enrichedCard.taskItems.push({
                    id: task.id,
                    name: task.name,
                    isCompleted: task.isCompleted,
                    position: task.position,
                    taskListId: task.taskListId,
                    taskListName: taskList.name,
                  });
                }
              }
            }

            // Include card history if requested
            if (options.includeHistory) {
              try {
                const history = await getCardHistory(auth, card.id);
                enrichedCard.history = history;
              } catch (error) {
                console.error(`Error fetching history for card ${card.id}:`, error);
                enrichedCard.history = [];
              }
            }

            allCards.push(enrichedCard);
          }
        } catch (error) {
          console.error(`Error fetching board ${boardId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
    }
  }

  // Sort cards
  allCards.sort((a, b) => {
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
      case 'dueDate':
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
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

  return allCards;
}

/**
 * Get card history (actions) with enriched context
 */
export async function getCardHistory(
  auth: PlankaAuth,
  cardId: string
): Promise<any[]> {
  const actions = await getCardActions(auth, cardId);
  return actions.map((action: any) => ({
    id: action.id,
    type: action.type,
    data: action.data,
    userId: action.userId,
    createdAt: action.createdAt,
  }));
}
