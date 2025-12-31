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
import { listProjects, getProject, getBoard, getCurrentUser, getCard, getUser } from '../api/index.js';
import { getComments } from '../api/comments.js';
import { createCard } from '../api/cards.js';
import type { DailyReportEntry } from './types.js';
import { getUserActions } from './user-activity.js';
import { parseDate, now, fromUTC, type DualDate } from '../utils/date-time.js';
import { getSystemConfig } from '@rad/shared';

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
 * Filters by project category if PLANKA_DAILY_REPORT_CATEGORY_ID is set in system config,
 * otherwise falls back to filtering by name (projects starting with \"Daily report\")
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
  
  // Try to get daily report category ID from system config
  const categoryId = await getSystemConfig('PLANKA_DAILY_REPORT_CATEGORY_ID').catch(() => null);
  
  // Filter projects by category if configured, otherwise by name
  const dailyReportProjects = categoryId
    ? projects.filter((p: any) => p.categoryId === categoryId)
    : projects.filter((p: any) => isDailyReportProject(p.name));
  
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

  // Try MM/DD/YYYY (US format)
  const usDateMatch = cardName.match(/(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
  if (usDateMatch) {
    const month = usDateMatch[1].padStart(2, '0');
    const day = usDateMatch[2].padStart(2, '0');
    const year = usDateMatch[3];
    // If month > 12, it's likely day/month not month/day
    if (parseInt(month) <= 12 && parseInt(day) <= 31) {
      return `${year}-${month}-${day}`;
    } else if (parseInt(day) <= 12 && parseInt(month) <= 31) {
      // Swap if needed
      return `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
    }
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

      // Find user
      const user = users.find((u: any) => u.id === resolvedUserId);
      if (!user) {
        console.log(`User ${resolvedUserId} not found in project ${projectName}`);
        continue;
      }

      // Find user's board - try multiple matching strategies
      let userBoard = boards.find((b: any) => 
        b.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.name.toLowerCase().includes(b.name.toLowerCase())
      );

      // If not found, try exact username match
      if (!userBoard) {
        userBoard = boards.find((b: any) => 
          b.name.toLowerCase().trim() === user.name.toLowerCase().trim()
        );
      }

      // If still not found, try username as part of board name
      if (!userBoard) {
        const username = user.username?.toLowerCase() || user.name.toLowerCase();
        userBoard = boards.find((b: any) => 
          b.name.toLowerCase().includes(username) ||
          username.includes(b.name.toLowerCase())
        );
      }

      if (!userBoard) {
        console.log(`Board not found for user ${user.name} in project ${projectName}. Available boards:`, 
          boards.map((b: any) => b.name).join(', '));
        continue;
      }

      const boardId = userBoard.id;
      const boardName = userBoard.name;

      // Get board details
      const boardDetails = await getBoard(auth, boardId);
      const lists = (boardDetails as any)?.included?.lists ?? [];
      const cards = (boardDetails as any)?.included?.cards ?? [];

      console.log(`Found ${cards.length} cards in board ${boardName} (project: ${projectName})`);

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
  userId?: string,
  options?: { includeDetails?: boolean }
): Promise<string> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Get comprehensive user activity for the day with increased limits
  const activity = await getUserActions(auth, resolvedUserId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 200, // Increased limit to capture all day's activity
  });

  const includeDetails = options?.includeDetails !== false;

  // Organize activities by type
  const completedTasks = activity.filter((a: any) => 
    a.type === 'updateTask' && 
    a.data?.isCompleted === true
  );

  const createdCards = activity.filter((a: any) => a.type === 'createCard');
  const updatedCards = activity.filter((a: any) => a.type === 'updateCard');
  const movedCards = activity.filter((a: any) => a.type === 'moveCard');
  const comments = activity.filter((a: any) => a.type === 'createComment');

  // Build structured report with better date formatting
  let report = `# Daily Report - ${new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n\n`;

  // Summary section
  report += `## Summary\n\n`;
  report += `- **Total Activities:** ${activity.length}\n`;
  report += `- **Tasks Completed:** ${completedTasks.length}\n`;
  report += `- **Cards Created:** ${createdCards.length}\n`;
  report += `- **Cards Updated:** ${updatedCards.length}\n`;
  report += `- **Cards Moved:** ${movedCards.length}\n`;
  report += `- **Comments Added:** ${comments.length}\n\n`;

  // Completed Tasks with better organization
  if (completedTasks.length > 0) {
    report += `## ✅ Completed Tasks (${completedTasks.length})\n\n`;
    
    // Group by card for better organization
    const tasksByCard = new Map<string, any[]>();
    for (const task of completedTasks) {
      const cardKey = task.cardName || 'Unknown';
      if (!tasksByCard.has(cardKey)) {
        tasksByCard.set(cardKey, []);
      }
      tasksByCard.get(cardKey)!.push(task);
    }

    for (const [cardName, tasks] of tasksByCard) {
      const projectName = tasks[0]?.projectName || 'Unknown Project';
      const boardName = tasks[0]?.boardName || '';
      
      report += `### ${cardName}`;
      if (boardName) report += ` (${boardName})`;
      report += `\n`;
      if (projectName) report += `*Project: ${projectName}*\n\n`;
      
      for (const task of tasks) {
        const taskName = task.data?.name || 'Unnamed task';
        report += `- ✅ ${taskName}\n`;
      }
      report += '\n';
    }
  }

  // Created Cards with project/board/list context
  if (createdCards.length > 0) {
    report += `## 🆕 Created Cards (${createdCards.length})\n\n`;
    for (const activity of createdCards) {
      const projectName = activity.projectName || 'Unknown Project';
      const boardName = activity.boardName || '';
      const listName = (activity as any).listName || '';
      
      report += `- **${activity.cardName}**\n`;
      report += `  - Project: ${projectName}`;
      if (boardName) report += ` > ${boardName}`;
      if (listName) report += ` > ${listName}`;
      report += `\n`;
      
      if (includeDetails && activity.description) {
        report += `  - ${activity.description}\n`;
      }
      report += `\n`;
    }
  }

  // Updated Cards (deduplicated)
  if (updatedCards.length > 0) {
    report += `## 📝 Updated Cards (${updatedCards.length})\n\n`;
    
    // Group by card to avoid duplicates
    const cardUpdates = new Map<string, any>();
    for (const activity of updatedCards) {
      const cardKey = activity.cardId || activity.cardName || 'unknown';
      if (!cardUpdates.has(cardKey)) {
        cardUpdates.set(cardKey, activity);
      }
    }

    for (const activity of cardUpdates.values()) {
      report += `- **${activity.cardName}**`;
      if (activity.projectName) report += ` (${activity.projectName})`;
      report += `\n`;
      
      if (includeDetails && activity.description) {
        report += `  - ${activity.description}\n`;
      }
    }
    report += '\n';
  }

  // Moved Cards
  if (movedCards.length > 0) {
    report += `## 🔄 Moved Cards (${movedCards.length})\n\n`;
    for (const activity of movedCards) {
      report += `- **${activity.cardName}**`;
      if (activity.description) report += ` - ${activity.description}`;
      report += `\n`;
    }
    report += '\n';
  }

  // Comments grouped by card
  if (comments.length > 0) {
    report += `## 💬 Comments & Discussions (${comments.length})\n\n`;
    
    // Group by card
    const commentsByCard = new Map<string, any[]>();
    for (const comment of comments) {
      const cardKey = comment.cardName || 'Unknown';
      if (!commentsByCard.has(cardKey)) {
        commentsByCard.set(cardKey, []);
      }
      commentsByCard.get(cardKey)!.push(comment);
    }

    for (const [cardName, cardComments] of commentsByCard) {
      const projectName = cardComments[0]?.projectName;
      report += `### ${cardName}`;
      if (projectName) report += ` (${projectName})`;
      report += ` - ${cardComments.length} comment(s)\n`;
      
      if (includeDetails) {
        for (const comment of cardComments) {
          if (comment.data?.text) {
            const commentText = comment.data.text.length > 100 
              ? comment.data.text.substring(0, 100) + '...' 
              : comment.data.text;
            report += `  - "${commentText}"\n`;
          }
        }
      }
      report += '\n';
    }
  }

  // No activity case
  if (activity.length === 0) {
    report += `## No Activity\n\nNo activity recorded for this date.\n`;
  }

  report += `\n---\n`;
  report += `*Generated on ${new Date().toLocaleString('en-US')}*\n`;

  return report;
}

/**
 * Get today's date in dual calendar format
 */
export function getTodayDate(): DualDate {
  return now();
}

/**
 * Get yesterday's date in dual calendar format
 */
export function getYesterdayDate(): DualDate {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return fromUTC(yesterday);
}

/**
 * Create a daily report card for a user
 * Finds the user's daily report board and creates a card with the provided information
 * 
 * @param userId - User ID or "me" for current user, or undefined for current user
 * @param name - Card name (title of the daily report)
 * @param description - Card description (report content)
 * @param date - Date string in various formats: "today", "2025-12-30", "1404/10/10", etc.
 * @param boardName - Optional board name to search for (helps AI specify which board)
 * @returns Created card information with dual calendar dates
 */
export async function createDailyReportCard(
  auth: PlankaAuth,
  userId: string | undefined,
  name: string,
  description: string,
  date?: string,
  boardName?: string
): Promise<{
  cardId: string;
  cardName: string;
  listName: string;
  boardName: string;
  projectName: string;
  date: DualDate;
}> {
  const resolvedUserId = await resolveUserId(auth, userId);
  const reportDate = date ? parseDate(date) : getTodayDate();
  
  // Enrich card name and description with dual calendar dates
  const enrichedName = `${name} (${reportDate.gregorian.date} / ${reportDate.persian.date})`;
  const enrichedDescription = `**تاریخ / Date:**
📅 ${reportDate.gregorian.formatted}
📅 ${reportDate.persian.formatted}

---
${description}`;
  
  // Get all daily report projects
  const projects = await listProjects(auth);
  const dailyReportProjects = projects.filter((p: any) => isDailyReportProject(p.name));
  
  if (dailyReportProjects.length === 0) {
    throw new Error('No daily report projects found');
  }

  // Get current user info
  const currentUserId = resolvedUserId;
  const currentUser = await getUser(auth, currentUserId);
  const userName = currentUser.name || '';
  
  // Helper function to normalize names for matching (handles Persian/English, spaces, case)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/[-_]/g, ''); // Remove dashes and underscores
  };
  
  // Helper function to check if board matches search criteria
  const matchesBoard = (board: any, searchName: string): boolean => {
    const boardNameStr = board.name.trim();
    const boardNameLower = boardNameStr.toLowerCase();
    const normalizedBoardName = normalizeName(boardNameStr);
    const normalizedSearchName = normalizeName(searchName);
    const searchNameLower = searchName.toLowerCase();
    
    // 1. Exact match (case-insensitive)
    if (boardNameLower === searchNameLower) return true;
    
    // 2. Normalized match (no spaces, no case)
    if (normalizedBoardName === normalizedSearchName) return true;
    
    // 3. Board name contains search name or vice versa
    if (boardNameLower.includes(searchNameLower) || 
        searchNameLower.includes(boardNameLower)) return true;
    
    // 4. Check if all search name parts are in board name
    const searchParts = searchName.toLowerCase().trim().split(/\s+/);
    if (searchParts.length > 1) {
      const allPartsInBoard = searchParts.every(part => 
        part.length > 2 && boardNameLower.includes(part)
      );
      if (allPartsInBoard) return true;
    }
    
    // 5. Check if board name parts are in search name
    const boardParts = boardNameStr.toLowerCase().trim().split(/\s+/);
    if (boardParts.length > 1) {
      const allPartsInSearch = boardParts.every((part: string) => 
        part.length > 2 && searchNameLower.includes(part)
      );
      if (allPartsInSearch) return true;
    }
    
    return false;
  };
  
  // Helper function to check if user is a member of board
  const isUserMemberOfBoard = async (boardId: string): Promise<boolean> => {
    try {
      const boardDetails = await getBoard(auth, boardId);
      const boardMemberships = (boardDetails as any)?.included?.boardMemberships ?? [];
      return boardMemberships.some((m: any) => m.userId === currentUserId);
    } catch (error) {
      return false;
    }
  };
  
  // Search for user's board across all daily report projects
  for (const project of dailyReportProjects) {
    const projectId = (project as any).id;
    const projectName = (project as any).name;

    try {
      const projectDetails = await getProject(auth, projectId);
      const boards = (projectDetails as any)?.included?.boards ?? [];

      let userBoard;
      let foundBoardName = '';
      
      if (boardName) {
        // AI provided a board name - search for it
        userBoard = boards.find((b: any) => matchesBoard(b, boardName));
      } else if (userName) {
        // Try to match by user name first
        userBoard = boards.find((b: any) => matchesBoard(b, userName));
      }
      
      // If no match by name, check board memberships
      if (!userBoard) {
        for (const board of boards) {
          if (await isUserMemberOfBoard(board.id)) {
            userBoard = board;
            break;
          }
        }
      }

      if (!userBoard) continue;

      const boardId = userBoard.id;
      foundBoardName = userBoard.name;

      // Get board details to find lists
      const boardDetails = await getBoard(auth, boardId);
      const lists = (boardDetails as any)?.included?.lists ?? [];

      if (lists.length === 0) {
        throw new Error(`No lists found in board "${foundBoardName}"`);
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
        enrichedName,
        enrichedDescription,
        undefined, // position - will be added at default position
        reportDate.iso // dueDate in UTC ISO format
      );

      return {
        cardId: (card as any).item.id,
        cardName: (card as any).item.name,
        listName,
        boardName: foundBoardName,
        projectName,
        date: reportDate,
      };
    } catch (error) {
      console.error(`Error creating daily report in project ${projectId}:`, error);
      continue;
    }
  }

  throw new Error(`Could not find or access daily report board for user ${resolvedUserId}`);
}
