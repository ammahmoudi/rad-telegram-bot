import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSystemConfig } from '@rad/shared';
import { ModelSelector } from '@/components/ModelSelector';
import AdminLayout from './AdminLayout';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch system config
  const plankaBaseUrl = (await getSystemConfig('PLANKA_BASE_URL')) || process.env.PLANKA_SERVER_URL || 'Not set';
  const openRouterKey = (await getSystemConfig('OPENROUTER_API_KEY')) || '';
  const defaultModel = (await getSystemConfig('DEFAULT_AI_MODEL')) || process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';
  const maxToolCalls = (await getSystemConfig('maxToolCalls')) || '5';
  const mcpProjectScanLimit = (await getSystemConfig('mcpProjectScanLimit')) || '';
  const mcpProjectScanDelay = (await getSystemConfig('mcpProjectScanDelay')) || '100';
  
  const hasApiKey = openRouterKey.length > 0;
  const envApiKey = process.env.OPENROUTER_API_KEY || '';
  const usingEnvApiKey = !hasApiKey && envApiKey.length > 0;

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">تنظیمات سیستم</h1>
          <p className="text-slate-400 mt-2">مدیریت تنظیمات پیکربندی و یکپارچه‌سازی‌ها</p>
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-200">
              💡 برای ویرایش پیام‌های ربات (سیستم پرامپت و خوش‌آمدگویی)، به صفحه <strong>پک‌های شخصیتی</strong> بروید و پک پیش‌فرض را ویرایش کنید.
            </p>
          </div>
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
                <h2 className="text-xl font-semibold text-white">تنظیمات سیستم</h2>
                <p className="text-slate-400 text-sm">تنظیمات عمومی و یکپارچه‌سازی‌ها</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form action="/api/update-config" method="POST" className="space-y-6" dir="ltr">
              {/* Planka Base URL */}
              <div className="space-y-2">
                <label htmlFor="plankaBaseUrl" className="text-sm font-medium text-white block">
                  Planka Base URL
                  {plankaBaseUrl === 'Not set' && process.env.PLANKA_SERVER_URL && (
                    <span className="ml-2 text-xs text-blue-400">
                      (using .env: {process.env.PLANKA_SERVER_URL})
                    </span>
                  )}
                </label>
                <input
                  id="plankaBaseUrl"
                  type="url"
                  name="plankaBaseUrl"
                  defaultValue={plankaBaseUrl === 'Not set' ? process.env.PLANKA_SERVER_URL || '' : plankaBaseUrl}
                  placeholder="https://pm-dev.rastar.dev or leave empty to use .env"
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-slate-400">
                  This URL will be used for all new Planka account links. Existing links are not affected.
                </p>
              </div>

              {/* AI Configuration */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                  AI Configuration
                </h3>
                <p className="text-xs text-slate-400 mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                  ℹ️ <strong>Note:</strong> Settings here override environment variables (.env). If not set here, the bot will use values from your .env file.
                </p>
                
                <div className="space-y-4">
                  {/* OpenRouter API Key */}
                  <div className="space-y-2">
                    <label htmlFor="openRouterKey" className="text-sm font-medium text-white block">
                      OpenRouter API Key
                      {hasApiKey && (
                        <span className="ml-2 text-xs text-green-400">✓ Configured in DB</span>
                      )}
                      {usingEnvApiKey && (
                        <span className="ml-2 text-xs text-blue-400">
                          ✓ Using .env (sk-or-v1-...{envApiKey.slice(-4)})
                        </span>
                      )}
                      {!hasApiKey && !usingEnvApiKey && (
                        <span className="ml-2 text-xs text-amber-400">
                          ⚠ Not configured
                        </span>
                      )}
                    </label>
                    <input
                      id="openRouterKey"
                      type="password"
                      name="openRouterKey"
                      defaultValue={openRouterKey}
                      placeholder="sk-or-v1-... (leave empty to use .env)"
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400">
                      Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">openrouter.ai/keys</a>
                    </p>
                  </div>

                  {/* Default AI Model */}
                  <div className="space-y-2">
                    <label htmlFor="defaultModel" className="text-sm font-medium text-white block">
                      Default AI Model
                      {process.env.DEFAULT_AI_MODEL && (
                        <span className="ml-2 text-xs text-blue-400">
                          (env default: {process.env.DEFAULT_AI_MODEL})
                        </span>
                      )}
                    </label>
                    <ModelSelector name="defaultModel" defaultValue={defaultModel} />
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
                    <label htmlFor="maxToolCalls" className="text-sm font-medium text-white block">
                      Max Tool Call Rounds
                    </label>
                    <input
                      id="maxToolCalls"
                      type="number"
                      name="maxToolCalls"
                      defaultValue={maxToolCalls}
                      min="1"
                      max="10"
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400">
                      Maximum rounds of tool calls the AI can make before responding (default: 5).
                    </p>
                  </div>

                  {/* MCP Project Scan Limit */}
                  <div className="space-y-2">
                    <label htmlFor="mcpProjectScanLimit" className="text-sm font-medium text-white block">
                      MCP Project Scan Limit
                    </label>
                    <input
                      id="mcpProjectScanLimit"
                      type="number"
                      name="mcpProjectScanLimit"
                      defaultValue={mcpProjectScanLimit}
                      min="0"
                      placeholder="5 (leave empty for default)"
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400">
                      Limit number of projects scanned when listing all users (default: 5). Set to 0 for unlimited.
                    </p>
                  </div>

                  {/* MCP Project Scan Delay */}
                  <div className="space-y-2">
                    <label htmlFor="mcpProjectScanDelay" className="text-sm font-medium text-white block">
                      MCP Project Scan Delay (ms)
                    </label>
                    <input
                      id="mcpProjectScanDelay"
                      type="number"
                      name="mcpProjectScanDelay"
                      defaultValue={mcpProjectScanDelay}
                      min="0"
                      step="50"
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400">
                      Delay between processing each project (default: 100ms). Set to 0 for no delay.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end pt-4 border-t border-white/10">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      ذخیره تنظیمات
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
