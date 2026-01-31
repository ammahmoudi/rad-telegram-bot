'use client';

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
  return (
    <div className="space-y-6">
      {/* Chat Mode Setting */}
      <div className="space-y-2">
        <label htmlFor="chatMode" className="text-sm font-medium text-white block" dir={dir}>
          Chat Mode
        </label>
        <select
          id="chatMode"
          name="chatMode"
          title="Select chat mode"
          defaultValue={config.CHAT_MODE}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          dir="ltr"
        >
          <option value="thread">Thread Mode (Topics/Threads)</option>
          <option value="simple">Simple Mode (Single Chat)</option>
        </select>
        <p className="text-xs text-slate-400" dir={dir}>
          <strong>Thread Mode (Default):</strong> Uses Telegram&apos;s threaded mode. Each conversation creates a new thread/topic. <code>/clear_chat</code> deletes the current thread.
          <br />
          <strong>Simple Mode:</strong> All chats in main private chat without threads. <code>/clear_chat</code> only clears AI history but keeps messages visible.
        </p>
      </div>

      {/* Chat History Configuration */}
      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Conversation History Settings</h4>
          <p className="text-xs text-slate-400 mb-4">Control how much conversation history is kept in memory</p>
        </div>

        {/* History Mode */}
        <div className="space-y-2">
          <label htmlFor="chatHistoryMode" className="text-sm font-medium text-white block" dir={dir}>
            History Mode
          </label>
          <select
            id="chatHistoryMode"
            name="chatHistoryMode"
            defaultValue={config.CHAT_HISTORY_MODE || 'message_count'}
            className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            dir="ltr"
          >
            <option value="message_count">Message Count (Simple & Predictable)</option>
            <option value="token_size">Token Size (Better for AI Context)</option>
          </select>
          <p className="text-xs text-slate-400" dir={dir}>
            <strong>Message Count:</strong> Keep last N messages (faster, simpler).
            <br />
            <strong>Token Size:</strong> Keep messages up to N tokens (~4 chars = 1 token).
          </p>
        </div>

        {/* History Limit */}
        <div className="space-y-2">
          <label htmlFor="chatHistoryLimit" className="text-sm font-medium text-white block" dir={dir}>
            History Limit
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
            Default: <strong>20</strong> for message_count mode, <strong>4000</strong> for token_size mode.
            <br />
            Token size: 4000 tokens ≈ 16,000 characters ≈ 3,000 words.
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
              🔧 Restore Tool Results from Database
            </label>
            <p className="text-xs text-slate-400 mt-1">
              When enabled, tool outputs are restored from logs when loading history. This uses more context but provides richer memory.
              <br />
              <strong>Recommended:</strong> Keep disabled for better performance.
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
            📝 Use Hardcoded Prompts
          </label>
          <p className="text-xs text-slate-400 mt-1">
            When enabled, uses predefined AI system prompts instead of dynamic ones. Useful for consistent behavior.
          </p>
        </div>
      </div>
    </div>
  );
}
