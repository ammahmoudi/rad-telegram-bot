'use client';

import { ModelSelector } from '@/components/ModelSelector';

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
  return (
    <div className="space-y-6">
      {/* OpenRouter API Key */}
      <div className="space-y-2">
        <label htmlFor="openrouterApiKey" className="text-sm font-medium text-white block" dir={dir}>
          OpenRouter API Key
          {hasApiKey && (
            <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-green-400`}>
              ✓ Configured in DB
            </span>
          )}
          {usingEnvApiKey && envApiKey && (
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
          name="openRouterKey"
          defaultValue={config.OPENROUTER_API_KEY}
          placeholder="sk-or-v1-... (leave empty to use .env)"
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          dir="ltr"
        />
        <p className="text-xs text-slate-400" dir={dir}>
          Get your API key at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
            openrouter.ai/keys
          </a>
        </p>
      </div>

      {/* AI Model Selector */}
      <div className="space-y-2">
        <label htmlFor="defaultModel" className="text-sm font-medium text-white block" dir={dir}>
          AI Model
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
          Max Tool Calls Per Round
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
          Maximum rounds of tool calls the AI can make before responding (default: 5).
        </p>
      </div>
    </div>
  );
}
