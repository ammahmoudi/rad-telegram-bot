import { getSystemConfig, listPlankaTokens } from '@rastar/shared';
import { ModelSelector } from '@/components/ModelSelector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const tokens = await listPlankaTokens();
  const plankaBaseUrl = (await getSystemConfig('PLANKA_BASE_URL')) || 'Not set';
  const openRouterKey = (await getSystemConfig('OPENROUTER_API_KEY')) || '';
  const defaultModel = (await getSystemConfig('DEFAULT_AI_MODEL')) || 'anthropic/claude-3.5-sonnet';
  
  const hasApiKey = openRouterKey.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Admin Panel
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage system configuration and linked accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* System Configuration */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              System Configuration
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Global settings for the bot and integrations
            </p>
          </div>
          <div className="p-6">
            <form action="/api/update-config" method="POST" className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="plankaBaseUrl" className="text-sm font-medium text-slate-900 dark:text-slate-50 block">
                  Planka Base URL
                </label>
                <input
                  id="plankaBaseUrl"
                  type="url"
                  name="plankaBaseUrl"
                  defaultValue={plankaBaseUrl}
                  placeholder="https://pm-dev.rastar.dev"
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This URL will be used for all new Planka account links. Existing links are not affected.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                  AI Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                  ℹ️ <strong>Note:</strong> Settings here override environment variables (.env). If not set here, the bot will use values from your .env file.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="openRouterKey" className="text-sm font-medium text-slate-900 dark:text-slate-50 block">
                      OpenRouter API Key
                      {hasApiKey && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ Configured</span>
                      )}
                      {!hasApiKey && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                          (using .env if available)
                        </span>
                      )}
                    </label>
                    <input
                      id="openRouterKey"
                      type="password"
                      name="openRouterKey"
                      defaultValue={openRouterKey}
                      placeholder="sk-or-v1-... (leave empty to use .env)"
                      className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="defaultModel" className="text-sm font-medium text-slate-900 dark:text-slate-50 block">
                      Default AI Model
                    </label>
                    <ModelSelector name="defaultModel" defaultValue={defaultModel} />
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 space-y-1">
                      <p className="text-xs text-amber-900 dark:text-amber-200">
                        ⚠️ <strong>Tool Support Required:</strong> Only models supporting tool/function calling are shown. The bot needs this to interact with Planka.
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        💡 Avoid <strong>openrouter/auto</strong> mode as it may route to models without tool support.
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Browse all models at <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/models</a>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Changes take effect immediately (bot will detect on next message)
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950 transition-all active:scale-[0.98]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Save All Settings
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Linked Accounts
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Users who have connected their Planka accounts (tokens are encrypted)
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total:</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{tokens.length}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Telegram User ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Planka Base URL
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-700">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p className="text-sm text-slate-500 dark:text-slate-400">No linked accounts yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tokens.map((t) => (
                    <tr key={t.telegramUserId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-slate-50">
                        {t.telegramUserId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {t.plankaBaseUrl}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(t.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
