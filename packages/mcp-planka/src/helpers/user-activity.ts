/**
 * User activity and notification helpers
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard, getCurrentUser } from '../api/index.js';
import { getNotifications } from '../api/notifications.js';
import { getBoardActions, getCardActions } from '../api/actions.js';
import type { ActivityItem, NotificationItem } from './types.js';

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
  
  // Filter by user and read status
  let userNotifications = notifications
    .filter((n: any) => n.userId === resolvedUserId)
    .filter((n: any) => !options.unreadOnly || !n.isRead);

  // Limit results
  if (options.limit) {
    userNotifications = userNotifications.slice(0, options.limit);
  }

  // Enrich with context
  const enriched: NotificationItem[] = [];

  for (const notification of userNotifications) {
    const enrichedNotification: NotificationItem = {
      id: notification.id,
      userId: notification.userId,
      cardId: notification.cardId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    // Try to get card context if available
    if (notification.cardId) {
      try {
        // We need to find which board/project this card belongs to
        const projects = await listProjects(auth);
        
        for (const project of projects) {
          const projectId = (project as any).id;
          const projectName = (project as any).name;
          
          try {
            const projectDetails = await getProject(auth, projectId);
            const boards = (projectDetails as any)?.included?.boards ?? [];
            
            for (const board of boards) {
              const boardId = board.id;
              const boardName = board.name;
              
              try {
                const boardDetails = await getBoard(auth, boardId);
                const cards = (boardDetails as any)?.included?.cards ?? [];
                
                const card = cards.find((c: any) => c.id === notification.cardId);
                if (card) {
                  enrichedNotification.cardName = card.name;
                  enrichedNotification.boardId = boardId;
                  enrichedNotification.boardName = boardName;
                  enrichedNotification.projectId = projectId;
                  enrichedNotification.projectName = projectName;
                  break;
                }
              } catch (error) {
                // Continue searching
              }
            }
            
            if (enrichedNotification.cardName) break;
          } catch (error) {
            // Continue searching
          }
        }
      } catch (error) {
        console.error('Error enriching notification:', error);
      }
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
    startDate?: string; // ISO date string
    endDate?: string;   // ISO date string
    limit?: number;
    projectId?: string;
    boardId?: string;
  } = {}
): Promise<ActivityItem[]> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const projects = await listProjects(auth);
  const allActivities: ActivityItem[] = [];

  for (const project of projects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    if (options.projectId && projectId !== options.projectId) continue;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      for (const board of boards) {
        const boardId = board.id;
        const boardName = board.name;

        if (options.boardId && boardId !== options.boardId) continue;

        try {
          // Get board actions
          const actions = await getBoardActions(auth, boardId);
          
          for (const action of actions) {
            // Filter by user
            if (action.userId !== resolvedUserId) continue;

            // Filter by date range
            const actionDate = new Date(action.createdAt);
            if (options.startDate && actionDate < new Date(options.startDate)) continue;
            if (options.endDate && actionDate > new Date(options.endDate)) continue;

            // Get user name
            const user = users.find((u: any) => u.id === action.userId);
            const userName = user?.name ?? 'Unknown User';

            // Get card context if available
            let cardName: string | undefined;
            let cardId: string | undefined;

            if (action.cardId) {
              const boardDetails = await getBoard(auth, boardId);
              const cards = (boardDetails as any)?.included?.cards ?? [];
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
          }
        } catch (error) {
          console.error(`Error fetching actions for board ${boardId}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
    }
  }

  // Sort by timestamp descending
  allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit results
  if (options.limit) {
    return allActivities.slice(0, options.limit);
  }

  return allActivities;
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
  activity: ActivityItem[];
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
        })
      : Promise.resolve([]),
  ]);

  // Calculate summary stats
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const lastActivity = activity.length > 0 ? activity[0].timestamp : undefined;
  const lastNotification = notifications.length > 0 ? notifications[0].createdAt : undefined;

  return {
    notifications,
    activity,
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
