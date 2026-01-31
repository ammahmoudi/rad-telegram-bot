'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface DebugSettingsTabProps {
  config: {
    mcpProjectScanLimit: string;
    mcpProjectScanDelay: string;
    MCP_TOOL_LOGGING_ENABLED: string;
    SHOW_REASONING_TO_USERS: string;
    ENABLE_MIDDLE_OUT_TRANSFORM: string;
  };
  dir: string;
}

export function DebugSettingsTab({ config, dir }: DebugSettingsTabProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* MCP Settings */}
      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-semibold text-white">{t.settings.debug.mcpScanningTitle}</h4>

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
            className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            dir="ltr"
          />
          <p className="text-xs text-slate-400" dir={dir}>
            {t.settings.projectScanLimitHelp}
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
            className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            dir="ltr"
          />
          <p className="text-xs text-slate-400" dir={dir}>
            {t.settings.projectScanDelayHelp}
          </p>
        </div>
      </div>

      {/* MCP Tool Logging */}
      <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4" dir={dir}>
        <input
          id="mcpToolLogging"
          type="checkbox"
          name="mcpToolLogging"
          defaultChecked={config.MCP_TOOL_LOGGING_ENABLED === 'true'}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex-1">
          <label htmlFor="mcpToolLogging" className="text-sm font-medium text-white block cursor-pointer">
            {t.settings.debug.mcpToolLoggingLabel}
          </label>
          <p className="text-xs text-slate-400 mt-1">
            {t.settings.debug.mcpToolLoggingHelp}
          </p>
        </div>
      </div>

      {/* Show Reasoning to Users */}
      <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4" dir={dir}>
        <input
          id="showReasoningToUsers"
          type="checkbox"
          name="showReasoningToUsers"
          defaultChecked={config.SHOW_REASONING_TO_USERS !== 'false'}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex-1">
          <label htmlFor="showReasoningToUsers" className="text-sm font-medium text-white block cursor-pointer">
            {t.settings.debug.showReasoningLabel}
          </label>
          <p className="text-xs text-slate-400 mt-1">
            {t.settings.debug.showReasoningHelp}
          </p>
        </div>
      </div>

      {/* Enable Middle-Out Transform */}
      <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4" dir={dir}>
        <input
          id="enableMiddleOutTransform"
          type="checkbox"
          name="enableMiddleOutTransform"
          defaultChecked={config.ENABLE_MIDDLE_OUT_TRANSFORM !== 'false'}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="enableMiddleOutTransform" className="text-sm font-medium text-white block cursor-pointer">
            {t.settings.debug.middleOutLabel}
          </label>
          <p className="text-xs text-slate-400 mt-1">
            {t.settings.debug.middleOutHelp}
          </p>
        </div>
      </div>
    </div>
  );
}
