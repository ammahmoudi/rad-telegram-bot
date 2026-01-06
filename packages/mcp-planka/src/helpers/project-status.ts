/**
 * Project and board status helpers
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard } from '../api/index.js';
import { getBoardActions } from '../api/actions.js';
import type { ProjectStatus, BoardStatus, EnrichedCard } from './types.js';
import { getUserCards } from './user-tasks.js';

/**
 * Get comprehensive status for a project
 * @param options - Filtering options:
 *   - startDate: Filter cards updated after this date
 *   - endDate: Filter cards updated before this date
 *   - includeCompleted: Include completed cards (default: true)
 *   - includeIncomplete: Include incomplete cards (default: true)
 *   - userId: Filter cards assigned to specific user
 */
export async function getProjectStatus(
  auth: PlankaAuth,
  projectId: string,
  options: {
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeIncomplete?: boolean;
    userId?: string;
    maxBoards?: number; // Limit number of boards to process
  } = {}
): Promise<ProjectStatus> {
  const {
    startDate,
    endDate,
    includeCompleted = true,
    includeIncomplete = true,
    userId,
    maxBoards = 10, // Default limit to prevent timeout
  } = options;

  const projectDetails = await getProject(auth, projectId);
  const projectName = (projectDetails as any).name;
  const boards = (projectDetails as any)?.included?.boards ?? [];

  // Limit boards to prevent timeout
  const boardsToProcess = boards.slice(0, maxBoards);

  const boardStatuses: ProjectStatus['boards'] = [];
  let totalCards = 0;
  let totalDoneCards = 0;
  let lastActivityTimestamp: string | undefined;

  for (const board of boardsToProcess) {
    const boardId = board.id;
    const boardName = board.name;

    try {
      const boardDetails = await getBoard(auth, boardId);
      let cards = (boardDetails as any)?.included?.cards ?? [];
      const taskLists = (boardDetails as any)?.included?.taskLists ?? [];
      const tasks = (boardDetails as any)?.included?.tasks ?? [];
      const cardMemberships = (boardDetails as any)?.included?.cardMemberships ?? [];
      const lists = (boardDetails as any)?.included?.lists ?? [];

      // Apply date filters
      if (startDate) {
        cards = cards.filter((c: any) => !c.updatedAt || c.updatedAt >= startDate);
      }
      if (endDate) {
        cards = cards.filter((c: any) => !c.updatedAt || c.updatedAt <= endDate);
      }

      // Apply user filter
      if (userId) {
        const userCardIds = cardMemberships
          .filter((cm: any) => cm.userId === userId)
          .map((cm: any) => cm.cardId);
        cards = cards.filter((c: any) => userCardIds.includes(c.id));
      }

      // Count cards and their statuses
      let doneCards = 0;
      let inProgressCards = 0;
      let overdueCards = 0;
      const now = new Date();

      // Initialize list stats
      const listStatsMap = new Map<string, { cardCount: number; doneCardCount: number }>();
      lists.forEach((list: any) => {
        listStatsMap.set(list.id, { cardCount: 0, doneCardCount: 0 });
      });

      for (const card of cards) {
        // Get tasks for this card
        const cardTaskLists = taskLists.filter((tl: any) => tl.cardId === card.id);
        const cardTasks = tasks.filter((t: any) =>
          cardTaskLists.some((tl: any) => tl.id === t.taskListId)
        );

        const completedTasks = cardTasks.filter((t: any) => t.isCompleted).length;
        const totalTaskCount = cardTasks.length;

        // Determine card status
        const isDone = totalTaskCount > 0 && completedTasks === totalTaskCount;
        const hasInProgressTasks = totalTaskCount > 0 && completedTasks > 0 && completedTasks < totalTaskCount;

        // Apply completion filters
        if (isDone && !includeCompleted) continue;
        if (!isDone && !includeIncomplete) continue;

        totalCards++;
        
        // Update list stats
        const listStats = listStatsMap.get(card.listId);
        if (listStats) {
          listStats.cardCount++;
          if (isDone) {
            listStats.doneCardCount++;
          }
        }
        
        if (isDone) {
          doneCards++;
          totalDoneCards++;
        } else if (hasInProgressTasks) {
          inProgressCards++;
        }

        // Check if overdue
        if (card.dueDate && new Date(card.dueDate) < now && !isDone) {
          overdueCards++;
        }

        // Track last activity
        if (card.updatedAt) {
          if (!lastActivityTimestamp || card.updatedAt > lastActivityTimestamp) {
            lastActivityTimestamp = card.updatedAt;
          }
        }
      }

      const completionPercentage = cards.length > 0 ? (doneCards / cards.length) * 100 : 0;

      // Build list data
      const listData = lists.map((list: any) => {
        const stats = listStatsMap.get(list.id) || { cardCount: 0, doneCardCount: 0 };
        return {
          listId: list.id,
          listName: list.name,
          cardCount: stats.cardCount,
          doneCardCount: stats.doneCardCount,
        };
      });

      boardStatuses.push({
        boardId,
        boardName,
        totalCards: cards.length,
        doneCards,
        inProgressCards,
        overdueCards,
        completionPercentage,
        lists: listData,
      });
    } catch (error) {
      console.error(`Error fetching board ${boardId}:`, error);
      // Continue to next board instead of failing
      continue;
    }
  }

  // Get last board activity (limit to processed boards only)
  try {
    for (const board of boardsToProcess.slice(0, 5)) { // Further limit action fetching to 5 boards
      const actions = await getBoardActions(auth, board.id);
      if (actions.length > 0) {
        const latestAction = actions[actions.length - 1];
        if (!lastActivityTimestamp || latestAction.createdAt > lastActivityTimestamp) {
          lastActivityTimestamp = latestAction.createdAt;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching board actions:', error);
  }

  const projectCompletionPercentage = totalCards > 0 ? (totalDoneCards / totalCards) * 100 : 0;

  return {
    projectId,
    projectName,
    boards: boardStatuses,
    totalCards,
    doneCards: totalDoneCards,
    completionPercentage: projectCompletionPercentage,
    lastActivity: lastActivityTimestamp,
  };
}

/**
 * Get comprehensive status for a board
 * @param options - Filtering options:
 *   - startDate: Filter cards updated after this date
 *   - endDate: Filter cards updated before this date
 *   - includeCompleted: Include completed cards (default: true)
 *   - includeIncomplete: Include incomplete cards (default: true)
 *   - userId: Filter cards assigned to specific user
 *   - listId: Filter cards in specific list
 */
export async function getBoardStatus(
  auth: PlankaAuth,
  boardId: string,
  options: {
    startDate?: string;
    endDate?: string;
    includeCompleted?: boolean;
    includeIncomplete?: boolean;
    userId?: string;
    listId?: string;
  } = {}
): Promise<BoardStatus> {
  const {
    startDate,
    endDate,
    includeCompleted = true,
    includeIncomplete = true,
    userId,
    listId,
  } = options;

  const boardDetails = await getBoard(auth, boardId);
  const board = (boardDetails as any).item || boardDetails;
  const boardName = board.name;
  const projectId = board.projectId;
  
  // Get included data
  const lists = (boardDetails as any)?.included?.lists ?? [];
  let cards = (boardDetails as any)?.included?.cards ?? [];
  const taskLists = (boardDetails as any)?.included?.taskLists ?? [];
  const tasks = (boardDetails as any)?.included?.tasks ?? [];
  const cardMemberships = (boardDetails as any)?.included?.cardMemberships ?? [];

  // Apply date filters
  if (startDate) {
    cards = cards.filter((c: any) => !c.updatedAt || c.updatedAt >= startDate);
  }
  if (endDate) {
    cards = cards.filter((c: any) => !c.updatedAt || c.updatedAt <= endDate);
  }

  // Apply user filter
  if (userId) {
    const userCardIds = cardMemberships
      .filter((cm: any) => cm.userId === userId)
      .map((cm: any) => cm.cardId);
    cards = cards.filter((c: any) => userCardIds.includes(c.id));
  }

  // Apply list filter
  if (listId) {
    cards = cards.filter((c: any) => c.listId === listId);
  }

  // Get project name
  const projectDetails = await getProject(auth, projectId);
  const project = (projectDetails as any).item || projectDetails;
  const projectName = project.name;

  const listStatuses: BoardStatus['lists'] = [];
  let totalDoneCards = 0;
  let lastActivityTimestamp: string | undefined;

  for (const list of lists) {
    const listId = list.id;
    const listName = list.name;

    const listCards = cards.filter((c: any) => c.listId === listId);
    let doneCardCount = 0;

    for (const card of listCards) {
      // Get tasks for this card
      const cardTaskLists = taskLists.filter((tl: any) => tl.cardId === card.id);
      const cardTasks = tasks.filter((t: any) =>
        cardTaskLists.some((tl: any) => tl.id === t.taskListId)
      );

      const completedTasks = cardTasks.filter((t: any) => t.isCompleted).length;
      const totalTaskCount = cardTasks.length;

      const isDone = totalTaskCount > 0 && completedTasks === totalTaskCount;
      
      // Apply completion filters
      if (isDone && !includeCompleted) continue;
      if (!isDone && !includeIncomplete) continue;
      
      if (isDone) {
        doneCardCount++;
        totalDoneCards++;
      }

      // Track last activity
      if (card.updatedAt) {
        if (!lastActivityTimestamp || card.updatedAt > lastActivityTimestamp) {
          lastActivityTimestamp = card.updatedAt;
        }
      }
    }

    listStatuses.push({
      listId,
      listName,
      cardCount: listCards.length,
      doneCardCount,
    });
  }

  // Get last board activity from actions
  try {
    const actions = await getBoardActions(auth, boardId);
    if (actions.length > 0) {
      const latestAction = actions[actions.length - 1];
      if (!lastActivityTimestamp || latestAction.createdAt > lastActivityTimestamp) {
        lastActivityTimestamp = latestAction.createdAt;
      }
    }
  } catch (error) {
    console.error('Error fetching board actions:', error);
  }

  const completionPercentage = cards.length > 0 ? (totalDoneCards / cards.length) * 100 : 0;

  return {
    boardId,
    boardName,
    projectId,
    projectName,
    lists: listStatuses,
    totalCards: cards.length,
    doneCards: totalDoneCards,
    completionPercentage,
    lastActivity: lastActivityTimestamp,
  };
}


