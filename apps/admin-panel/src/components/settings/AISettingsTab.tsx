'use client';

import { ModelSelector } from '@/components/ModelSelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface AISettingsTabProps {
  config: {
    OPENROUTER_API_KEY: string;
    DEFAULT_AI_MODEL: string;
    ENV_DEFAULT_MODEL: string;
    maxToolCalls: string;
  };
  hasApiKey: boolean;
  usingEnvApiKey: boolean;
  envApiKey?: string;
  dir: string;
}

export function AISettingsTab({ config, hasApiKey, usingEnvApiKey, envApiKey, dir }: AISettingsTabProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* OpenRouter API Key */}
      <div className="space-y-2">
        <label htmlFor="openrouterApiKey" className="text-sm font-medium text-white block" dir={dir}>
          {t.settings.openrouterKey}
          {hasApiKey && (
            <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-green-400`}>
              {t.settings.ai.apiKeyConfiguredDb}
            </span>
          )}
          {usingEnvApiKey && envApiKey && (
            <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
              {t.settings.ai.apiKeyUsingEnv.replace('{suffix}', envApiKey.slice(-4))}
            </span>
          )}
          {!hasApiKey && !usingEnvApiKey && (
            <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-amber-400`}>
              {t.settings.ai.apiKeyNotConfigured}
            </span>
          )}
        </label>
        <input
          id="openrouterApiKey"
          type="password"
          name="openRouterKey"
          defaultValue={config.OPENROUTER_API_KEY}
          placeholder={t.settings.ai.apiKeyPlaceholder}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              ({t.settings.ai.usingEnv}: {config.ENV_DEFAULT_MODEL})
            </span>
          )}
        </label>
        <ModelSelector 
          defaultModel={config.DEFAULT_AI_MODEL || config.ENV_DEFAULT_MODEL} 
          name="defaultModel"
        />
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 space-y-1">
          <p className="text-xs text-amber-200">
            ⚠️ <strong>{t.settings.aiModelWarnings.toolSupportTitle}</strong> {t.settings.aiModelWarnings.toolSupportBody}
          </p>
          <p className="text-xs text-amber-300">
            💡 {t.settings.aiModelWarnings.avoidAuto}
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
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          dir="ltr"
        />
        <p className="text-xs text-slate-400" dir={dir}>
          {t.settings.maxToolCallsHelp}
        </p>
      </div>
    </div>
  );
}
