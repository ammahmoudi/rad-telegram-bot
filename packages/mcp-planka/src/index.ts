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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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
  userTools,
  handleToolCall,
} from './tools/index.js';
import { prompts, handleGetPrompt } from './prompts/index.js';
import { resources, handleReadResource } from './resources/index.js';

const server = new Server(
  { name: 'rastar-mcp-planka', version: '0.1.0' },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
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
  ...userTools,
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: tools as any };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: prompts as any };
});

server.setRequestHandler(GetPromptRequestSchema, handleGetPrompt);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: resources as any };
});

server.setRequestHandler(ReadResourceRequestSchema, handleReadResource);

server.setRequestHandler(CallToolRequestSchema, handleToolCall);

const transport = new StdioServerTransport();
await server.connect(transport);
