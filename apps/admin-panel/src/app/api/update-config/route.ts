import { setSystemConfig } from '@rad/shared';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const plankaBaseUrl = formData.get('plankaBaseUrl');
    const openRouterKey = formData.get('openRouterKey');
    const defaultModel = formData.get('defaultModel');
    const maxToolCalls = formData.get('maxToolCalls');
    const mcpProjectScanLimit = formData.get('mcpProjectScanLimit');
    const mcpProjectScanDelay = formData.get('mcpProjectScanDelay');
    const useHardcodedPrompts = formData.get('useHardcodedPrompts');
    const plankaDailyReportCategoryId = formData.get('plankaDailyReportCategoryId');
    const chatMode = formData.get('chatMode');
    const chatHistoryMode = formData.get('chatHistoryMode');
    const chatHistoryLimit = formData.get('chatHistoryLimit');
    const chatRestoreToolResults = formData.get('chatRestoreToolResults');
    const mcpToolLogging = formData.get('mcpToolLogging');
    const showReasoningToUsers = formData.get('showReasoningToUsers');
    const enableMiddleOutTransform = formData.get('enableMiddleOutTransform');

    // Update Planka Base URL if provided
    if (plankaBaseUrl && typeof plankaBaseUrl === 'string' && plankaBaseUrl.trim()) {
      const normalizedUrl = plankaBaseUrl.trim().replace(/\/+$/, '');
      await setSystemConfig('PLANKA_BASE_URL', normalizedUrl);
    }

    // Update daily report category ID
    if (plankaDailyReportCategoryId !== null && typeof plankaDailyReportCategoryId === 'string') {
      const trimmed = plankaDailyReportCategoryId.trim();
      await setSystemConfig('PLANKA_DAILY_REPORT_CATEGORY_ID', trimmed);
      console.log('Updated PLANKA_DAILY_REPORT_CATEGORY_ID to:', trimmed || '(empty)');
    }

    // Update AI configuration if provided
    if (openRouterKey && typeof openRouterKey === 'string') {
      // Only update if not empty or if explicitly clearing
      if (openRouterKey.trim().length > 0) {
        await setSystemConfig('OPENROUTER_API_KEY', openRouterKey.trim());
      }
    }

    if (defaultModel && typeof defaultModel === 'string') {
      await setSystemConfig('DEFAULT_AI_MODEL', defaultModel);
    }

    if (maxToolCalls && typeof maxToolCalls === 'string') {
      const num = parseInt(maxToolCalls);
      if (num >= 1 && num <= 10) {
        await setSystemConfig('maxToolCalls', maxToolCalls);
      }
    }

    if (mcpProjectScanLimit !== null && typeof mcpProjectScanLimit === 'string') {
      const trimmed = mcpProjectScanLimit.trim();
      if (trimmed === '') {
        // Empty means unlimited - store empty string
        await setSystemConfig('mcpProjectScanLimit', '');
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 0) {
          await setSystemConfig('mcpProjectScanLimit', trimmed);
        }
      }
    }

    if (mcpProjectScanDelay !== null && typeof mcpProjectScanDelay === 'string') {
      const trimmed = mcpProjectScanDelay.trim();
      if (trimmed !== '') {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 0) {
          await setSystemConfig('mcpProjectScanDelay', trimmed);
        }
      }
    }

    // Update hardcoded prompts setting
    await setSystemConfig('USE_HARDCODED_PROMPTS', useHardcodedPrompts === 'on' ? 'true' : 'false');

    // Update chat mode setting (thread or simple)
    if (chatMode && typeof chatMode === 'string') {
      const mode = chatMode.toLowerCase();
      if (mode === 'thread' || mode === 'simple') {
        await setSystemConfig('CHAT_MODE', mode);
      }
    }

    // Update chat history mode
    if (chatHistoryMode && typeof chatHistoryMode === 'string') {
      if (chatHistoryMode === 'message_count' || chatHistoryMode === 'token_size') {
        await setSystemConfig('CHAT_HISTORY_MODE', chatHistoryMode);
      }
    }

    // Update chat history limit
    if (chatHistoryLimit !== null && typeof chatHistoryLimit === 'string') {
      const trimmed = chatHistoryLimit.trim();
      if (trimmed !== '') {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num > 0) {
          await setSystemConfig('CHAT_HISTORY_LIMIT', trimmed);
        }
      }
    }

    // Update chat restore tool results setting
    await setSystemConfig('CHAT_RESTORE_TOOL_RESULTS', chatRestoreToolResults === 'on' ? 'true' : 'false');

    // Update MCP tool logging setting
    await setSystemConfig('MCP_TOOL_LOGGING_ENABLED', mcpToolLogging === 'on' ? 'true' : 'false');

    // Update show reasoning to users setting
    await setSystemConfig('SHOW_REASONING_TO_USERS', showReasoningToUsers === 'on' ? 'true' : 'false');

    // Update middle-out transform setting (enabled by default)
    await setSystemConfig('ENABLE_MIDDLE_OUT_TRANSFORM', enableMiddleOutTransform === 'on' ? 'true' : 'false');

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
