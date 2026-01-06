/**
 * Types for helper functions
 */

// Re-export DualDate from date-time utils
export type { DualDate } from '../utils/date-time.js';

export type FilterOptions = {
  done?: boolean; // true = completed tasks only, false = incomplete only, undefined = all
  dueDate?: {
    before?: string; // ISO date string
    after?: string;  // ISO date string
    on?: string;     // ISO date string
  };
  assignedTo?: string[]; // Array of user IDs
  projectId?: string;
  boardId?: string;
  listId?: string;
  hasLabels?: string[]; // Array of label IDs
  search?: string; // Search in title/description
  // Extended data options
  includeTasks?: boolean; // Include full task items (default: false, only summary)
  includeHistory?: boolean; // Include card action history (default: false)
};

export type SortOptions = {
  by: 'createdAt' | 'updatedAt' | 'dueDate' | 'name' | 'position';
  order: 'asc' | 'desc';
};

export type EnrichedCard = {
  id: string;
  name: string;
  description?: string;
  position: number;
  listId: string;
  boardId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  // Enriched data
  projectName: string;
  projectId: string;
  boardName: string;
  listName: string;
  assignees: { id: string; name: string; email: string }[];
  labels: { id: string; name: string; color: string }[];
  tasks: {
    total: number;
    completed: number;
    percentage: number;
  };
  isDone: boolean; // Based on tasks completion or list type
  // Optional extended data (when requested)
  taskItems?: Array<{
    id: string;
    name: string;
    isCompleted: boolean;
    position: number;
    taskListId: string;
    taskListName: string;
  }>;
  history?: Array<{
    id: string;
    type: string;
    data: any;
    userId: string;
    createdAt: string;
  }>;
};

export type EnrichedTask = {
  id: string;
  name: string;
  isCompleted: boolean;
  position: number;
  taskListId: string;
  taskListName: string;
  createdAt: string;
  updatedAt?: string;
  // Card context
  cardId: string;
  cardName: string;
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
};

export type ActivityItem = {
  id: string;
  type: string;
  timestamp: string;
  userId: string;
  userName: string;
  // Card context if applicable
  cardId?: string;
  cardName?: string;
  boardId?: string;
  boardName?: string;
  projectId?: string;
  projectName?: string;
  // Action details
  data: any;
  description: string; // Human-readable description
};

export type NotificationItem = {
  id: string;
  userId: string;
  cardId?: string;
  cardName?: string;
  boardId?: string;
  boardName?: string;
  projectId?: string;
  projectName?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string | null;
  // Related action
  action?: ActivityItem;
};

export type ProjectStatus = {
  projectId: string;
  projectName: string;
  boards: {
    boardId: string;
    boardName: string;
    totalCards: number;
    doneCards: number;
    inProgressCards: number;
    overdueCards: number;
    completionPercentage: number;
    lists: {
      listId: string;
      listName: string;
      cardCount: number;
      doneCardCount: number;
    }[];
  }[];
  totalCards: number;
  doneCards: number;
  completionPercentage: number;
  lastActivity?: string;
};

export type BoardStatus = {
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
  lists: {
    listId: string;
    listName: string;
    cardCount: number;
    doneCardCount: number;
  }[];
  totalCards: number;
  doneCards: number;
  completionPercentage: number;
  lastActivity?: string;
};

export type DailyReportEntry = {
  date: string; // ISO date string
  cardId: string;
  cardName: string;
  content: string; // Card description
  userId: string;
  userName: string;
  boardId: string;
  boardName: string; // Person's name
  listId: string;
  listName: string; // Season name
  projectId: string;
  projectName: string;
  createdAt: string;
};

export type DailyReportSummary = {
  userId: string;
  userName: string;
  period: {
    start: string;
    end: string;
  };
  entries: DailyReportEntry[];
  missingDates: string[]; // Dates without reports
  totalReports: number;
};


export type SearchOptions = {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
};
