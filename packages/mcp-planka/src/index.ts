#!/usr/bin/env node
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

function createServer() {
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

  return server;
}

// Determine transport mode: HTTP (SSE) or stdio
const useHttp = process.env.MCP_TRANSPORT === 'http' || process.env.NODE_ENV === 'production';

if (useHttp) {
  // HTTP/SSE mode for Docker/network access
  const app = express();
  const PORT = process.env.PORT || 3100;

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mcp-planka', version: '0.1.0' });
  });

  // MCP SSE endpoint (GET for client connection)
  app.get('/sse', async (req, res) => {
    const server = createServer();
    const transport = new SSEServerTransport('/message', res);
    await server.connect(transport);
  });

  // MCP SSE endpoint (POST for compatibility)
  app.post('/sse', async (req, res) => {
    const server = createServer();
    const transport = new SSEServerTransport('/message', res);
    await server.connect(transport);
  });

  // Message handling endpoint
  app.post('/message', async (req, res) => {
    // Handle incoming MCP messages
    res.json({ received: true });
  });

  app.listen(PORT, () => {
    console.log(`MCP Planka Server running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  });
} else {
  // Stdio mode for local development/Claude Desktop
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
