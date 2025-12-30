/**
 * Daily report specific helpers
 * 
 * Daily report structure:
 * - Project name format: "Daily report - {team/org name}" (e.g., "Daily report - R&D")
 * - Each board represents a person (board name is the person's name, e.g., "امیرحسین محمودی")
 * - Each list represents a season/period (e.g., "پاییز ۱۴۰۴" - Autumn 1404)
 * - Each card contains daily report content in:
 *   - Card name (can be the date or title)
 *   - Card description (report content)
 *   - Card comments (additional report entries)
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard, getCurrentUser, getCard } from '../api/index.js';
import { getComments } from '../api/comments.js';
import { createCard } from '../api/cards.js';
import type { DailyReportEntry } from './types.js';
import { getUserActions } from './user-activity.js';

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
 * Check if a project is a daily report project
 * Matches projects starting with "Daily report" or "daily report" (case insensitive)
 */
export function isDailyReportProject(projectName: string): boolean {
  return /^daily\s+report/i.test(projectName.trim());
}

/**
 * Get all daily report projects with their boards
 * Returns projects with board information (each board represents a person)
 */
export async function getDailyReportProjects(auth: PlankaAuth): Promise<Array<{
  id: string;
  name: string;
  boards: Array<{
    id: string;
    name: string;
  }>;
}>> {
  const projects = await listProjects(auth);
  const dailyReportProjects = projects.filter((p: any) => isDailyReportProject(p.name));
  
  const result = [];
  
  for (const project of dailyReportProjects) {
    try {
      const projectDetails = await getProject(auth, (project as any).id);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      
      result.push({
        id: (project as any).id,
        name: (project as any).name,
        boards: boards.map((b: any) => ({
          id: b.id,
          name: b.name,
        })),
      });
    } catch (error) {
      console.error(`Error fetching project details for ${(project as any).id}:`, error);
      // Still include the project even if boards fail to load
      result.push({
        id: (project as any).id,
        name: (project as any).name,
        boards: [],
      });
    }
  }
  
  return result;
}

/**
 * Parse date from card name or use card creation date
 * Supports formats like: "2024-12-29", "29/12/2024", "Dec 29, 2024", "1404/09/15", etc.
 * If no date found, returns card's creation date
 */
function extractDateFromCard(cardName: string, cardCreatedAt: string): string {
  // Try ISO format first: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = cardName.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dateMatch = cardName.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try to parse with Date constructor
  try {
    const date = new Date(cardName);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Failed to parse
  }

  // Fallback to card creation date
  return cardCreatedAt.split('T')[0];
}

/**
 * Get all daily report entries for a user
 * @param userId - User ID or "me" for current user, or undefined for current user
 * @param options - Filtering and summary options
 */
export async function getUserDailyReports(
  auth: PlankaAuth,
  userId?: string,
  options: {
    startDate?: string;      // ISO date
    endDate?: string;        // ISO date
    projectId?: string;      // Specific daily report project
    includeSummary?: boolean; // Include summary with missing dates (default: false)
  } = {}
): Promise<DailyReportEntry[] | {
  entries: DailyReportEntry[];
  summary: {
    totalReports: number;
    missingDates: string[];
    reportedDates: string[];
  };
}> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const projects = await listProjects(auth);
  const dailyReportProjects = projects.filter((p: any) => 
    isDailyReportProject(p.name) &&
    (!options.projectId || p.id === options.projectId)
  );

  const entries: DailyReportEntry[] = [];

  for (const project of dailyReportProjects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      // Find user's board (board name should match user's name)
      const user = users.find((u: any) => u.id === resolvedUserId);
      if (!user) continue;

      const userBoard = boards.find((b: any) => 
        b.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(b.name.toLowerCase())
      );

      if (!userBoard) continue;

      const boardId = userBoard.id;
      const boardName = userBoard.name;

      // Get board details
      const boardDetails = await getBoard(auth, boardId);
      const lists = (boardDetails as any)?.included?.lists ?? [];
      const cards = (boardDetails as any)?.included?.cards ?? [];

      for (const card of cards) {
        // Extract date from card name or use creation date
        const dateStr = extractDateFromCard(card.name, card.createdAt);

        // Apply date filters
        if (options.startDate && dateStr < options.startDate) continue;
        if (options.endDate && dateStr > options.endDate) continue;

        const list = lists.find((l: any) => l.id === card.listId);
        const listName = list?.name ?? 'Unknown Season';

        // Combine content from card description and comments
        let content = '';
        
        // Add card description if available
        if (card.description && card.description.trim()) {
          content += card.description.trim();
        }

        // Try to fetch and add comments
        try {
          const comments = await getComments(auth, card.id);
          if (comments && comments.length > 0) {
            const commentTexts = comments
              .filter((c: any) => c.data?.text)
              .map((c: any) => c.data.text.trim())
              .filter(Boolean);
            
            if (commentTexts.length > 0) {
              if (content) content += '\n\n---\n\n';
              content += commentTexts.join('\n\n');
            }
          }
        } catch (error) {
          // If comments fail to load, continue without them
          console.error(`Could not fetch comments for card ${card.id}:`, error);
        }

        // If no content from description or comments, use card name as content
        if (!content.trim()) {
          content = card.name;
        }

        const entry: DailyReportEntry = {
          date: dateStr,
          cardId: card.id,
          cardName: card.name,
          content: content,
          userId: user.id,
          userName: user.name,
          boardId,
          boardName,
          listId: card.listId,
          listName,
          projectId,
          projectName,
          createdAt: card.createdAt,
        };

        entries.push(entry);
      }
    } catch (error) {
      console.error(`Error fetching daily reports from project ${projectId}:`, error);
    }
  }

  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  // If summary not requested, return entries only
  if (!options.includeSummary) {
    return entries;
  }

  // Calculate summary with missing dates
  const reportedDates = new Set(entries.map(e => e.date));
  const missingDates: string[] = [];

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      if (!reportedDates.has(dateStr)) {
        missingDates.push(dateStr);
      }
    }
  }

  return {
    entries,
    summary: {
      totalReports: entries.length,
      missingDates,
      reportedDates: Array.from(reportedDates).sort(),
    },
  };
}

/**
 * Check who hasn't written their daily reports within a date range
 * Checks all users by default, or a specific user if userId is provided
 * @param startDate - Start date (ISO format YYYY-MM-DD)
 * @param endDate - End date (ISO format YYYY-MM-DD)
 * @param options - Optional filters
 * @returns Array of objects with userId, userName, date, and missing dates per user
 */
export async function getMissingDailyReports(
  auth: PlankaAuth,
  startDate: string,
  endDate: string,
  options?: {
    userId?: string;         // Check specific user only (undefined = all users)
    projectId?: string;      // Filter to specific project
    includeWeekends?: boolean; // Include weekends in check (default: false)
  }
): Promise<Array<{
  userId: string;
  userName: string;
  boardId?: string;
  missingDates: string[];
}>> {
  const includeWeekends = options?.includeWeekends ?? false;
  
  // Generate list of dates to check
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday
    
    // Skip weekends (Thursday/Friday) if not included
    if (!includeWeekends && (dayOfWeek === 4 || dayOfWeek === 5)) {
      continue;
    }
    
    dates.push(d.toISOString().split('T')[0]);
  }

  const projects = await listProjects(auth);
  const dailyReportProjects = projects.filter((p: any) => 
    isDailyReportProject(p.name) &&
    (!options?.projectId || p.id === options.projectId)
  );

  // Map of userId -> user info with reports by date
  const userReports = new Map<string, {
    userId: string;
    userName: string;
    boardId?: string;
    reportDates: Set<string>;
  }>();

  for (const project of dailyReportProjects) {
    const projectId = (project as any).id;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      for (const board of boards) {
        const boardId = board.id;
        const boardName = board.name;

        // Try to find user associated with this board
        const user = users.find((u: any) => 
          boardName.toLowerCase().includes(u.name.toLowerCase()) ||
          u.name.toLowerCase().includes(boardName.toLowerCase())
        );

        if (!user) continue;
        
        // If userId filter provided, skip others
        if (options?.userId && user.id !== options.userId) {
          continue;
        }

        // Initialize user tracking
        if (!userReports.has(user.id)) {
          userReports.set(user.id, {
            userId: user.id,
            userName: user.name,
            boardId,
            reportDates: new Set(),
          });
        }

        // Get all cards from this board and extract dates
        const boardDetails = await getBoard(auth, boardId);
        const cards = (boardDetails as any)?.included?.cards ?? [];

        for (const card of cards) {
          const cardDate = extractDateFromCard(card.name, card.createdAt);
          
          // Only track dates within our range
          if (cardDate >= startDate && cardDate <= endDate) {
            userReports.get(user.id)!.reportDates.add(cardDate);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking daily reports in project ${projectId}:`, error);
    }
  }

  // Build result with missing dates per user
  const result: Array<{
    userId: string;
    userName: string;
    boardId?: string;
    missingDates: string[];
  }> = [];

  for (const [userId, userData] of userReports.entries()) {
    const missingDates = dates.filter(date => !userData.reportDates.has(date));
    
    // Include user if they have any missing dates
    if (missingDates.length > 0) {
      result.push({
        userId: userData.userId,
        userName: userData.userName,
        boardId: userData.boardId,
        missingDates,
      });
    }
  }

  return result;
}

/**
 * Generate daily report content from user's tasks and activities
 * This combines the user's activity and completed tasks for a specific date
 * Can be used to auto-generate report content based on actual work done
 * @param userId - User ID or "me" for current user, or undefined for current user
 * @param date - ISO date string (YYYY-MM-DD)
 */
export async function generateDailyReportFromTasks(
  auth: PlankaAuth,
  date: string,
  userId?: string
): Promise<string> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Get user activity for the day
  const activity = await getUserActions(auth, resolvedUserId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // Get tasks completed on this day
  const completedTasks = activity.filter((a: any) => 
    a.type === 'updateTask' && 
    a.data?.isCompleted === true
  );

  // Get cards created or updated
  const cardActivities = activity.filter((a: any) => 
    a.type === 'createCard' || 
    a.type === 'updateCard' ||
    a.type === 'createComment'
  );

  // Build report
  let report = `# Daily Report - ${date}\n\n`;

  if (completedTasks.length > 0) {
    report += `## Completed Tasks (${completedTasks.length})\n\n`;
    for (const task of completedTasks) {
      const taskName = task.data?.name || 'Unknown task';
      const cardName = task.cardName || 'Unknown card';
      const projectName = task.projectName || 'Unknown project';
      report += `- ✅ **${taskName}** (Card: ${cardName}, Project: ${projectName})\n`;
    }
    report += '\n';
  }

  if (cardActivities.length > 0) {
    report += `## Card Activities (${cardActivities.length})\n\n`;
    
    // Group by type
    const created = cardActivities.filter((a: any) => a.type === 'createCard');
    const updated = cardActivities.filter((a: any) => a.type === 'updateCard');
    const commented = cardActivities.filter((a: any) => a.type === 'createComment');

    if (created.length > 0) {
      report += `### Created Cards\n`;
      for (const activity of created) {
        report += `- 🆕 **${activity.cardName}** in ${activity.projectName}\n`;
      }
      report += '\n';
    }

    if (updated.length > 0) {
      report += `### Updated Cards\n`;
      for (const activity of updated) {
        report += `- 📝 **${activity.cardName}** - ${activity.description}\n`;
      }
      report += '\n';
    }

    if (commented.length > 0) {
      report += `### Comments\n`;
      for (const activity of commented) {
        report += `- 💬 Commented on **${activity.cardName}**\n`;
      }
      report += '\n';
    }
  }

  if (activity.length === 0) {
    report += `No activity recorded for this date.\n`;
  }

  report += `\n---\n`;
  report += `Total activities: ${activity.length}\n`;

  return report;
}

/**
 * Get today's date in ISO format (local timezone)
 */
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date in ISO format (local timezone)
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Create a daily report card for a user
 * Finds the user's daily report board and creates a card with the provided information
 * 
 * @param userId - User ID or "me" for current user, or undefined for current user
 * @param name - Card name (title of the daily report)
 * @param description - Card description (report content)
 * @param date - ISO date string (YYYY-MM-DD) for the report, defaults to today
 * @returns Created card information
 */
export async function createDailyReportCard(
  auth: PlankaAuth,
  userId: string | undefined,
  name: string,
  description: string,
  date?: string
): Promise<{
  cardId: string;
  cardName: string;
  listName: string;
  boardName: string;
  projectName: string;
}> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const reportDate = date || getTodayDate();
  
  // Get all daily report projects
  const projects = await listProjects(auth);
  const dailyReportProjects = projects.filter((p: any) => isDailyReportProject(p.name));
  
  if (dailyReportProjects.length === 0) {
    throw new Error('No daily report projects found');
  }

  // Search for user's board across all daily report projects
  for (const project of dailyReportProjects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      const users = (projectDetails as any)?.included?.users ?? [];

      // Find user's board (board name should match user's name)
      const user = users.find((u: any) => u.id === resolvedUserId);
      if (!user) continue;

      const userBoard = boards.find((b: any) => 
        b.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(b.name.toLowerCase())
      );

      if (!userBoard) continue;

      const boardId = userBoard.id;
      const boardName = userBoard.name;

      // Get board details to find lists
      const boardDetails = await getBoard(auth, boardId);
      const lists = (boardDetails as any)?.included?.lists ?? [];

      if (lists.length === 0) {
        throw new Error(`No lists found in board "${boardName}"`);
      }

      // Use the first list (or you can add logic to find the appropriate season/list)
      // You can enhance this to match by date -> season mapping if needed
      const targetList = lists[0];
      const listId = targetList.id;
      const listName = targetList.name;

      // Create the card
      const card = await createCard(
        auth,
        listId,
        name,
        description,
        undefined, // position - will be added at default position
        reportDate // dueDate
      );

      return {
        cardId: (card as any).item.id,
        cardName: (card as any).item.name,
        listName,
        boardName,
        projectName,
      };
    } catch (error) {
      console.error(`Error creating daily report in project ${projectId}:`, error);
      continue;
    }
  }

  throw new Error(`Could not find or access daily report board for user ${resolvedUserId}`);
}
