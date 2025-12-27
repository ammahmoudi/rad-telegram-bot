#!/usr/bin/env node
import dotenv from 'dotenv';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });
dotenv.config({ path: path.join(repoRoot, '.env') });

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
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

const allTools = [
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
];

/**
 * Create and configure the MCP server
 * Using production-ready patterns from official MCP TypeScript SDK v1.x
 */
function createServer() {
  const server = new McpServer(
    { name: 'rastar-mcp-planka', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    },
  );

  // Register all tools using v1.x API
  // Pass an empty object as inputSchema to indicate "accepts any arguments"
  // This allows arguments to pass through without validation
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: {}, // Empty object schema - accepts any arguments
      },
      async (args: any) => {
        try {
          const result = await handleToolCall({ 
            params: { 
              name: tool.name as any, 
              arguments: args 
            } 
          } as any);
          return result;
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // Register all prompts
  for (const prompt of prompts) {
    server.registerPrompt(
      prompt.name,
      {
        description: prompt.description,
        argsSchema: prompt.arguments as any,
      },
      (async (args: any, _extra: any) => {
        const result = await handleGetPrompt({ 
          params: { 
            name: prompt.name as any, 
            arguments: args 
          } 
        } as any);
        return result as any;
      }) as any
    );
  }

  // Register all resources
  for (const resource of resources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: resource.mimeType,
      },
      async () => {
        const result = await handleReadResource({ 
          params: { 
            uri: resource.uri 
          } 
        } as any);
        return result;
      }
    );
  }

  return server;
}

/**
 * Main entry point - supports both stdio (local dev) and HTTP (production) modes
 */
async function main() {
  const transport = process.env.MCP_TRANSPORT || 'http';

  if (transport === 'stdio') {
    // Stdio mode for local development
    console.error('[MCP Planka] Starting in stdio mode (local development)');
    
    const server = createServer();
    const stdioTransport = new StdioServerTransport();
    
    await server.connect(stdioTransport);
    console.error('[MCP Planka] Connected via stdio, ready to handle requests');
  } else {
    // HTTP mode for Docker/production
    console.error('[MCP Planka] Starting Streamable HTTP server...');
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;

    // Create Express app with DNS rebinding protection
    // Allow connections from telegram-bot container via Docker service names
    const app = createMcpExpressApp({ 
      host: '0.0.0.0',
      allowedHosts: ['mcp-planka', 'localhost', '127.0.0.1'] 
    });

  console.error('[MCP Planka] Starting Streamable HTTP server...');

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mcp-planka', version: '0.1.0' });
  });

  // Streamable HTTP endpoint (POST) - Stateless mode
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // Create a new server and transport for each request (stateless)
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        // Stateless mode - no session tracking
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP Planka] Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.error(`[MCP Planka] Streamable HTTP server running on port ${PORT}`);
    console.error(`[MCP Planka] Health: http://localhost:${PORT}/health`);
    console.error(`[MCP Planka] MCP endpoint: http://localhost:${PORT}/mcp`);
    console.error('[MCP Planka] Ready to handle requests');
  });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[MCP Planka] Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[MCP Planka] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('[MCP Planka] Fatal error:', error);
  process.exit(1);
});
