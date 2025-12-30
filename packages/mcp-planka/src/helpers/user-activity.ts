/**
 * User activity and notification helpers
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard, getCurrentUser } from '../api/index.js';
import { getNotifications } from '../api/notifications.js';
import { getBoardActions, getCardActions } from '../api/actions.js';
import type { ActivityItem, NotificationItem } from './types.js';
import { parseDate } from '../utils/date-time.js';

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
 * Get all notifications for a user with enriched context
 * @param userId - User ID or "me" for current user, or undefined for current user
 */
export async function getUserNotifications(
  auth: PlankaAuth,
  userId?: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<NotificationItem[]> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const notifications = await getNotifications(auth);
  
  // Apply default limit to prevent timeout
  const effectiveLimit = options.limit || 20;
  
  // Filter by user and read status
  let userNotifications = notifications
    .filter((n: any) => n.userId === resolvedUserId)
    .filter((n: any) => !options.unreadOnly || !n.isRead)
    .slice(0, effectiveLimit); // Limit early to reduce processing

  // Enrich with context (only for limited notifications)
  const enriched: NotificationItem[] = [];
  const cardCache = new Map<string, { projectId: string; projectName: string; boardId: string; boardName: string; cardName: string }>();

  for (const notification of userNotifications) {
    const enrichedNotification: NotificationItem = {
      id: notification.id,
      userId: notification.userId,
      cardId: notification.cardId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    // Try to get card context if available and not cached
    if (notification.cardId && !cardCache.has(notification.cardId)) {
      try {
        // Find card in projects (limit search scope)
        const projects = await listProjects(auth);
        let found = false;
        let boardsFetched = 0;
        const maxBoardsToFetch = 10; // Limit total boards to prevent timeout
        
        // Only search first few projects to avoid timeout
        for (const project of projects.slice(0, 10)) {
          if (found || boardsFetched >= maxBoardsToFetch) break;
          
          const projectId = (project as any).id;
          const projectName = (project as any).name;
          
          try {
            const projectDetails = await getProject(auth, projectId);
            const boards = (projectDetails as any)?.included?.boards ?? [];
            
            for (const board of boards) {
              if (found || boardsFetched >= maxBoardsToFetch) break;
              
              boardsFetched++; // Increment board fetch counter
              const boardId = board.id;
              const boardName = board.name;
              
              try {
                const boardDetails = await getBoard(auth, boardId);
                const cards = (boardDetails as any)?.included?.cards ?? [];
                
                const card = cards.find((c: any) => c.id === notification.cardId);
                if (card) {
                  cardCache.set(notification.cardId, {
                    projectId,
                    projectName,
                    boardId,
                    boardName,
                    cardName: card.name,
                  });
                  found = true;
                  break;
                }
              } catch (error) {
                // Skip this board
              }
            }
          } catch (error) {
            // Skip this project
          }
        }
      } catch (error) {
        console.error('Error enriching notification with card context:', error);
      }
    }
    
    // Add cached card context if available
    if (notification.cardId && cardCache.has(notification.cardId)) {
      const cardContext = cardCache.get(notification.cardId)!;
      enrichedNotification.cardName = cardContext.cardName;
      enrichedNotification.boardId = cardContext.boardId;
      enrichedNotification.boardName = cardContext.boardName;
      enrichedNotification.projectId = cardContext.projectId;
      enrichedNotification.projectName = cardContext.projectName;
    }

    // Try to get related action if available
    if (notification.actionId && notification.cardId) {
      try {
        const actions = await getCardActions(auth, notification.cardId);
        const action = actions.find((a: any) => a.id === notification.actionId);
        if (action) {
          enrichedNotification.action = {
            id: action.id,
            type: action.type,
            timestamp: action.createdAt,
            userId: action.userId,
            userName: '', // We don't have user name in action
            data: action.data,
            description: formatActionDescription(action),
          };
        }
      } catch (error) {
        console.error('Error fetching related action:', error);
      }
    }

    enriched.push(enrichedNotification);
  }

  return enriched;
}

/**
 * Get user actions history across all projects (what the user DID)
 * This returns actions/activities performed BY the user (creating cards, commenting, etc.)
 * For notifications (things that happened TO the user), use getUserNotifications()
 * For both combined, use getUserActivitySummary()
 * 
 * @param userId - User ID or "me" for current user, or undefined for current user
 */
export async function getUserActions(
  auth: PlankaAuth,
  userId?: string,
  options: {
    startDate?: string; // ISO date string or relative ("today", "2 days ago")
    endDate?: string;   // ISO date string or relative
    limit?: number;
    projectId?: string;
    boardId?: string;
  } = {}
): Promise<ActivityItem[]> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const projects = await listProjects(auth);
  const allActivities: ActivityItem[] = [];
  
  // Parse date strings to ISO format (handles relative dates like "today", "2 days ago")
  const startDateISO = options.startDate ? parseDate(options.startDate).iso : undefined;
  const endDateISO = options.endDate ? parseDate(options.endDate).iso : undefined;
  
  // Apply default limit to prevent timeout
  const effectiveLimit = options.limit || 50;
  
  // Cache for board details to avoid redundant fetches
  const boardDetailsCache = new Map<string, any>();
  
  // Limit total boards to fetch
  let boardsFetched = 0;
  const maxBoardsToFetch = 10;

  for (const project of projects) {
    // Early exit if we hit limits
    if (allActivities.length >= effectiveLimit || boardsFetched >= maxBoardsToFetch) {
      break;
    }
    
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    if (options.projectId && projectId !== options.projectId) continue;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      for (const board of boards) {
        // Early exit if limits reached
        if (allActivities.length >= effectiveLimit || boardsFetched >= maxBoardsToFetch) {
          break;
        }
        
        boardsFetched++; // Increment counter
        const boardId = board.id;
        const boardName = board.name;

        if (options.boardId && boardId !== options.boardId) continue;

        try {
          // Get board actions
          const actions = await getBoardActions(auth, boardId);
          
          // Fetch board details once and cache it
          if (!boardDetailsCache.has(boardId)) {
            const boardDetails = await getBoard(auth, boardId);
            boardDetailsCache.set(boardId, boardDetails);
          }
          const boardDetails = boardDetailsCache.get(boardId);
          const cards = (boardDetails as any)?.included?.cards ?? [];
          
          for (const action of actions) {
            // Filter by user
            if (action.userId !== resolvedUserId) continue;

            // Filter by date range
            const actionDate = new Date(action.createdAt);
            if (startDateISO && actionDate < new Date(startDateISO)) continue;
            if (endDateISO && actionDate > new Date(endDateISO)) continue;

            // Get user name
            const user = users.find((u: any) => u.id === action.userId);
            const userName = user?.name ?? 'Unknown User';

            // Get card context if available (use cached data)
            let cardName: string | undefined;
            let cardId: string | undefined;

            if (action.cardId) {
              const card = cards.find((c: any) => c.id === action.cardId);
              if (card) {
                cardName = card.name;
                cardId = card.id;
              }
            }

            const activity: ActivityItem = {
              id: action.id,
              type: action.type,
              timestamp: action.createdAt,
              userId: action.userId,
              userName,
              cardId,
              cardName,
              boardId,
              boardName,
              projectId,
              projectName,
              data: action.data,
              description: formatActionDescription(action),
            };

            allActivities.push(activity);
            
            // Early exit if we've reached the limit
            if (allActivities.length >= effectiveLimit) {
              break;
            }
          }
          
          // Early exit if we've reached the limit
          if (allActivities.length >= effectiveLimit) {
            break;
          }
        } catch (error) {
          console.error(`Error fetching actions for board ${boardId}:`, error);
        }
      }
      
      // Early exit if we've reached the limit
      if (allActivities.length >= effectiveLimit) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
    }
  }

  // Sort by timestamp descending
  allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Return limited results
  return allActivities.slice(0, effectiveLimit);
}

/**
 * Get complete activity summary for a user - both actions they performed and notifications they received
 * This is a convenience function that combines getUserActivity and getUserNotifications
 * @param userId - User ID or "me" for current user, or undefined for current user
 */
export async function getUserActivitySummary(
  auth: PlankaAuth,
  userId?: string,
  options: {
    startDate?: string;
    endDate?: string;
    unreadNotificationsOnly?: boolean;
    includeActivity?: boolean;  // Default: true
    includeNotifications?: boolean;  // Default: true
  } = {}
): Promise<{
  notifications: NotificationItem[];
  actions: ActivityItem[];
  summary: {
    unreadNotificationsCount: number;
    totalNotificationsCount: number;
    activityCount: number;
    lastActivityAt?: string;
    lastNotificationAt?: string;
  };
}> {
  const includeActivity = options.includeActivity !== false;
  const includeNotifications = options.includeNotifications !== false;

  // Fetch both in parallel for better performance
  const [notifications, activity] = await Promise.all([
    includeNotifications
      ? getUserNotifications(auth, userId, { unreadOnly: options.unreadNotificationsOnly })
      : Promise.resolve([]),
    includeActivity
      ? getUserActions(auth, userId, {
          startDate: options.startDate,
          endDate: options.endDate,
          limit: 50, // Default limit to prevent timeout
        })
      : Promise.resolve([]),
  ]);

  // Calculate summary stats
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const lastActivity = activity.length > 0 ? activity[0].timestamp : undefined;
  const lastNotification = notifications.length > 0 ? notifications[0].createdAt : undefined;

  return {
    notifications,
    actions: activity, // Rename to match expected API
    summary: {
      unreadNotificationsCount: unreadNotifications.length,
      totalNotificationsCount: notifications.length,
      activityCount: activity.length,
      lastActivityAt: lastActivity,
      lastNotificationAt: lastNotification,
    },
  };
}

/**
 * Format an action into a human-readable description
 */
function formatActionDescription(action: any): string {
  const { type, data } = action;

  switch (type) {
    case 'createCard':
      return `Created card`;
    case 'updateCard':
      if (data.name) return `Renamed card to "${data.name}"`;
      if (data.description) return `Updated card description`;
      if (data.dueDate) return `Set due date to ${new Date(data.dueDate).toLocaleDateString()}`;
      return `Updated card`;
    case 'moveCard':
      return `Moved card`;
    case 'deleteCard':
      return `Deleted card`;
    case 'createComment':
      return `Added comment: "${data.text?.substring(0, 50)}${data.text?.length > 50 ? '...' : ''}"`;
    case 'updateComment':
      return `Updated comment`;
    case 'deleteComment':
      return `Deleted comment`;
    case 'createTask':
      return `Added task: "${data.name}"`;
    case 'updateTask':
      if (data.isCompleted === true) return `Completed task: "${data.name}"`;
      if (data.isCompleted === false) return `Reopened task: "${data.name}"`;
      return `Updated task: "${data.name}"`;
    case 'deleteTask':
      return `Deleted task`;
    case 'addMemberToCard':
      return `Added member to card`;
    case 'removeMemberFromCard':
      return `Removed member from card`;
    case 'addLabelToCard':
      return `Added label to card`;
    case 'removeLabelFromCard':
      return `Removed label from card`;
    case 'addAttachmentToCard':
      return `Added attachment: "${data.name}"`;
    case 'deleteAttachment':
      return `Deleted attachment`;
    default:
      return type || 'Unknown action';
  }
}
