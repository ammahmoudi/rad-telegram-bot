import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSystemConfig } from '@rad/shared';
import AdminLayout from './AdminLayout';
import { SettingsPageHeader } from '@/components/SettingsPageHeader';
import { SettingsForm } from '@/components/SettingsForm';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch system config
  const plankaBaseUrl = (await getSystemConfig('PLANKA_BASE_URL')) || process.env.PLANKA_SERVER_URL || 'Not set';
  const openRouterKey = (await getSystemConfig('OPENROUTER_API_KEY')) || '';
  const defaultModel = (await getSystemConfig('DEFAULT_AI_MODEL')) || '';
  const maxToolCalls = (await getSystemConfig('maxToolCalls')) || '5';
  const mcpProjectScanLimit = (await getSystemConfig('mcpProjectScanLimit')) || '';
  const mcpProjectScanDelay = (await getSystemConfig('mcpProjectScanDelay')) || '100';
  const useHardcodedPrompts = (await getSystemConfig('USE_HARDCODED_PROMPTS')) || 'false';
  const plankaDailyReportCategoryId = (await getSystemConfig('PLANKA_DAILY_REPORT_CATEGORY_ID')) || '';
  const mcpToolLoggingEnabled = (await getSystemConfig('MCP_TOOL_LOGGING_ENABLED')) || 'false';
  const showReasoningToUsers = (await getSystemConfig('SHOW_REASONING_TO_USERS')) || 'true';
  const plankaAuthToken = (await getSystemConfig('PLANKA_AUTH_TOKEN')) || '';
  const chatMode = (await getSystemConfig('CHAT_MODE')) || process.env.CHAT_MODE || 'thread';
  const chatHistoryMode = (await getSystemConfig('CHAT_HISTORY_MODE')) || 'message_count';
  const chatHistoryLimit = (await getSystemConfig('CHAT_HISTORY_LIMIT')) || '';
  const chatRestoreToolResults = (await getSystemConfig('CHAT_RESTORE_TOOL_RESULTS')) || 'false';
  
  const config = {
    PLANKA_BASE_URL: plankaBaseUrl,
    PLANKA_AUTH_TOKEN: plankaAuthToken,
    OPENROUTER_API_KEY: openRouterKey,
    DEFAULT_AI_MODEL: defaultModel,
    ENV_DEFAULT_MODEL: process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet',
    maxToolCalls,
    mcpProjectScanLimit,
    mcpProjectScanDelay,
    USE_HARDCODED_PROMPTS: useHardcodedPrompts,
    PLANKA_DAILY_REPORT_CATEGORY_ID: plankaDailyReportCategoryId,
    CHAT_MODE: chatMode,
    CHAT_HISTORY_MODE: chatHistoryMode,
    CHAT_HISTORY_LIMIT: chatHistoryLimit,
    CHAT_RESTORE_TOOL_RESULTS: chatRestoreToolResults,
    MCP_TOOL_LOGGING_ENABLED: mcpToolLoggingEnabled,
    SHOW_REASONING_TO_USERS: showReasoningToUsers,
  };
  
  const hasApiKey = openRouterKey.length > 0;
  const envApiKey = process.env.OPENROUTER_API_KEY || '';
  const usingEnvApiKey = !hasApiKey && envApiKey.length > 0;

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <SettingsPageHeader />
        <SettingsForm 
          config={config}
          hasApiKey={hasApiKey}
          usingEnvApiKey={usingEnvApiKey}
          envPlankaUrl={process.env.PLANKA_SERVER_URL}
          envApiKey={envApiKey}
          envDailyReportCategoryId={process.env.PLANKA_DAILY_REPORT_CATEGORY_ID}
        />
      </div>
    </AdminLayout>
  );
}
