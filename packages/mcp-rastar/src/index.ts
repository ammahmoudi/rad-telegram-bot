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
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env files only in development (Dokploy injects env vars directly in production)
if (process.env.NODE_ENV !== 'production') {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  dotenv.config({ path: path.join(repoRoot, '.env.local') });
  dotenv.config({ path: path.join(repoRoot, '.env') });
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { z } from 'zod';

import { authTools, menuTools, handleToolCall } from './tools/index.js';
import { menuResources, handleReadResource } from './resources/index.js';
import { prompts, handleGetPrompt } from './prompts/index.js';

const allTools = [...authTools, ...menuTools];
const allResources = [...menuResources];

/**
 * Create Zod schemas from JSON Schema tool definitions
 * This allows the SDK to validate and convert to proper JSON Schema for AI
 */
function createZodSchemaFromTool(tool: any) {
  // For tools with accessToken + userId parameters
  if (tool.inputSchema?.properties?.accessToken && tool.inputSchema?.properties?.userId) {
    return z.object({
      accessToken: z.string(),
      userId: z.string(),
    }).passthrough(); // Allow other properties too
  }
  
  // For tools with just refreshToken
  if (tool.inputSchema?.properties?.refreshToken) {
    return z.object({
      refreshToken: z.string(),
    });
  }
  
  // Default: accept anything
  return z.object({}).passthrough();
}

/**
 * Create and configure the MCP server
 * Using production-ready patterns from official MCP TypeScript SDK v1.x
 */
function createServer() {
  const server = new McpServer(
    { name: 'rastar-mcp-rastar', version: '0.2.0' },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Register all tools using v1.x API
  // Create Zod schemas from JSON Schema definitions
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: createZodSchemaFromTool(tool),
      },
      async (args: any) => {
        console.error('[index.ts] Tool handler called:', { 
          toolName: tool.name, 
          argsType: typeof args,
          argsKeys: args ? Object.keys(args) : 'null',
          hasAccessToken: !!args?.accessToken,
          hasUserId: !!args?.userId
        });
        try {
          const result = await handleToolCall(tool.name as any, args);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error(`[index.ts] Tool ${tool.name} error:`, error.message);
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
  for (const resource of allResources) {
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
    console.error('[MCP Rastar] Starting in stdio mode (local development)');
    
    const server = createServer();
    const stdioTransport = new StdioServerTransport();
    
    await server.connect(stdioTransport);
    console.error('[MCP Rastar] Connected via stdio, ready to handle requests');
  } else {
    // HTTP mode for Docker/production
    console.error('[MCP Rastar] Starting Streamable HTTP server...');
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3101;

    // Strict DNS rebinding protection - all hosts must be explicitly configured
    // Only Docker service name is allowed by default for internal container communication
    // Add all other hosts (localhost, production domains, etc.) via ALLOWED_HOSTS env var
    const baseHosts = ['mcp-rastar'];
    const envHosts = process.env.ALLOWED_HOSTS;
    if (!envHosts) {
      console.warn('[MCP Rastar] WARNING: ALLOWED_HOSTS not set. Only internal Docker access allowed.');
      console.warn('[MCP Rastar] Set ALLOWED_HOSTS env var to allow external access (e.g., "localhost,rastar-mcp.rastar.dev")');
    }
    const additionalHosts = envHosts ? envHosts.split(',').map(h => h.trim()).filter(Boolean) : [];
    const allowedHosts = [...baseHosts, ...additionalHosts];
    
    console.error(`[MCP Rastar] Allowed hosts: ${allowedHosts.join(', ')}`);
    
    const app = createMcpExpressApp({ 
      host: '0.0.0.0',
      allowedHosts
    });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mcp-rastar', version: '0.2.0' });
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
      console.error('[MCP Rastar] Error handling request:', error);
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
    console.error(`[MCP Rastar] Streamable HTTP server running on port ${PORT}`);
    console.error(`[MCP Rastar] Health: http://localhost:${PORT}/health`);
    console.error(`[MCP Rastar] MCP endpoint: http://localhost:${PORT}/mcp`);
    console.error('[MCP Rastar] Ready to handle requests');
  });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[MCP Rastar] Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[MCP Rastar] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('[MCP Rastar] Fatal error:', error);
  process.exit(1);
});
