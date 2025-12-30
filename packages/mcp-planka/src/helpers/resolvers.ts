/**
 * Entity Resolvers
 * Functions to resolve entity names/emails to IDs
 */

import type { PlankaAuth } from '../types/index.js';
import { listUsers } from '../api/users.js';
import { listProjects, getProject, getBoard } from '../api/index.js';

/**
 * Resolve user by ID, email, or name
 * @param identifier - User ID, email, or name (or "me" for current user)
 */
export async function resolveUser(
  auth: PlankaAuth,
  identifier: string
): Promise<{ id: string; name: string; email: string }> {
  // If it looks like an ID (no @ and no spaces), try as-is first
  if (!identifier.includes('@') && !identifier.includes(' ')) {
    // Might be an ID, but we'll still check if it exists
    const users = await listUsers(auth);
    const userById = (users as any[]).find((u: any) => u.id === identifier);
    if (userById) {
      return {
        id: userById.id,
        name: userById.name,
        email: userById.email,
      };
    }
  }

  // Try to find by email
  if (identifier.includes('@')) {
    const users = await listUsers(auth);
    const userByEmail = (users as any[]).find(
      (u: any) => u.email.toLowerCase() === identifier.toLowerCase()
    );
    if (userByEmail) {
      return {
        id: userByEmail.id,
        name: userByEmail.name,
        email: userByEmail.email,
      };
    }
    throw new Error(`User not found with email: ${identifier}`);
  }

  // Try to find by name
  const users = await listUsers(auth);
  const userByName = (users as any[]).find(
    (u: any) => u.name.toLowerCase() === identifier.toLowerCase()
  );
  if (userByName) {
    return {
      id: userByName.id,
      name: userByName.name,
      email: userByName.email,
    };
  }

  throw new Error(`User not found: ${identifier}`);
}

/**
 * Resolve project by ID or name
 * @param identifier - Project ID or name
 */
export async function resolveProject(
  auth: PlankaAuth,
  identifier: string
): Promise<{ id: string; name: string }> {
  const projects = await listProjects(auth);

  // Try by ID first
  const projectById = (projects as any[]).find((p: any) => p.id === identifier);
  if (projectById) {
    return { id: projectById.id, name: projectById.name };
  }

  // Try by name (case-insensitive)
  const projectByName = (projects as any[]).find(
    (p: any) => p.name.toLowerCase() === identifier.toLowerCase()
  );
  if (projectByName) {
    return { id: projectByName.id, name: projectByName.name };
  }

  throw new Error(`Project not found: ${identifier}`);
}

/**
 * Resolve board by ID or name (within a project)
 * @param projectIdentifier - Project ID or name
 * @param boardIdentifier - Board ID or name
 */
export async function resolveBoard(
  auth: PlankaAuth,
  projectIdentifier: string,
  boardIdentifier: string
): Promise<{ id: string; name: string; projectId: string; projectName: string }> {
  const project = await resolveProject(auth, projectIdentifier);
  const projectDetails = await getProject(auth, project.id);
  const boards = (projectDetails as any)?.included?.boards ?? [];

  // Try by ID first
  const boardById = boards.find((b: any) => b.id === boardIdentifier);
  if (boardById) {
    return {
      id: boardById.id,
      name: boardById.name,
      projectId: project.id,
      projectName: project.name,
    };
  }

  // Try by name (case-insensitive)
  const boardByName = boards.find(
    (b: any) => b.name.toLowerCase() === boardIdentifier.toLowerCase()
  );
  if (boardByName) {
    return {
      id: boardByName.id,
      name: boardByName.name,
      projectId: project.id,
      projectName: project.name,
    };
  }

  throw new Error(`Board not found: ${boardIdentifier} in project ${project.name}`);
}

/**
 * Resolve list by ID or name (within a board)
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 */
export async function resolveList(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string
): Promise<{ id: string; name: string; boardId: string }> {
  const boardDetails = await getBoard(auth, boardId);
  const lists = (boardDetails as any)?.included?.lists ?? [];

  // Try by ID first
  const listById = lists.find((l: any) => l.id === listIdentifier);
  if (listById) {
    return {
      id: listById.id,
      name: listById.name,
      boardId,
    };
  }

  // Try by name (case-insensitive)
  const listByName = lists.find(
    (l: any) => l.name.toLowerCase() === listIdentifier.toLowerCase()
  );
  if (listByName) {
    return {
      id: listByName.id,
      name: listByName.name,
      boardId,
    };
  }

  throw new Error(`List not found: ${listIdentifier}`);
}

/**
 * Resolve card by ID or name (within a list)
 * @param boardId - Board ID
 * @param listIdentifier - List ID or name
 * @param cardIdentifier - Card ID or name
 */
export async function resolveCard(
  auth: PlankaAuth,
  boardId: string,
  listIdentifier: string,
  cardIdentifier: string
): Promise<{ id: string; name: string; listId: string }> {
  const list = await resolveList(auth, boardId, listIdentifier);
  const boardDetails = await getBoard(auth, boardId);
  const cards = (boardDetails as any)?.included?.cards ?? [];

  // Filter cards in this list
  const listCards = cards.filter((c: any) => c.listId === list.id);

  // Try by ID first
  const cardById = listCards.find((c: any) => c.id === cardIdentifier);
  if (cardById) {
    return {
      id: cardById.id,
      name: cardById.name,
      listId: list.id,
    };
  }

  // Try by name (case-insensitive)
  const cardByName = listCards.find(
    (c: any) => c.name.toLowerCase() === cardIdentifier.toLowerCase()
  );
  if (cardByName) {
    return {
      id: cardByName.id,
      name: cardByName.name,
      listId: list.id,
    };
  }

  throw new Error(`Card not found: ${cardIdentifier} in list ${list.name}`);
}
