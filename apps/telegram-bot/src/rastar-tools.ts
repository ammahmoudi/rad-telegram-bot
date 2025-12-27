import { getMcpManager } from './mcp-client.js';
import { getValidRastarToken } from '@rad/shared';

export interface ToolExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Execute a Rastar MCP tool call
 */
export async function executeRastarTool(
  telegramUserId: string,
  toolName: string,
  args: Record<string, any>,
): Promise<ToolExecutionResult> {
  console.log('[executeRastarTool]', { toolName, args });
  try {
    const manager = getMcpManager();
    
    // Look up Rastar credentials from database
    const rastarAuth = await getValidRastarToken(telegramUserId);
    if (!rastarAuth) {
      return {
        success: false,
        content: '',
        error: 'Rastar not linked. Use /link_rastar to connect your account.',
      };
    }

    // Pass Rastar credentials to MCP server
    const toolArgs = {
      ...args,
      accessToken: rastarAuth.accessToken,
      userId: rastarAuth.userId,
    };

    // Call the MCP server
    const result = await manager.callTool('rastar', toolName, toolArgs);

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
    console.error(`[executeRastarTool] Error executing ${toolName}:`, error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
