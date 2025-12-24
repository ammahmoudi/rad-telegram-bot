#!/usr/bin/env node

// ==================== EXPORTS FOR LIBRARY USAGE ====================
// Export raw API functions
export * from './api/auth.js';
export * from './api/menu.js';

// Export high-level helper functions (recommended for most use cases)
export * from './api/menu-helpers.js';

// Export types
export * from './types/index.js';
export * from './types/menu-helpers.js';

// Export utilities
export * from './utils/date-helpers.js';

// ==================== MCP SERVER ====================
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
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { authTools, menuTools, handleToolCall } from './tools/index.js';
import { menuResources, handleReadResource } from './resources/index.js';
import { prompts, handleGetPrompt } from './prompts/index.js';

const tools = [...authTools, ...menuTools];
const resources = [...menuResources];

function createServer() {
  const server = new Server(
    { name: 'rastar-mcp-rastar', version: '0.2.0' },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await handleToolCall(request.params.name, request.params.arguments || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      return await handleReadResource(request);
    } catch (error: any) {
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  });

  // Prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    try {
      return handleGetPrompt(request);
    } catch (error: any) {
      throw new Error(`Failed to get prompt: ${error.message}`);
    }
  });

  return server;
}

// Determine transport mode: HTTP (SSE) or stdio
const useHttp = process.env.MCP_TRANSPORT === 'http' || process.env.NODE_ENV === 'production';

if (useHttp) {
  // HTTP/SSE mode for Docker/network access
  const app = express();
  const PORT = process.env.PORT || 3101;

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mcp-rastar', version: '0.2.0' });
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
    console.log(`MCP Rastar Server running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  });
} else {
  // Stdio mode for local development/Claude Desktop
  async function main() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Rastar MCP server running on stdio');
  }

  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
}
