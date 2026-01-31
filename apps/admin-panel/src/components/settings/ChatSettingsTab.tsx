'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ChatSettingsTabProps {
  config: {
    CHAT_MODE: string;
    CHAT_HISTORY_MODE: string;
    CHAT_HISTORY_LIMIT: string;
    CHAT_RESTORE_TOOL_RESULTS: string;
    USE_HARDCODED_PROMPTS: string;
  };
  dir: string;
}

export function ChatSettingsTab({ config, dir }: ChatSettingsTabProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* Chat Mode Setting */}
      <div className="space-y-2">
        <label htmlFor="chatMode" className="text-sm font-medium text-white block" dir={dir}>
          {t.settings.chat.modeLabel}
        </label>
        <select
          id="chatMode"
          name="chatMode"
          title="Select chat mode"
          defaultValue={config.CHAT_MODE}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          dir="ltr"
        >
          <option value="thread">{t.settings.chat.modeThread}</option>
          <option value="simple">{t.settings.chat.modeSimple}</option>
        </select>
        <p className="text-xs text-slate-400" dir={dir}>
          <strong>{t.settings.chat.modeThreadTitle}</strong> {t.settings.chat.modeThreadHelp}
          <br />
          <strong>{t.settings.chat.modeSimpleTitle}</strong> {t.settings.chat.modeSimpleHelp}
        </p>
      </div>

      {/* Chat History Configuration */}
      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">{t.settings.chat.historyTitle}</h4>
          <p className="text-xs text-slate-400 mb-4">{t.settings.chat.historySubtitle}</p>
        </div>

        {/* History Mode */}
        <div className="space-y-2">
          <label htmlFor="chatHistoryMode" className="text-sm font-medium text-white block" dir={dir}>
            {t.settings.chat.historyModeLabel}
          </label>
          <select
            id="chatHistoryMode"
            name="chatHistoryMode"
            defaultValue={config.CHAT_HISTORY_MODE || 'message_count'}
            className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            dir="ltr"
          >
            <option value="message_count">{t.settings.chat.historyModeMessageCount}</option>
            <option value="token_size">{t.settings.chat.historyModeTokenSize}</option>
          </select>
          <p className="text-xs text-slate-400" dir={dir}>
            <strong>{t.settings.chat.historyModeMessageCountTitle}</strong> {t.settings.chat.historyModeMessageCountHelp}
            <br />
            <strong>{t.settings.chat.historyModeTokenSizeTitle}</strong> {t.settings.chat.historyModeTokenSizeHelp}
          </p>
        </div>

        {/* History Limit */}
        <div className="space-y-2">
          <label htmlFor="chatHistoryLimit" className="text-sm font-medium text-white block" dir={dir}>
            {t.settings.chat.historyLimitLabel}
          </label>
          <input
            id="chatHistoryLimit"
            type="number"
            name="chatHistoryLimit"
            min="1"
            defaultValue={config.CHAT_HISTORY_LIMIT || ''}
            placeholder="20 for message_count, 4000 for token_size"
            className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            dir="ltr"
          />
          <p className="text-xs text-slate-400" dir={dir}>
            {t.settings.chat.historyLimitHelpLine1}
            <br />
            {t.settings.chat.historyLimitHelpLine2}
          </p>
        </div>

        {/* Restore Tool Results */}
        <div className="flex items-start gap-3" dir={dir}>
          <input
            id="chatRestoreToolResults"
            type="checkbox"
            name="chatRestoreToolResults"
            defaultChecked={config.CHAT_RESTORE_TOOL_RESULTS === 'true'}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
          />
          <div className="flex-1">
            <label htmlFor="chatRestoreToolResults" className="text-sm font-medium text-white block cursor-pointer">
              {t.settings.chat.restoreToolResultsLabel}
            </label>
            <p className="text-xs text-slate-400 mt-1">
              {t.settings.chat.restoreToolResultsHelpLine1}
              <br />
              <strong>{t.settings.chat.restoreToolResultsRecommended}</strong> {t.settings.chat.restoreToolResultsHelpLine2}
            </p>
          </div>
        </div>
      </div>

      {/* Hardcoded Prompts */}
      <div className="flex items-start gap-3" dir={dir}>
        <input
          id="useHardcodedPrompts"
          type="checkbox"
          name="useHardcodedPrompts"
          defaultChecked={config.USE_HARDCODED_PROMPTS === 'true'}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
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
  );
}
