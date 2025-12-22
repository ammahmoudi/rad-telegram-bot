import { plankaFetch } from './client.js';
import type { PlankaAuth, BoardTemplateId, CardTypeId, ListId } from '../types/index.js';

/**
 * Board Templates API
 * Manage board templates with card types and lists
 */

export interface BoardTemplate {
  id: BoardTemplateId;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardTemplateData {
  name: string;
  description?: string;
}

export interface UpdateBoardTemplateData {
  name?: string;
  description?: string;
}

export interface CardType {
  id: CardTypeId;
  boardTemplateId: BoardTemplateId;
  name: string;
  color?: string;
  position: number;
}

export interface TemplateList {
  id: ListId;
  boardTemplateId: BoardTemplateId;
  name: string;
  position: number;
}

/**
 * Create board template
 * @param auth - Planka authentication
 * @param data - Template data
 */
export async function createBoardTemplate(
  auth: PlankaAuth,
  data: CreateBoardTemplateData,
): Promise<BoardTemplate> {
  return plankaFetch<BoardTemplate>(auth, '/api/board-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get all board templates
 * @param auth - Planka authentication
 */
export async function listBoardTemplates(auth: PlankaAuth): Promise<BoardTemplate[]> {
  return plankaFetch<BoardTemplate[]>(auth, '/api/board-templates', {
    method: 'GET',
  });
}

/**
 * Get board template
 * @param auth - Planka authentication
 * @param id - Template ID
 */
export async function getBoardTemplate(
  auth: PlankaAuth,
  id: BoardTemplateId,
): Promise<BoardTemplate> {
  return plankaFetch<BoardTemplate>(auth, `/api/board-templates/${id}`, {
    method: 'GET',
  });
}

/**
 * Update board template
 * @param auth - Planka authentication
 * @param id - Template ID
 * @param data - Update data
 */
export async function updateBoardTemplate(
  auth: PlankaAuth,
  id: BoardTemplateId,
  data: UpdateBoardTemplateData,
): Promise<BoardTemplate> {
  return plankaFetch<BoardTemplate>(auth, `/api/board-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete board template
 * @param auth - Planka authentication
 * @param id - Template ID
 */
export async function deleteBoardTemplate(
  auth: PlankaAuth,
  id: BoardTemplateId,
): Promise<BoardTemplate> {
  return plankaFetch<BoardTemplate>(auth, `/api/board-templates/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Add card type to board template
 * @param auth - Planka authentication
 * @param templateId - Template ID
 * @param data - Card type data
 */
export async function addCardTypeToTemplate(
  auth: PlankaAuth,
  templateId: BoardTemplateId,
  data: { name: string; color?: string; position?: number },
): Promise<CardType> {
  return plankaFetch<CardType>(auth, `/api/board-templates/${templateId}/card-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete template card type
 * @param auth - Planka authentication
 * @param templateId - Template ID
 * @param typeId - Card type ID
 */
export async function deleteTemplateCardType(
  auth: PlankaAuth,
  templateId: BoardTemplateId,
  typeId: CardTypeId,
): Promise<CardType> {
  return plankaFetch<CardType>(auth, `/api/board-templates/${templateId}/card-types/${typeId}`, {
    method: 'DELETE',
  });
}

/**
 * Add list to board template
 * @param auth - Planka authentication
 * @param templateId - Template ID
 * @param data - List data
 */
export async function addListToTemplate(
  auth: PlankaAuth,
  templateId: BoardTemplateId,
  data: { name: string; position?: number },
): Promise<TemplateList> {
  return plankaFetch<TemplateList>(auth, `/api/board-templates/${templateId}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Update template list
 * @param auth - Planka authentication
 * @param templateId - Template ID
 * @param listId - List ID
 * @param data - Update data
 */
export async function updateTemplateList(
  auth: PlankaAuth,
  templateId: BoardTemplateId,
  listId: ListId,
  data: { name?: string; position?: number },
): Promise<TemplateList> {
  return plankaFetch<TemplateList>(auth, `/api/board-templates/${templateId}/lists/${listId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Delete template list
 * @param auth - Planka authentication
 * @param templateId - Template ID
 * @param listId - List ID
 */
export async function deleteTemplateList(
  auth: PlankaAuth,
  templateId: BoardTemplateId,
  listId: ListId,
): Promise<TemplateList> {
  return plankaFetch<TemplateList>(auth, `/api/board-templates/${templateId}/lists/${listId}`, {
    method: 'DELETE',
  });
}
