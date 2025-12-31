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
  
  const config = {
    PLANKA_BASE_URL: plankaBaseUrl,
    OPENROUTER_API_KEY: openRouterKey,
    DEFAULT_AI_MODEL: defaultModel,
    ENV_DEFAULT_MODEL: process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet',
    maxToolCalls,
    mcpProjectScanLimit,
    mcpProjectScanDelay,
    USE_HARDCODED_PROMPTS: useHardcodedPrompts,
    PLANKA_DAILY_REPORT_CATEGORY_ID: plankaDailyReportCategoryId,
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
