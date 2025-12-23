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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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

const tools = [...authTools, ...menuTools];
const resources = [...menuResources];

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rastar MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
