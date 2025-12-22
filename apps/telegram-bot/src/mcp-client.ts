import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class McpClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(config: McpServerConfig): Promise<void> {
    if (this.clients.has(config.name)) {
      console.log(`[MCP] Already connected to ${config.name}`);
      return;
    }

    console.log(`[MCP] Connecting to ${config.name}...`);

    // Create transport and client
    const envVars: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) envVars[key] = value;
    }
    if (config.env) {
      Object.assign(envVars, config.env);
    }
    
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: envVars,
      stderr: 'inherit', // Show MCP server console output
    });

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

    console.log(`[MCP] Connected to ${config.name}`);
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
 */
export async function initializeMcpServers(): Promise<void> {
  console.log('[MCP] Starting MCP server initialization...');
  const manager = getMcpManager();

  // Connect to Planka MCP server
  const repoRoot = path.resolve(__dirname, '../../..');
  const plankaServerPath = path.join(repoRoot, 'packages/mcp-planka/src/index.ts');
  
  console.log('[MCP] Planka server path:', plankaServerPath);
  console.log('[MCP] Connecting to Planka MCP server...');

  await manager.connect({
    name: 'planka',
    command: 'tsx',
    args: [plankaServerPath],
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  });

  // Connect to Rastar MCP server
  const rastarServerPath = path.join(repoRoot, 'packages/mcp-rastar/src/index.ts');
  
  console.log('[MCP] Rastar server path:', rastarServerPath);
  console.log('[MCP] Connecting to Rastar MCP server...');

  await manager.connect({
    name: 'rastar',
    command: 'tsx',
    args: [rastarServerPath],
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  });

  console.log('[MCP] All servers initialized');
}
