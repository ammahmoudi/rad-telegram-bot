'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { PlankaSettingsTab } from './settings/PlankasettingsTab';
import { AISettingsTab } from './settings/AISettingsTab';
import { ChatSettingsTab } from './settings/ChatSettingsTab';
import { DebugSettingsTab } from './settings/DebugSettingsTab';

type SettingsTab = 'planka' | 'ai' | 'chat' | 'debug';

interface SettingsFormProps {
  config: {
    PLANKA_BASE_URL: string;
    PLANKA_AUTH_TOKEN: string;
    OPENROUTER_API_KEY: string;
    DEFAULT_AI_MODEL: string;
    ENV_DEFAULT_MODEL: string;
    maxToolCalls: string;
    mcpProjectScanLimit: string;
    mcpProjectScanDelay: string;
    USE_HARDCODED_PROMPTS: string;
    PLANKA_DAILY_REPORT_CATEGORY_ID: string;
    CHAT_MODE: string;
    CHAT_HISTORY_MODE: string;
    CHAT_HISTORY_LIMIT: string;
    CHAT_RESTORE_TOOL_RESULTS: string;
    MCP_TOOL_LOGGING_ENABLED: string;
    SHOW_REASONING_TO_USERS: string;
    ENABLE_MIDDLE_OUT_TRANSFORM: string;
  };
  hasApiKey: boolean;
  usingEnvApiKey: boolean;
  envPlankaUrl?: string;
  envApiKey?: string;
  envDailyReportCategoryId?: string;
}

export function SettingsForm({
  config,
  hasApiKey,
  usingEnvApiKey,
  envPlankaUrl,
  envApiKey,
  envDailyReportCategoryId,
}: SettingsFormProps) {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('planka');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveLoading(true);

    const formData = new FormData(e.currentTarget);
    const loadingToast = toast.loading('💾 Saving settings...');

    try {
      const response = await fetch('/api/update-config', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('✓ Settings saved successfully!', { id: loadingToast });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`✗ ${result.error || 'Failed to save settings'}`, { id: loadingToast });
      }
    } catch (error) {
      toast.error('✗ Failed to save settings', { id: loadingToast });
      console.error('Failed to save settings:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: 'planka', label: t.settings.tabs.planka, icon: '🔗' },
    { id: 'ai', label: t.settings.tabs.ai, icon: '🤖' },
    { id: 'chat', label: t.settings.tabs.chat, icon: '💬' },
    { id: 'debug', label: t.settings.tabs.debug, icon: '🔍' },
  ];

  return (
    <>
      <Toaster position="top-right" />

      {/* Info Banner */}
      <div className="mt-6 bg-linear-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-blue-100">{t.settings.info}</p>
        </div>
      </div>

      {/* Settings Container - Enlarged and Enhanced */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 mt-8 overflow-hidden">
        {/* Header with Gradient */}
        <div className="p-8 border-b border-white/20 bg-linear-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-linear-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{t.settings.title}</h2>
              <p className="text-slate-300 text-base">{t.settings.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Tabs - Improved Design */}
        <div className="flex border-b border-white/20 overflow-x-auto bg-slate-900/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 font-semibold transition-all whitespace-nowrap text-base relative ${
                activeTab === tab.id
                  ? 'text-white bg-linear-to-b from-blue-500/20 to-transparent'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-2xl">{tab.icon}</span>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-cyan-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - More Spacious */}
        <div className="p-8">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className={activeTab === 'planka' ? 'block' : 'hidden'}>
              <PlankaSettingsTab
                config={{
                  PLANKA_BASE_URL: config.PLANKA_BASE_URL,
                  PLANKA_AUTH_TOKEN: config.PLANKA_AUTH_TOKEN,
                  PLANKA_DAILY_REPORT_CATEGORY_ID: config.PLANKA_DAILY_REPORT_CATEGORY_ID,
                }}
                envPlankaUrl={envPlankaUrl}
                envDailyReportCategoryId={envDailyReportCategoryId}
                dir={dir}
              />
            </div>

            <div className={activeTab === 'ai' ? 'block' : 'hidden'}>
              <AISettingsTab
                config={{
                  OPENROUTER_API_KEY: config.OPENROUTER_API_KEY,
                  DEFAULT_AI_MODEL: config.DEFAULT_AI_MODEL,
                  ENV_DEFAULT_MODEL: config.ENV_DEFAULT_MODEL,
                  maxToolCalls: config.maxToolCalls,
                }}
                hasApiKey={hasApiKey}
                usingEnvApiKey={usingEnvApiKey}
                envApiKey={envApiKey}
                dir={dir}
              />
            </div>

            <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
              <ChatSettingsTab
                config={{
                  CHAT_MODE: config.CHAT_MODE,
                  CHAT_HISTORY_MODE: config.CHAT_HISTORY_MODE,
                  CHAT_HISTORY_LIMIT: config.CHAT_HISTORY_LIMIT,
                  CHAT_RESTORE_TOOL_RESULTS: config.CHAT_RESTORE_TOOL_RESULTS,
                  USE_HARDCODED_PROMPTS: config.USE_HARDCODED_PROMPTS,
                }}
                dir={dir}
              />
            </div>

            <div className={activeTab === 'debug' ? 'block' : 'hidden'}>
              <DebugSettingsTab
                config={{
                  mcpProjectScanLimit: config.mcpProjectScanLimit,
                  mcpProjectScanDelay: config.mcpProjectScanDelay,
                  MCP_TOOL_LOGGING_ENABLED: config.MCP_TOOL_LOGGING_ENABLED,
                  SHOW_REASONING_TO_USERS: config.SHOW_REASONING_TO_USERS,
                  ENABLE_MIDDLE_OUT_TRANSFORM: config.ENABLE_MIDDLE_OUT_TRANSFORM,
                }}
                dir={dir}
              />
            </div>

            {/* Save Button - Enhanced */}
            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={saveLoading}
                className="group px-8 py-3.5 bg-linear-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5">
                  {saveLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>{t.settings.saveSettings}</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
