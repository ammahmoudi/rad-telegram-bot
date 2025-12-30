/**
 * Search helpers for finding entities across Planka
 */

import type { PlankaAuth } from '../types/index.js';
import { listProjects, getProject, getBoard } from '../api/index.js';
import { listUsers } from '../api/users.js';
import type { EnrichedCard } from './types.js';
import { getUserCards } from './user-tasks.js';

export interface SearchOptions {
  /** Case-sensitive search */
  caseSensitive?: boolean;
  /** Match whole words only */
  wholeWord?: boolean;
  /** Use regex pattern */
  useRegex?: boolean;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  username: string;
  isAdmin?: boolean;
}

export interface ProjectSearchResult {
  id: string;
  name: string;
  boardCount: number;
  boards: Array<{ id: string; name: string }>;
}

export interface BoardSearchResult {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  listCount: number;
}

export interface CardSearchResult extends EnrichedCard {
  matchedIn: Array<'title' | 'description'>;
}

export interface TaskSearchResult {
  id: string;
  name: string;
  isCompleted: boolean;
  position: number;
  taskListId: string;
  taskListName: string;
  cardId: string;
  cardName: string;
  boardId: string;
  boardName: string;
  projectId: string;
  projectName: string;
  matchedIn: Array<'name'>;
}

export interface GlobalSearchResult {
  users: UserSearchResult[];
  projects: ProjectSearchResult[];
  boards: BoardSearchResult[];
  cards: CardSearchResult[];
  tasks: TaskSearchResult[];
}

/**
 * Search for users by name, email, or username
 */
export async function searchUsers(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<UserSearchResult[]> {
  const users = await listUsers(auth);
  const pattern = options.useRegex 
    ? new RegExp(query, options.caseSensitive ? '' : 'i')
    : null;

  const matchText = (text: string): boolean => {
    if (!text) return false;
    
    if (pattern) {
      return pattern.test(text);
    }
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    
    if (options.wholeWord) {
      const words = searchText.split(/\s+/);
      return words.includes(searchQuery);
    }
    
    return searchText.includes(searchQuery);
  };

  return users
    .filter((user: any) => 
      matchText(user.name) || 
      matchText(user.email) || 
      matchText(user.username)
    )
    .map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    }));
}

/**
 * Search for projects by name
 */
export async function searchProjects(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<ProjectSearchResult[]> {
  const projects = await listProjects(auth);
  const pattern = options.useRegex 
    ? new RegExp(query, options.caseSensitive ? '' : 'i')
    : null;

  const matchText = (text: string): boolean => {
    if (!text) return false;
    
    if (pattern) {
      return pattern.test(text);
    }
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    
    if (options.wholeWord) {
      const words = searchText.split(/\s+/);
      return words.includes(searchQuery);
    }
    
    return searchText.includes(searchQuery);
  };

  const results: ProjectSearchResult[] = [];

  for (const project of projects) {
    const projectData = project as any;
    
    if (matchText(projectData.name)) {
      try {
        const projectDetails = await getProject(auth, projectData.id);
        const boards = (projectDetails as any)?.included?.boards ?? [];
        
        results.push({
          id: projectData.id,
          name: projectData.name,
          boardCount: boards.length,
          boards: boards.map((b: any) => ({
            id: b.id,
            name: b.name,
          })),
        });
      } catch (error) {
        console.error(`Error fetching project ${projectData.id}:`, error);
      }
    }
  }

  return results;
}

/**
 * Search for boards by name
 */
export async function searchBoards(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<BoardSearchResult[]> {
  const projects = await listProjects(auth);
  const pattern = options.useRegex 
    ? new RegExp(query, options.caseSensitive ? '' : 'i')
    : null;

  const matchText = (text: string): boolean => {
    if (!text) return false;
    
    if (pattern) {
      return pattern.test(text);
    }
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    
    if (options.wholeWord) {
      const words = searchText.split(/\s+/);
      return words.includes(searchQuery);
    }
    
    return searchText.includes(searchQuery);
  };

  const results: BoardSearchResult[] = [];

  for (const project of projects) {
    const projectData = project as any;
    
    try {
      const projectDetails = await getProject(auth, projectData.id);
      const boards = (projectDetails as any)?.included?.boards ?? [];
      
      for (const board of boards) {
        if (matchText(board.name)) {
          try {
            const boardDetails = await getBoard(auth, board.id);
            const lists = (boardDetails as any)?.included?.lists ?? [];
            
            results.push({
              id: board.id,
              name: board.name,
              projectId: projectData.id,
              projectName: projectData.name,
              listCount: lists.length,
            });
          } catch (error) {
            console.error(`Error fetching board ${board.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching project ${projectData.id}:`, error);
    }
  }

  return results;
}

/**
 * Search for cards by title or description
 */
export async function searchCards(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<CardSearchResult[]> {
  // Get all cards for current user
  const cards = await getUserCards(auth);
  
  const pattern = options.useRegex 
    ? new RegExp(query, options.caseSensitive ? '' : 'i')
    : null;

  const matchText = (text: string): boolean => {
    if (!text) return false;
    
    if (pattern) {
      return pattern.test(text);
    }
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    
    if (options.wholeWord) {
      const words = searchText.split(/\s+/);
      return words.includes(searchQuery);
    }
    
    return searchText.includes(searchQuery);
  };

  return cards
    .filter(card => matchText(card.name) || matchText(card.description || ''))
    .map(card => {
      const matchedIn: Array<'title' | 'description'> = [];
      if (matchText(card.name)) matchedIn.push('title');
      if (matchText(card.description || '')) matchedIn.push('description');
      
      return {
        ...card,
        matchedIn,
      };
    });
}

/**
 * Search for tasks by name
 */
export async function searchTasks(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<TaskSearchResult[]> {
  // Get all cards with task items for current user
  const cards = await getUserCards(auth, undefined, { includeTasks: true });
  
  // Extract all tasks from cards
  const tasks: TaskSearchResult[] = [];
  for (const card of cards) {
    if (!card.taskItems) continue;
    for (const task of card.taskItems) {
      tasks.push({
        id: task.id,
        name: task.name,
        isCompleted: task.isCompleted,
        position: task.position,
        taskListId: task.taskListId,
        taskListName: task.taskListName,
        cardId: card.id,
        cardName: card.name,
        boardId: card.boardId,
        boardName: card.boardName,
        projectId: card.projectId,
        projectName: card.projectName,
        matchedIn: [],
      });
    }
  }
  
  const pattern = options.useRegex 
    ? new RegExp(query, options.caseSensitive ? '' : 'i')
    : null;

  const matchText = (text: string): boolean => {
    if (!text) return false;
    
    if (pattern) {
      return pattern.test(text);
    }
    
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    const searchText = options.caseSensitive ? text : text.toLowerCase();
    
    if (options.wholeWord) {
      const words = searchText.split(/\s+/);
      return words.includes(searchQuery);
    }
    
    return searchText.includes(searchQuery);
  };

  return tasks
    .filter((task) => matchText(task.name))
    .map((task) => ({
      ...task,
      matchedIn: ['name' as const],
    }));
}

/**
 * Global search across all entities
 */
export async function globalSearch(
  auth: PlankaAuth,
  query: string,
  options: SearchOptions = {}
): Promise<GlobalSearchResult> {
  // Run all searches in parallel
  const [users, projects, boards, cards, tasks] = await Promise.allSettled([
    searchUsers(auth, query, options),
    searchProjects(auth, query, options),
    searchBoards(auth, query, options),
    searchCards(auth, query, options),
    searchTasks(auth, query, options),
  ]);

  return {
    users: users.status === 'fulfilled' ? users.value : [],
    projects: projects.status === 'fulfilled' ? projects.value : [],
    boards: boards.status === 'fulfilled' ? boards.value : [],
    cards: cards.status === 'fulfilled' ? cards.value : [],
    tasks: tasks.status === 'fulfilled' ? tasks.value : [],
  };
}
