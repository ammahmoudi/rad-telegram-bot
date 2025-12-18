#!/usr/bin/env node
import dotenv from 'dotenv';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { getPlankaToken } from '@rastar/shared';

import {
  getBoard,
  getProject,
  listProjects,
  moveCard,
  createBoard,
  updateBoard,
  deleteBoard,
  createList,
  updateList,
  archiveList,
  deleteList,
  createCard,
  updateCard,
  deleteCard,
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  assignLabelToCard,
  removeLabelFromCard,
  getMembers,
  assignMemberToCard,
  removeMemberFromCard,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  createTaskList,
  updateTaskList,
  deleteTaskList,
  createTask,
  updateTask,
  deleteTask,
  getAttachments,
  deleteAttachment,
} from './api/index.js';

import { requireAuth, text } from './tools/helpers.js';
import {
  authTools,
  projectTools,
  boardTools,
  listTools,
  cardTools,
  labelTools,
  memberTools,
  commentTools,
  taskTools,
  attachmentTools,
} from './tools/index.js';

type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

const server = new Server(
  { name: 'rastar-mcp-planka', version: '0.1.0' },
  {
    capabilities: {
      tools: {},
    },
  },
);

const tools = [
  ...authTools,
  ...projectTools,
  ...boardTools,
  ...listTools,
  ...cardTools,
  ...labelTools,
  ...memberTools,
  ...commentTools,
  ...taskTools,
  ...attachmentTools,
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: tools as any };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<ToolResponse> => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'planka.auth.status': {
        const telegramUserId = String((args as any)?.telegramUserId ?? '');
        const rec = await getPlankaToken(telegramUserId);
        return text(JSON.stringify({ linked: !!rec, plankaBaseUrl: rec?.plankaBaseUrl ?? null }, null, 2));
      }

      case 'planka.projects.list': {
        const auth = await requireAuth(args);
        const projects = await listProjects(auth);
        return text(JSON.stringify(projects, null, 2));
      }

      case 'planka.boards.list': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        if (!projectId) throw new Error('projectId is required');
        const proj = await getProject(auth, projectId);
        const boards = (proj as any)?.included?.boards ?? [];
        return text(JSON.stringify(boards, null, 2));
      }

      case 'planka.lists.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');
        const board = await getBoard(auth, boardId);
        const lists = (board as any)?.included?.lists ?? [];
        return text(JSON.stringify(lists, null, 2));
      }

      case 'planka.cards.searchGlobal': {
        const auth = await requireAuth(args);
        const query = String((args as any)?.query ?? '');
        if (!query) throw new Error('query is required');

        // Get all projects
        const projects = await listProjects(auth);
        const allCards: any[] = [];
        const q = query.toLowerCase();

        // Search through all projects and boards
        for (const project of projects) {
          try {
            const boards = (project as any)?.included?.boards ?? [];
            for (const board of boards) {
              try {
                const boardData = await getBoard(auth, board.id);
                const cards = (boardData as any)?.included?.cards ?? [];
                
                // Filter cards matching query
                const matchingCards = cards.filter((c: any) => {
                  const name = String(c?.name ?? '').toLowerCase();
                  const desc = String(c?.description ?? '').toLowerCase();
                  return name.includes(q) || desc.includes(q);
                });

                // Add context to each card
                matchingCards.forEach((card: any) => {
                  allCards.push({
                    ...card,
                    _context: {
                      projectId: project.id,
                      projectName: project.name,
                      boardId: board.id,
                      boardName: board.name,
                    },
                  });
                });
              } catch (boardErr) {
                // Skip boards we can't access
                continue;
              }
            }
          } catch (projErr) {
            // Skip projects we can't access
            continue;
          }
        }

        return text(JSON.stringify(allCards, null, 2));
      }

      case 'planka.cards.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const listId = (args as any)?.listId ? String((args as any).listId) : null;
        if (!boardId) throw new Error('boardId is required');

        const board = await getBoard(auth, boardId);
        let cards: any[] = (board as any)?.included?.cards ?? [];

        // Filter by list if specified
        if (listId) {
          cards = cards.filter((c) => c.listId === listId);
        }

        return text(JSON.stringify(cards, null, 2));
      }

      case 'planka.cards.search': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const query = String((args as any)?.query ?? '');
        if (!boardId) throw new Error('boardId is required');
        if (!query) throw new Error('query is required');

        const board = await getBoard(auth, boardId);
        const cards: any[] = (board as any)?.included?.cards ?? [];

        const q = query.toLowerCase();
        const hits = cards.filter((c) => {
          const name = String(c?.name ?? '').toLowerCase();
          const desc = String(c?.description ?? '').toLowerCase();
          return name.includes(q) || desc.includes(q);
        });

        return text(JSON.stringify(hits, null, 2));
      }

      // ===== Board Operations =====
      case 'planka.boards.create': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position;
        if (!projectId || !name) throw new Error('projectId and name are required');

        const result = await createBoard(auth, projectId, name, position);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.boards.update': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;

        const result = await updateBoard(auth, boardId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.boards.delete': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');

        await deleteBoard(auth, boardId);
        return text('Board deleted successfully');
      }

      // ===== List Operations =====
      case 'planka.lists.create': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position;
        const color = (args as any)?.color;
        if (!boardId || !name) throw new Error('boardId and name are required');

        const result = await createList(auth, boardId, name, position, color);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.lists.update': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        if (!listId) throw new Error('listId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;
        if ((args as any)?.color) updates.color = String((args as any).color);

        const result = await updateList(auth, listId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.lists.archive': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        if (!listId) throw new Error('listId is required');

        const result = await archiveList(auth, listId);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.lists.delete': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        if (!listId) throw new Error('listId is required');

        await deleteList(auth, listId);
        return text('List deleted successfully');
      }

      // ===== Card Operations =====
      case 'planka.cards.create': {
        const auth = await requireAuth(args);
        const listId = String((args as any)?.listId ?? '');
        const name = String((args as any)?.name ?? '');
        const description = (args as any)?.description;
        const position = (args as any)?.position;
        const dueDate = (args as any)?.dueDate;
        if (!listId || !name) throw new Error('listId and name are required');

        const result = await createCard(auth, listId, name, description, position, dueDate);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.update': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if ((args as any)?.description !== undefined) updates.description = String((args as any).description);
        if ((args as any)?.dueDate) updates.dueDate = String((args as any).dueDate);
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;

        const result = await updateCard(auth, cardId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.move': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const listId = String((args as any)?.listId ?? '');
        const position = (args as any)?.position;
        if (!cardId || !listId) throw new Error('cardId and listId are required');

        const result = await moveCard(auth, cardId, listId, typeof position === 'number' ? position : undefined);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.cards.delete': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');

        await deleteCard(auth, cardId);
        return text('Card deleted successfully');
      }

      // ===== Label Operations =====
      case 'planka.labels.list': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');

        const labels = await getLabels(auth, boardId);
        return text(JSON.stringify(labels, null, 2));
      }

      case 'planka.labels.create': {
        const auth = await requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        const name = String((args as any)?.name ?? '');
        const color = String((args as any)?.color ?? '');
        const position = (args as any)?.position;
        if (!boardId || !name || !color) throw new Error('boardId, name, and color are required');

        const result = await createLabel(auth, boardId, name, color, position);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.update': {
        const auth = await requireAuth(args);
        const labelId = String((args as any)?.labelId ?? '');
        if (!labelId) throw new Error('labelId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if ((args as any)?.color) updates.color = String((args as any).color);
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;

        const result = await updateLabel(auth, labelId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.delete': {
        const auth = await requireAuth(args);
        const labelId = String((args as any)?.labelId ?? '');
        if (!labelId) throw new Error('labelId is required');

        await deleteLabel(auth, labelId);
        return text('Label deleted successfully');
      }

      case 'planka.labels.assignToCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const labelId = String((args as any)?.labelId ?? '');
        if (!cardId || !labelId) throw new Error('cardId and labelId are required');

        const result = await assignLabelToCard(auth, cardId, labelId);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.labels.removeFromCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const labelId = String((args as any)?.labelId ?? '');
        if (!cardId || !labelId) throw new Error('cardId and labelId are required');

        await removeLabelFromCard(auth, cardId, labelId);
        return text('Label removed from card successfully');
      }

      // ===== Member Operations =====
      case 'planka.members.list': {
        const auth = await requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        if (!projectId) throw new Error('projectId is required');

        const members = await getMembers(auth, projectId);
        return text(JSON.stringify(members, null, 2));
      }

      case 'planka.members.assignToCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const userId = String((args as any)?.userId ?? '');
        if (!cardId || !userId) throw new Error('cardId and userId are required');

        const result = await assignMemberToCard(auth, cardId, userId);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.members.removeFromCard': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const userId = String((args as any)?.userId ?? '');
        if (!cardId || !userId) throw new Error('cardId and userId are required');

        await removeMemberFromCard(auth, cardId, userId);
        return text('Member removed from card successfully');
      }

      // ===== Comment Operations =====
      case 'planka.comments.list': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');

        const comments = await getComments(auth, cardId);
        return text(JSON.stringify(comments, null, 2));
      }

      case 'planka.comments.create': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const commentText = String((args as any)?.text ?? '');
        if (!cardId || !commentText) throw new Error('cardId and text are required');

        const result = await createComment(auth, cardId, commentText);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.comments.update': {
        const auth = await requireAuth(args);
        const commentId = String((args as any)?.commentId ?? '');
        const commentText = String((args as any)?.text ?? '');
        if (!commentId || !commentText) throw new Error('commentId and text are required');

        const result = await updateComment(auth, commentId, commentText);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.comments.delete': {
        const auth = await requireAuth(args);
        const commentId = String((args as any)?.commentId ?? '');
        if (!commentId) throw new Error('commentId is required');

        await deleteComment(auth, commentId);
        return text('Comment deleted successfully');
      }

      // ===== Task List Operations =====
      case 'planka.taskLists.create': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position;
        if (!cardId || !name) throw new Error('cardId and name are required');

        const result = await createTaskList(auth, cardId, name, position);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.taskLists.update': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        if (!taskListId) throw new Error('taskListId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;

        const result = await updateTaskList(auth, taskListId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.taskLists.delete': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        if (!taskListId) throw new Error('taskListId is required');

        await deleteTaskList(auth, taskListId);
        return text('Task list deleted successfully');
      }

      // ===== Task Operations =====
      case 'planka.tasks.create': {
        const auth = await requireAuth(args);
        const taskListId = String((args as any)?.taskListId ?? '');
        const name = String((args as any)?.name ?? '');
        const position = (args as any)?.position;
        if (!taskListId || !name) throw new Error('taskListId and name are required');

        const result = await createTask(auth, taskListId, name, position);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.tasks.update': {
        const auth = await requireAuth(args);
        const taskId = String((args as any)?.taskId ?? '');
        if (!taskId) throw new Error('taskId is required');

        const updates: any = {};
        if ((args as any)?.name) updates.name = String((args as any).name);
        if (typeof (args as any)?.isCompleted === 'boolean') updates.isCompleted = (args as any).isCompleted;
        if (typeof (args as any)?.position === 'number') updates.position = (args as any).position;

        const result = await updateTask(auth, taskId, updates);
        return text(JSON.stringify(result, null, 2));
      }

      case 'planka.tasks.delete': {
        const auth = await requireAuth(args);
        const taskId = String((args as any)?.taskId ?? '');
        if (!taskId) throw new Error('taskId is required');

        await deleteTask(auth, taskId);
        return text('Task deleted successfully');
      }

      // ===== Attachment Operations =====
      case 'planka.attachments.list': {
        const auth = await requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        if (!cardId) throw new Error('cardId is required');

        const attachments = await getAttachments(auth, cardId);
        return text(JSON.stringify(attachments, null, 2));
      }

      case 'planka.attachments.delete': {
        const auth = await requireAuth(args);
        const attachmentId = String((args as any)?.attachmentId ?? '');
        if (!attachmentId) throw new Error('attachmentId is required');

        await deleteAttachment(auth, attachmentId);
        return text('Attachment deleted successfully');
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return text(`Error: ${msg}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
