#!/usr/bin/env node
/**
 * MCP Time Server
 * 
 * Provides accurate time and date operations with Persian calendar support
 * Supports both stdio (local dev) and Streamable HTTP (Docker/production) transports
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import {
  getCurrentTime,
  calculateRelativeDate,
  addDuration,
  getTimeRange,
  formatTimeResult,
} from './utils/time.js';

// Tool definitions
const timeTools = [
  {
    name: 'get_current_time',
    description: 'Get the current date and time in both Gregorian and Persian (Jalali) calendar formats. Returns accurate system time to prevent AI from guessing or using incorrect dates.',
  },
  {
    name: 'calculate_relative_date',
    description: 'Calculate a date based on a relative expression like "today", "yesterday", "2 days ago", "last week", "next month", etc. Useful for parsing user queries with relative time references.',
  },
  {
    name: 'add_duration',
    description: 'Add or subtract a duration from a base time. Supports units like "2h" (hours), "3d" (days), "1w" (weeks), "2M" (months). Prefix with "-" for subtraction (e.g., "-2h" for 2 hours ago).',
  },
  {
    name: 'get_time_range',
    description: 'Get start and end times for a time range. Supports dynamic expressions like "last 5 days", "next 2 weeks", "last 3 months", plus fixed ranges like today/yesterday/tomorrow, this/last/next week/month/quarter/year/season, last 7/30/60/90 days. Returns full date/time details for both start and end.',
  },
];

/**
 * Create Zod schemas from tool definitions
 */
function createZodSchemaFromTool(tool: any) {
  switch (tool.name) {
    case 'get_current_time':
      return z.object({
        timezone: z.string().optional(),
        format: z.enum(['full', 'iso', 'unix', 'gregorian', 'jalali']).optional(),
      });
    
    case 'calculate_relative_date':
      return z.object({
        expression: z.string().describe('Relative date expression like "today", "yesterday", "2 days ago", "last week"'),
        timezone: z.string().optional(),
        format: z.enum(['full', 'iso', 'unix', 'gregorian', 'jalali']).optional(),
      });
    
    case 'add_duration':
      return z.object({
        baseTime: z.string().optional(),
        duration: z.string().describe('Duration like "2h", "3d", "1w", "-2h"'),
        timezone: z.string().optional(),
        format: z.enum(['full', 'iso', 'unix', 'gregorian', 'jalali']).optional(),
      });
    
    case 'get_time_range':
      return z.object({
        range_name: z.string().describe(
          'Time range name. Examples: ' +
          'today, yesterday, tomorrow, ' +
          'this/last/next week/month/quarter/year/season, ' +
          'last 5 days, next 2 weeks, last 3 months, ' +
          'last 7/30/60/90 days, past week/month/quarter'
        ),
        timezone: z.string().optional(),
        format: z.enum(['full', 'iso', 'unix', 'gregorian', 'jalali']).optional(),
      });
    
    default:
      return z.object({}).passthrough();
  }
}

/**
 * Create and configure the MCP Time server
 * Using production-ready patterns from official MCP TypeScript SDK v1.x
 */
function createServer() {
  const server = new McpServer(
    { name: 'mcp-time', version: '1.0.0' },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register all tools using v1.x API
  for (const tool of timeTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: createZodSchemaFromTool(tool),
      },
      // @ts-ignore - TypeScript has issues with deep type instantiation in registerTool
      async (args: any) => {
        try {
          let result;
          let formatted;
          
          switch (tool.name) {
            case 'get_current_time':
              result = getCurrentTime(args?.timezone);
              formatted = formatTimeResult(result, args?.format || 'full');
              break;
              
            case 'calculate_relative_date':
              result = calculateRelativeDate(args.expression, args?.timezone);
              formatted = formatTimeResult(result, args?.format || 'full');
              break;
              
            case 'add_duration':
              result = addDuration(args?.baseTime, args.duration, args?.timezone);
              formatted = formatTimeResult(result, args?.format || 'full');
              break;
              
            case 'get_time_range':
              const rangeName = args.range_name;
              if (!rangeName) {
                throw new Error('Missing required parameter: range_name');
              }
              const rangeResult = getTimeRange(rangeName, args?.timezone);
              const format = args?.format || 'full';
              formatted = {
                start: formatTimeResult(rangeResult.start, format),
                end: formatTimeResult(rangeResult.end, format),
              };
              break;
              
            default:
              throw new Error(`Unknown tool: ${tool.name}`);
          }
          
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(formatted, null, 2),
              },
            ],
          };
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

  return server;
}

/**
 * Main entry point - supports both stdio (local dev) and HTTP (production) modes
 */
async function main() {
  const transport = process.env.MCP_TRANSPORT || 'http';

  if (transport === 'stdio') {
    // Stdio mode for local development
    console.error('[MCP Time] Starting in stdio mode (local development)');
    
    const server = createServer();
    const stdioTransport = new StdioServerTransport();
    
    await server.connect(stdioTransport);
    console.error('[MCP Time] Connected via stdio, ready to handle requests');
  } else {
    // HTTP mode for Docker/production
    console.error('[MCP Time] Starting Streamable HTTP server...');
    
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3102;

    // Strict DNS rebinding protection - all hosts must be explicitly configured
    // Only Docker service name is allowed by default for internal container communication
    // Add all other hosts (localhost, production domains, etc.) via ALLOWED_HOSTS env var
    const baseHosts = ['mcp-time'];
    const envHosts = process.env.ALLOWED_HOSTS;
    
    console.error(`[MCP Time] Environment check:`);
    console.error(`[MCP Time] - ALLOWED_HOSTS raw value: ${JSON.stringify(envHosts)}`);
    console.error(`[MCP Time] - NODE_ENV: ${process.env.NODE_ENV}`);
    
    if (!envHosts) {
      console.warn('[MCP Time] WARNING: ALLOWED_HOSTS not set. Only internal Docker access allowed.');
      console.warn('[MCP Time] Set ALLOWED_HOSTS env var to allow external access (e.g., "localhost,time-mcp.rastar.dev")');
    }
    
    const additionalHosts = envHosts ? envHosts.split(',').map(h => h.trim()).filter(Boolean) : [];
    const allowedHosts = [...baseHosts, ...additionalHosts];
    
    console.error(`[MCP Time] Final allowed hosts configuration: ${JSON.stringify(allowedHosts)}`);
    console.error(`[MCP Time] Requests from these hostnames will be accepted.`);
    
    // Create Express app manually to add debug middleware BEFORE host validation
    const app = express();
    app.use(express.json());
    
    // Debug middleware - FIRST, so it logs even rejected requests
    app.use((req, res, next) => {
      console.error(`[MCP Time] Incoming request:`);
      console.error(`[MCP Time] - Method: ${req.method}`);
      console.error(`[MCP Time] - Path: ${req.path}`);
      console.error(`[MCP Time] - Host header: ${req.headers.host}`);
      console.error(`[MCP Time] - X-Forwarded-Host: ${req.headers['x-forwarded-host']}`);
      console.error(`[MCP Time] - X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`);
      console.error(`[MCP Time] - All headers: ${JSON.stringify(req.headers)}`);
      next();
    });
    
    // Health check endpoint - BEFORE host validation so Docker healthcheck works
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'mcp-time', version: '1.0.0' });
    });
    
    // Now add host validation
    // @ts-ignore - Express type compatibility issue with SDK middleware
    app.use(hostHeaderValidation(allowedHosts));

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
        console.error('[MCP Time] Error handling request:', error);
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
    app.listen(PORT, '0.0.0.0', () => {
      console.error(`[MCP Time] Streamable HTTP server running on port ${PORT}`);
      console.error(`[MCP Time] Health: http://localhost:${PORT}/health`);
      console.error(`[MCP Time] MCP endpoint: http://localhost:${PORT}/mcp`);
      console.error('[MCP Time] Ready to handle requests');
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[MCP Time] Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[MCP Time] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('[MCP Time] Fatal error:', error);
  process.exit(1);
});
