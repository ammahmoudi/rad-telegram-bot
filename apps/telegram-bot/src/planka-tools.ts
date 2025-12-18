import { getMcpManager } from './mcp-client.js';

export interface ToolExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Execute an MCP tool call
 */
export async function executeMcpTool(
  telegramUserId: string,
  toolName: string,
  args: Record<string, any>,
): Promise<ToolExecutionResult> {
  console.log('[executeMcpTool]', { toolName, args });
  try {
    const manager = getMcpManager();
    
    // Add telegramUserId to args so MCP server can authenticate
    const toolArgs = {
      ...args,
      telegramUserId,
    };

    // Call the MCP server (Planka tools all start with 'planka.')
    const result = await manager.callTool('planka', toolName, toolArgs);

    // Extract text content from MCP result
    let content = '';
    if (result.content && Array.isArray(result.content)) {
      for (const item of result.content) {
        if (item.type === 'text') {
          content += item.text;
        }
      }
    }

    return {
      success: !result.isError,
      content,
      error: result.isError ? content : undefined,
    };
  } catch (error) {
    console.error('[executeMcpTool] Error executing ${toolName}:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
