import { getMcpManager } from './mcp-client.js';
import { getPlankaToken } from '@rad/shared';

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
    
    // Look up Planka credentials from database
    const plankaAuth = await getPlankaToken(telegramUserId);
    if (!plankaAuth) {
      return {
        success: false,
        content: '',
        error: 'Planka not linked. Use /link_planka to connect your account.',
      };
    }

    // Log auth details (without exposing token)
    console.log('[MCP:planka] Calling tool', toolName, {
      plankaBaseUrl: plankaAuth.plankaBaseUrl,
      plankaToken: `${plankaAuth.accessToken.substring(0, 50)}...`,
    });

    // Pass Planka credentials to MCP server (not telegramUserId)
    const toolArgs = {
      ...args,
      plankaBaseUrl: plankaAuth.plankaBaseUrl,
      plankaToken: plankaAuth.accessToken,
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

    // Check for 401 unauthorized errors
    if (result.isError && content.includes('401')) {
      console.error('[MCP:planka] 401 Unauthorized - token may be expired or invalid');
      return {
        success: false,
        content: '',
        error: 'Planka authentication failed. Your token may be expired. Please reconnect: /link_planka',
      };
    }

    return {
      success: !result.isError,
      content,
      error: result.isError ? content : undefined,
    };
  } catch (error) {
    console.error(`[executeMcpTool] Error executing ${toolName}:`, error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
