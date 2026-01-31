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
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-200">{t.settings.info}</p>
      </div>

      {/* Settings Container */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 mt-6">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{t.settings.title}</h2>
              <p className="text-slate-400 text-sm">{t.settings.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
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

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveLoading ? '💾 Saving...' : t.settings.saveSettings}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
