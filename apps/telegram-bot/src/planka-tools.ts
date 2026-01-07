import { getMcpManager } from './mcp-client.js';
import { getPlankaToken, deletePlankaToken, getSystemConfig } from '@rad/shared';
import { t } from './utils/i18n-helper.js';

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
  sessionId?: string,
  messageId?: string,
  userLanguage?: string,
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

    // Inject system-wide categoryId for daily report tools (if configured)
    if (toolName.includes('getDailyReportProjects') || toolName.includes('get_daily_report_projects')) {
      const categoryId = await getSystemConfig('PLANKA_DAILY_REPORT_CATEGORY_ID').catch(() => null);
      if (categoryId) {
        toolArgs.categoryId = categoryId;
        console.log('[MCP:planka] Injected categoryId:', categoryId);
      }
    }

    // Call the MCP server (Planka tools all start with 'planka.')
    const result = await manager.callTool('planka', toolName, toolArgs, telegramUserId, sessionId, messageId);

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
    console.log('[MCP:planka] Result check:', {
      isError: result.isError,
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      includes401: content.includes('401'),
    });

    // Check for 401 unauthorized errors (check both isError flag and error content)
    const isErrorResult = result.isError || content.startsWith('Error:');
    if (isErrorResult && content.includes('401')) {
      console.error('[MCP:planka] 401 Unauthorized - token expired or invalid');
      
      // Automatically delete the expired token from database
      const deleted = await deletePlankaToken(telegramUserId);
      console.log(`[MCP:planka] Expired token ${deleted ? 'deleted' : 'not found'} for user ${telegramUserId}`);
      
      // Use translated message based on user's language
      const errorMessage = t(userLanguage || 'en', 'planka-connection-expired');
      
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
    console.error(`[executeMcpTool] Error executing ${toolName}:`, error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
