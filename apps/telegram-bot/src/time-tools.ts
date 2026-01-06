import { getMcpManager } from './mcp-client.js';

export interface ToolExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Execute a Time MCP tool call
 * Time tools don't require authentication - they're always available
 */
export async function executeTimeTool(
  toolName: string,
  args: Record<string, any>,
  telegramUserId?: string,
  sessionId?: string,
  messageId?: string,
): Promise<ToolExecutionResult> {
  console.log('[executeTimeTool]', { toolName, args });
  try {
    const manager = getMcpManager();
    
    if (!manager) {
      return {
        success: false,
        content: '',
        error: 'MCP manager not available',
      };
    }

    // Call the Time MCP server (logging happens in mcp-client.ts)
    const result = await manager.callTool('time', toolName, args, telegramUserId, sessionId, messageId);

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
    console.error(`[executeTimeTool] Error executing ${toolName}:`, error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
