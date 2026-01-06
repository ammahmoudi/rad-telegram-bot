import { getMcpManager } from './mcp-client.js';
import { getValidRastarToken, deleteRastarToken } from '@rad/shared';
import { t } from './utils/i18n-helper.js';

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
  sessionId?: string,
  messageId?: string,
  userLanguage?: string,
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
    const result = await manager.callTool('rastar', toolName, toolArgs, telegramUserId, sessionId, messageId);

    // Extract text content from MCP result
    let content = '';
    if (result.content && Array.isArray(result.content)) {
      for (const item of result.content) {
        if (item.type === 'text') {
          content += item.text;
        }
      }
    }

    // Debug logging for 401 detection
    console.log('[MCP:rastar] Result check:', {
      isError: result.isError,
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      includes401: content.includes('401'),
      includesUnauthorized: content.includes('Unauthorized'),
    });

    // Check for 401 unauthorized errors (check both isError flag and error content)
    const isErrorResult = result.isError || content.startsWith('Error:');
    if (isErrorResult && (content.includes('401') || content.includes('Unauthorized'))) {
      console.error('[MCP:rastar] 401 Unauthorized - token expired or invalid');
      
      // Automatically delete the expired token from database
      const deleted = await deleteRastarToken(telegramUserId);
      console.log(`[MCP:rastar] Expired token ${deleted ? 'deleted' : 'not found'} for user ${telegramUserId}`);
      
      // Use translated message based on user's language
      const errorMessage = t(userLanguage || 'en', 'rastar-connection-expired');
      
      return {
        success: false,
        content: '',
        error: errorMessage,
      };
    }

    return {
      success: !isErrorResult,
      content,
      error: isErrorResult ? content : undefined,
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
