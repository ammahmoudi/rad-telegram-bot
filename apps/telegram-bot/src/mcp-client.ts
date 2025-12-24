import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface McpServerConfig {
  name: string;
  url: string;
}

/**
 * MCP Client Manager
 * Uses Streamable HTTP transport (modern, production-ready approach for v1.x SDK)
 */
export class McpClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StreamableHTTPClientTransport> = new Map();

  /**
   * Connect to an MCP server via Streamable HTTP transport
   */
  async connect(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      console.log(`[MCP] Already connected to ${config.name}`);
      return;
    }

    console.log(`[MCP] Connecting to ${config.name} via Streamable HTTP...`);
    console.log(`[MCP] URL: ${config.url}`);

    try {
      // Create Streamable HTTP transport
      const transport = new StreamableHTTPClientTransport(new URL(config.url));

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
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to MCP server: ${serverName}`);
    }

    console.log(`[MCP:${serverName}] Calling tool ${toolName}`, args);
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
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
 * Uses Streamable HTTP transport (production-ready for v1.x SDK)
 */
export async function initializeMcpServers(): Promise<void> {
  console.log('[MCP] Starting MCP server initialization...');
  console.log('[MCP] Using Streamable HTTP transport (production-ready)');

  const manager = getMcpManager();

  // MCP server URLs (Streamable HTTP endpoints)
  const plankaUrl = process.env.MCP_PLANKA_URL || 'http://mcp-planka:3100/mcp';
  const rastarUrl = process.env.MCP_RASTAR_URL || 'http://mcp-rastar:3101/mcp';

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

  console.log('[MCP] All servers initialized successfully');
}
