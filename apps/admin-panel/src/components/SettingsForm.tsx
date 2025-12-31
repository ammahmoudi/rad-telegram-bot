'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ModelSelector } from '@/components/ModelSelector';

interface SettingsFormProps {
  config: {
    PLANKA_BASE_URL: string;
    OPENROUTER_API_KEY: string;
    DEFAULT_AI_MODEL: string;
    ENV_DEFAULT_MODEL: string;
    maxToolCalls: string;
    mcpProjectScanLimit: string;
    mcpProjectScanDelay: string;
    USE_HARDCODED_PROMPTS: string;
    PLANKA_DAILY_REPORT_CATEGORY_ID: string;
  };
  hasApiKey: boolean;
  usingEnvApiKey: boolean;
  envPlankaUrl?: string;
  envApiKey?: string;
  envDailyReportCategoryId?: string;
}

export function SettingsForm({ config, hasApiKey, usingEnvApiKey, envPlankaUrl, envApiKey, envDailyReportCategoryId }: SettingsFormProps) {
  const { t, dir } = useLanguage();

  return (
    <>
      {/* Info Banner */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-200">
          {t.settings.info}
        </p>
      </div>

      {/* System Configuration Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t.settings.sectionTitle}</h2>
              <p className="text-slate-400 text-sm">{t.settings.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form action="/api/update-config" method="POST" className="space-y-6">
            {/* Planka Base URL */}
            <div className="space-y-2">
              <label htmlFor="plankaBaseUrl" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.plankaUrl}
                {config.PLANKA_BASE_URL === 'Not set' && envPlankaUrl && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    (using .env: {envPlankaUrl})
                  </span>
                )}
              </label>
              <input
                id="plankaBaseUrl"
                type="url"
                name="plankaBaseUrl"
                defaultValue={config.PLANKA_BASE_URL === 'Not set' ? envPlankaUrl || '' : config.PLANKA_BASE_URL}
                placeholder="https://planka.example.com or leave empty to use .env"
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
                required
              />
              <p className="text-xs text-slate-400" dir={dir}>
                This URL will be used for all new Planka account links. Existing links are not affected.
              </p>
            </div>

            {/* Planka Daily Report Category ID */}
            <div className="space-y-2">
              <label htmlFor="plankaDailyReportCategoryId" className="text-sm font-medium text-white block" dir={dir}>
                Daily Report Category ID (Optional)
                {!config.PLANKA_DAILY_REPORT_CATEGORY_ID && envDailyReportCategoryId && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    (using .env: {envDailyReportCategoryId})
                  </span>
                )}
              </label>
              <input
                id="plankaDailyReportCategoryId"
                type="text"
                name="plankaDailyReportCategoryId"
                defaultValue={config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || ''}
                placeholder="e.g., 1637176448517146026 (leave empty to filter by project name)"
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-400" dir={dir}>
                If set, daily report tools will filter projects by this category ID instead of by name pattern ("Daily report - ...").
                Find category IDs in your Planka instance under Project Settings → Category.
              </p>
            </div>

            {/* OpenRouter API Key */}
            <div className="space-y-2">
              <label htmlFor="openrouterApiKey" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.openrouterKey}
                {hasApiKey && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-green-400`}>
                    ✓ Configured in DB
                  </span>
                )}
                {usingEnvApiKey && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    ✓ Using .env (sk-or-v1-...{envApiKey.slice(-4)})
                  </span>
                )}
                {!hasApiKey && !usingEnvApiKey && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-amber-400`}>
                    ⚠ Not configured
                  </span>
                )}
              </label>
              <input
                id="openrouterApiKey"
                type="password"
                name="openrouterApiKey"
                defaultValue={config.OPENROUTER_API_KEY}
                placeholder="sk-or-v1-... (leave empty to use .env)"
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-400" dir={dir}>
                {t.settings.openrouterKeyHelp}{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* AI Model Selector */}
            <div className="space-y-2">
              <label htmlFor="defaultModel" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.aiModel}
                {!config.DEFAULT_AI_MODEL && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    (using .env: {config.ENV_DEFAULT_MODEL})
                  </span>
                )}
              </label>
              <ModelSelector 
                defaultModel={config.DEFAULT_AI_MODEL || config.ENV_DEFAULT_MODEL} 
                name="defaultModel"
              />
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 space-y-1">
                <p className="text-xs text-amber-200">
                  ⚠️ <strong>Tool Support Required:</strong> Only models supporting tool/function calling are shown.
                </p>
                <p className="text-xs text-amber-300">
                  💡 Avoid <strong>openrouter/auto</strong> mode as it may route to models without tool support.
                </p>
              </div>
            </div>

            {/* Max Tool Calls */}
            <div className="space-y-2">
              <label htmlFor="maxToolCalls" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.maxToolCalls}
              </label>
              <input
                id="maxToolCalls"
                type="number"
                name="maxToolCalls"
                min="1"
                max="10"
                defaultValue={config.maxToolCalls}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-400" dir={dir}>
                Maximum rounds of tool calls the AI can make before responding (default: 5).
              </p>
            </div>

            {/* MCP Settings */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="space-y-2">
                <label htmlFor="mcpProjectScanLimit" className="text-sm font-medium text-white block" dir={dir}>
                  {t.settings.projectScanLimit}
                </label>
                <input
                  id="mcpProjectScanLimit"
                  type="number"
                  name="mcpProjectScanLimit"
                  min="0"
                  defaultValue={config.mcpProjectScanLimit}
                  placeholder="5 (leave empty for default)"
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
                <p className="text-xs text-slate-400" dir={dir}>
                  Limit number of projects scanned when listing all users (default: 5). Set to 0 for unlimited.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="mcpProjectScanDelay" className="text-sm font-medium text-white block" dir={dir}>
                  {t.settings.projectScanDelay}
                </label>
                <input
                  id="mcpProjectScanDelay"
                  type="number"
                  name="mcpProjectScanDelay"
                  min="0"
                  defaultValue={config.mcpProjectScanDelay}
                  placeholder="100"
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
                <p className="text-xs text-slate-400" dir={dir}>
                  Delay between processing each project (default: 100ms). Set to 0 for no delay.
                </p>
              </div>
            </div>

            {/* Hardcoded Prompts Setting */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start gap-3" dir={dir}>
                <input
                  id="useHardcodedPrompts"
                  type="checkbox"
                  name="useHardcodedPrompts"
                  defaultChecked={config.USE_HARDCODED_PROMPTS === 'true'}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <label htmlFor="useHardcodedPrompts" className="text-sm font-medium text-white block cursor-pointer">
                    {t.settings.useHardcoded}
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.settings.useHardcodedHelp}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                {t.settings.saveSettings}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
