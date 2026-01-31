'use client';

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
  return (
    <div className="space-y-6">
      {/* MCP Settings */}
      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-semibold text-white">MCP Project Scanning</h4>

        <div className="space-y-2">
          <label htmlFor="mcpProjectScanLimit" className="text-sm font-medium text-white block" dir={dir}>
            Project Scan Limit
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
            Limit number of projects scanned when listing all users (default: 5). Set to 0 for unlimited.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="mcpProjectScanDelay" className="text-sm font-medium text-white block" dir={dir}>
            Project Scan Delay (ms)
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
            Delay between processing each project (default: 100ms). Set to 0 for no delay.
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
            🔍 Enable MCP Tool Call Logging
          </label>
          <p className="text-xs text-slate-400 mt-1">
            Logs all MCP tool calls (inputs/outputs) to database for debugging. Includes execution time and error tracking.
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
            🧠 Show AI Reasoning to Users
          </label>
          <p className="text-xs text-slate-400 mt-1">
            When enabled, users see the AI&apos;s internal reasoning process and tool usage. When disabled, users only see a &quot;🤔 Thinking...&quot; indicator and the final response.
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
            🗜️ Enable Context Compression (Middle-Out)
          </label>
          <p className="text-xs text-slate-400 mt-1">
            Automatically compress large conversation contexts using OpenRouter&apos;s middle-out transform. Helps prevent &quot;context too large&quot; errors when viewing many tasks or long histories. Recommended: enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
