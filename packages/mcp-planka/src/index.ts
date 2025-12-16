#!/usr/bin/env node
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { getPlankaToken } from '@rastar/shared';

import { getBoard, getProject, listProjects, moveCard } from './planka.js';

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
  {
    name: 'planka.auth.status',
    description: 'Check whether a Telegram user has linked Planka',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId'],
      properties: {
        telegramUserId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.projects.list',
    description: 'List projects available to the user',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId'],
      properties: {
        telegramUserId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.boards.list',
    description: 'List boards in a project',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'projectId'],
      properties: {
        telegramUserId: { type: 'string' },
        projectId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.lists.list',
    description: 'List lists (columns) in a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.cards.search',
    description: 'Search cards by substring match in name/description within a board',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'boardId', 'query'],
      properties: {
        telegramUserId: { type: 'string' },
        boardId: { type: 'string' },
        query: { type: 'string' },
      },
    },
  },
  {
    name: 'planka.cards.move',
    description: 'Move a card to another list (optionally set position)',
    inputSchema: {
      type: 'object',
      required: ['telegramUserId', 'cardId', 'listId'],
      properties: {
        telegramUserId: { type: 'string' },
        cardId: { type: 'string' },
        listId: { type: 'string' },
        position: { type: 'number' },
      },
    },
  },
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
        const rec = getPlankaToken(telegramUserId);
        return text(JSON.stringify({ linked: !!rec, plankaBaseUrl: rec?.plankaBaseUrl ?? null }, null, 2));
      }

      case 'planka.projects.list': {
        const auth = requireAuth(args);
        const projects = await listProjects(auth);
        return text(JSON.stringify(projects, null, 2));
      }

      case 'planka.boards.list': {
        const auth = requireAuth(args);
        const projectId = String((args as any)?.projectId ?? '');
        if (!projectId) throw new Error('projectId is required');
        const proj = await getProject(auth, projectId);
        const boards = (proj as any)?.included?.boards ?? [];
        return text(JSON.stringify(boards, null, 2));
      }

      case 'planka.lists.list': {
        const auth = requireAuth(args);
        const boardId = String((args as any)?.boardId ?? '');
        if (!boardId) throw new Error('boardId is required');
        const board = await getBoard(auth, boardId);
        const lists = (board as any)?.included?.lists ?? [];
        return text(JSON.stringify(lists, null, 2));
      }

      case 'planka.cards.search': {
        const auth = requireAuth(args);
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

      case 'planka.cards.move': {
        const auth = requireAuth(args);
        const cardId = String((args as any)?.cardId ?? '');
        const listId = String((args as any)?.listId ?? '');
        const position = (args as any)?.position;
        if (!cardId || !listId) throw new Error('cardId and listId are required');

        const result = await moveCard(auth, cardId, listId, typeof position === 'number' ? position : undefined);
        return text(JSON.stringify(result, null, 2));
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

function requireAuth(args: unknown): { plankaBaseUrl: string; accessToken: string } {
  const telegramUserId = String((args as any)?.telegramUserId ?? '');
  if (!telegramUserId) {
    throw new Error('telegramUserId is required');
  }

  const rec = getPlankaToken(telegramUserId);
  if (!rec) {
    throw new Error('Planka not linked for this user. Run /link_planka in Telegram.');
  }

  return { plankaBaseUrl: rec.plankaBaseUrl, accessToken: rec.accessToken };
}

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}
