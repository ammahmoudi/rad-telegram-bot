import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

export interface McpServerConfig {
  name: string;
  url?: string;  // For HTTP transport
  command?: string;  // For stdio transport
  args?: string[];  // For stdio transport
  env?: Record<string, string>;  // For stdio transport
}

/**
 * MCP Client Manager
 * Supports both Streamable HTTP (Docker/production) and stdio (local development) transports
 */
export class McpClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, Transport> = new Map();

  /**
   * Connect to an MCP server via HTTP or stdio transport
   */
  async connect(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      console.log(`[MCP] Already connected to ${config.name}`);
      return;
    }

    let transport: Transport;

    // Use stdio transport if command is provided
    if (config.command) {
      console.log(`[MCP] Connecting to ${config.name} via stdio...`);
      console.log(`[MCP] Command: ${config.command} ${config.args?.join(' ') || ''}`);
      
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env,
      });
    } 
    // Use HTTP transport if URL is provided
    else if (config.url) {
      console.log(`[MCP] Connecting to ${config.name} via Streamable HTTP...`);
      console.log(`[MCP] URL: ${config.url}`);
      
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    }
    else {
      throw new Error(`[MCP] Invalid config for ${config.name}: must provide either url or command`);
    }

    try {
      // Create and connect client
      const client = new Client(
        {
          name: 'telegram-bot',
          version: '1.0.0',
        },
        {
          capabilities: {},
        },
      );

      await client.connect(transport);

      this.clients.set(config.name, client);
      this.transports.set(config.name, transport);

      console.log(`[MCP] Successfully connected to ${config.name}`);
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * List tools from an MCP server
   */
  async listTools(serverName: string): Promise<Tool[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to MCP server: ${serverName}`);
    }

    const response = await client.listTools();
    return response.tools || [];
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
    telegramUserId?: string,
    sessionId?: string,
    messageId?: string,
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to MCP server: ${serverName}`);
    }

    console.log(`[MCP:${serverName}] Calling tool ${toolName}`, args);
    const startTime = Date.now();
    
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      const executionTimeMs = Date.now() - startTime;

      // Log the tool call if user ID is provided
      if (telegramUserId) {
        // Extract output content for logging
        let outputContent = '';
        if (result.content && Array.isArray(result.content)) {
          for (const item of result.content) {
            if (item.type === 'text') {
              outputContent += item.text;
            }
          }
        }

        // Import logging function dynamically to avoid circular dependencies
        const { logMcpToolCall } = await import('@rad/shared');
        await logMcpToolCall({
          telegramUserId,
          sessionId,
          messageId,
          mcpServer: serverName,
          toolName,
          inputArgs: args as Record<string, any>,
          outputContent: outputContent.substring(0, 10000), // Limit output size
          success: !result.isError,
          errorMessage: result.isError ? outputContent : undefined,
          executionTimeMs,
        }).catch((err) => {
          console.error('[MCP] Failed to log tool call:', err);
        });
      }

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      // Log the error if user ID is provided
      if (telegramUserId) {
        const { logMcpToolCall } = await import('@rad/shared');
        await logMcpToolCall({
          telegramUserId,
          sessionId,
          messageId,
          mcpServer: serverName,
          toolName,
          inputArgs: args as Record<string, any>,
          outputContent: '',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          executionTimeMs,
        }).catch((err) => {
          console.error('[MCP] Failed to log tool call error:', err);
        });
      }

      throw error;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }

    console.log(`[MCP] Disconnected from ${serverName}`);
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnectAll(): Promise<void> {
    const serverNames = Array.from(this.clients.keys());
    await Promise.all(serverNames.map((name) => this.disconnect(name)));
  }

  /**
   * Get all tools from all connected servers
   */
  async getAllTools(): Promise<{ serverName: string; tool: Tool }[]> {
    const allTools: { serverName: string; tool: Tool }[] = [];

    for (const [serverName, client] of this.clients) {
      try {
        const tools = await this.listTools(serverName);
        allTools.push(...tools.map((tool) => ({ serverName, tool })));
      } catch (error) {
        console.error(`[MCP] Failed to list tools from ${serverName}:`, error);
      }
    }

    return allTools;
  }
}

// Singleton instance
let mcpManager: McpClientManager | null = null;

/**
 * Get or create the MCP client manager
 */
export function getMcpManager(): McpClientManager {
  if (!mcpManager) {
    mcpManager = new McpClientManager();
  }
  return mcpManager;
}

/**
 * Initialize MCP servers for the Telegram bot
 * Supports both stdio (local development) and HTTP (Docker/production) transports
 */
export async function initializeMcpServers(): Promise<void> {
  console.log('[MCP] Starting MCP server initialization...');
  
  const mcpTransport = process.env.MCP_TRANSPORT || 'http';
  const manager = getMcpManager();

  if (mcpTransport === 'stdio') {
    console.log('[MCP] Using stdio transport (local development)');
    
    // Spawn MCP servers as child processes
    const plankaServerPath = path.join(repoRoot, 'packages/mcp-planka/dist/index.js');
    const rastarServerPath = path.join(repoRoot, 'packages/mcp-rastar/dist/index.js');
    const timeServerPath = path.join(repoRoot, 'packages/mcp-time/dist/index.js');

    console.log(`[MCP] Connecting to Planka MCP server (stdio)...`);
    await manager.connect({
      name: 'planka',
      command: 'node',
      args: [plankaServerPath],
      env: {
        ...(process.env as Record<string, string>),
        MCP_TRANSPORT: 'stdio',
      },
    });

    console.log(`[MCP] Connecting to Rastar MCP server (stdio)...`);
    await manager.connect({
      name: 'rastar',
      command: 'node',
      args: [rastarServerPath],
      env: {
        ...(process.env as Record<string, string>),
        MCP_TRANSPORT: 'stdio',
      },
    });

    console.log(`[MCP] Connecting to Time MCP server (stdio)...`);
    await manager.connect({
      name: 'time',
      command: 'node',
      args: [timeServerPath],
      env: {
        ...(process.env as Record<string, string>),
        MCP_TRANSPORT: 'stdio',
      },
    });
  } else {
    console.log('[MCP] Using Streamable HTTP transport (Docker/production)');
    
    // MCP server URLs (Streamable HTTP endpoints)
    const plankaUrl = process.env.MCP_PLANKA_URL || 'http://mcp-planka:3100/mcp';
    const rastarUrl = process.env.MCP_RASTAR_URL || 'http://mcp-rastar:3101/mcp';
    const timeUrl = process.env.MCP_TIME_URL || 'http://mcp-time:3102/mcp';

    console.log(`[MCP] Connecting to Planka MCP server at ${plankaUrl}...`);
    await manager.connect({
      name: 'planka',
      url: plankaUrl,
    });

    console.log(`[MCP] Connecting to Rastar MCP server at ${rastarUrl}...`);
    await manager.connect({
      name: 'rastar',
      url: rastarUrl,
    });

    // Try to connect to Time MCP (optional)
    try {
      console.log(`[MCP] Connecting to Time MCP server at ${timeUrl}...`);
      await manager.connect({
        name: 'time',
        url: timeUrl,
      });
      console.log(`[MCP] Successfully connected to time`);
    } catch (error) {
      console.warn(`[MCP] Failed to connect to Time MCP server (optional):`, error instanceof Error ? error.message : error);
      console.warn(`[MCP] Bot will continue without Time tools`);
    }
  }

  console.log('[MCP] All servers initialized successfully');
}
