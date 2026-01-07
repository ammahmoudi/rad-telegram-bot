'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ModelSelector } from '@/components/ModelSelector';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';

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
  };
  hasApiKey: boolean;
  usingEnvApiKey: boolean;
  envPlankaUrl?: string;
  envApiKey?: string;
  envDailyReportCategoryId?: string;
}

export function SettingsForm({ config, hasApiKey, usingEnvApiKey, envPlankaUrl, envApiKey, envDailyReportCategoryId }: SettingsFormProps) {
  const { t, dir } = useLanguage();
  const [loginLoading, setLoginLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || '');

  // Fetch categories when authenticated
  useEffect(() => {
    if (config.PLANKA_AUTH_TOKEN) {
      fetchCategories();
    }
  }, [config.PLANKA_AUTH_TOKEN]);

  // Update selected category when config changes
  useEffect(() => {
    setSelectedCategory(config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || '');
  }, [config.PLANKA_DAILY_REPORT_CATEGORY_ID, envDailyReportCategoryId]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/planka-categories');
      const data = await response.json();
      if (response.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handlePlankaLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading('🔐 Logging in to Planka...');

    try {
      const response = await fetch('/api/planka-login', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✓ Successfully authenticated with Planka!', {
          id: loadingToast,
        });
        (e.target as HTMLFormElement).reset();
        setShowLoginModal(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`✗ ${data.error || 'Login failed'}`, {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error('✗ Failed to connect to server', {
        id: loadingToast,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSaveLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const loadingToast = toast.loading('💾 Saving settings...');

    try {
      const response = await fetch('/api/update-config', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'manual',
      });

      // Handle redirects manually
      if (response.status === 307 || response.status === 308) {
        const location = response.headers.get('Location');
        if (location) {
          const redirectResponse = await fetch(location, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });
          const data = await redirectResponse.json();
          
          if (redirectResponse.ok) {
            toast.success('✓ Settings saved successfully!', {
              id: loadingToast,
              duration: 2000,
            });
            setTimeout(() => window.location.reload(), 1000);
          } else {
            toast.error(`✗ ${data.error || 'Failed to save settings'}`, {
              id: loadingToast,
              duration: 4000,
            });
          }
          return;
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (response.ok) {
        toast.success('✓ Settings saved successfully!', {
          id: loadingToast,
          duration: 3000,
        });
      } else {
        toast.error(`✗ ${data.error || 'Failed to save settings'}`, {
          id: loadingToast,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(`✗ ${error instanceof Error ? error.message : 'Failed to connect to server'}`, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Planka Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowLoginModal(false)}>
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                🔐 Login to Planka
              </h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePlankaLogin} className="space-y-4">
              <p className="text-sm text-gray-400">
                Login with your Planka credentials to enable project category fetching.
              </p>
              
              <div className="space-y-2">
                <label htmlFor="modalPlankaUsername" className="text-sm font-medium text-gray-300 block">
                  Username or Email
                </label>
                <input
                  id="modalPlankaUsername"
                  type="text"
                  name="plankaUsername"
                  placeholder="username or email@example.com"
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="modalPlankaPassword" className="text-sm font-medium text-gray-300 block">
                  Password
                </label>
                <input
                  id="modalPlankaPassword"
                  type="password"
                  name="plankaPassword"
                  placeholder="Enter your Planka password"
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginLoading ? '🔄 Logging in...' : '🔐 Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-200">
          {t.settings.info}
        </p>
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
              <h2 className="text-xl font-semibold text-white">{t.settings.sectionTitle}</h2>
              <p className="text-slate-400 text-sm">{t.settings.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Planka Base URL */}
            <div className="space-y-2">
              <label htmlFor="plankaBaseUrl" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.plankaUrl}
                {config.PLANKA_BASE_URL === 'Not set' && envPlankaUrl && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    (using .env: {envPlankaUrl})
                  </span>
                )}
              </label>
              <input
                id="plankaBaseUrl"
                type="url"
                name="plankaBaseUrl"
                defaultValue={config.PLANKA_BASE_URL === 'Not set' ? envPlankaUrl || '' : config.PLANKA_BASE_URL}
                placeholder="https://planka.example.com or leave empty to use .env"
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
                required
              />
              <p className="text-xs text-slate-400" dir={dir}>
                This URL will be used for all new Planka account links. Existing links are not affected.
              </p>
            </div>

          {/* Planka Authentication Button */}
          <div className="p-4 bg-white/5 rounded-lg border border-emerald-500/30 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">
                  Planka Authentication
                  {config.PLANKA_AUTH_TOKEN && (
                    <span className="ml-2 text-xs text-green-400">
                      ✓ Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {config.PLANKA_AUTH_TOKEN 
                    ? 'You are authenticated. Click to re-login if needed.'
                    : 'Login to enable project category fetching.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                🔐 Login
              </button>
            </div>
          </div>

            {/* Planka Daily Report Category */}
            <div className="space-y-2">
              <label htmlFor="plankaDailyReportCategoryId" className="text-sm font-medium text-white block" dir={dir}>
                Daily Report Category (Optional)
                {!config.PLANKA_DAILY_REPORT_CATEGORY_ID && envDailyReportCategoryId && (
                  <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} text-xs text-blue-400`}>
                    (using .env: {envDailyReportCategoryId})
                  </span>
                )}
              </label>
              {config.PLANKA_AUTH_TOKEN ? (
                <div className="space-y-2">
                  <select
                    id="plankaDailyReportCategoryId"
                    name="plankaDailyReportCategoryId"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                    disabled={categoriesLoading}
                  >
                    <option value="">-- No category (filter by project name) --</option>
                    {categoriesLoading ? (
                      <option disabled>Loading categories...</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} (ID: {cat.id})
                        </option>
                      ))
                    )}
                  </select>
                  {categories.length > 0 && (
                    <p className="text-xs text-slate-400" dir={dir}>
                      {categories.length} categories available. Select one to filter daily report projects.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    id="plankaDailyReportCategoryId"
                    type="text"
                    name="plankaDailyReportCategoryId"
                    defaultValue={config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || ''}
                    placeholder="e.g., 1637176448517146026"
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                    disabled
                  />
                  <p className="text-xs text-yellow-400" dir={dir}>
                    ⚠️ Please login to Planka above to select from available categories.
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-400" dir={dir}>
                If set, daily report tools will filter projects by this category instead of by name pattern.
              </p>
            </div>

            {/* OpenRouter API Key */}
            <div className="space-y-2">
              <label htmlFor="openrouterApiKey" className="text-sm font-medium text-white block" dir={dir}>
                {t.settings.openrouterKey}
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
                name="openrouterApiKey"
                defaultValue={config.OPENROUTER_API_KEY}
                placeholder="sk-or-v1-... (leave empty to use .env)"
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                {t.settings.maxToolCalls}
              </label>
              <input
                id="maxToolCalls"
                type="number"
                name="maxToolCalls"
                min="1"
                max="10"
                defaultValue={config.maxToolCalls}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-400" dir={dir}>
                Maximum rounds of tool calls the AI can make before responding (default: 5).
              </p>
            </div>

            {/* MCP Settings */}
            <div className="pt-4 border-t border-white/10 space-y-4">
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
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
                <p className="text-xs text-slate-400" dir={dir}>
                  Limit number of projects scanned when listing all users (default: 5). Set to 0 for unlimited.
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
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
                <p className="text-xs text-slate-400" dir={dir}>
                  Delay between processing each project (default: 100ms). Set to 0 for no delay.
                </p>
              </div>
            </div>

            {/* Debug & Monitoring Settings */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Debug & Monitoring</h3>
                  <p className="text-xs text-slate-400">Tools for debugging and monitoring AI behavior</p>
                </div>
              </div>

              {/* MCP Tool Logging */}
              <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4" dir={dir}>
                <input
                  id="mcpToolLogging"
                  type="checkbox"
                  name="mcpToolLogging"
                  defaultChecked={config.MCP_TOOL_LOGGING_ENABLED === 'true'}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500"
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
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500"
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
            </div>

            {/* Hardcoded Prompts Setting */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-start gap-3" dir={dir}>
                <input
                  id="useHardcodedPrompts"
                  type="checkbox"
                  name="useHardcodedPrompts"
                  defaultChecked={config.USE_HARDCODED_PROMPTS === 'true'}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
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

            {/* Chat Mode Setting */}
            <div className="pt-4 border-t border-white/10">
              <label className="text-sm font-medium text-white block mb-2" dir={dir}>
                Chat Mode
              </label>
              <select
                name="chatMode"
                defaultValue={config.CHAT_MODE}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              >
                <option value="thread">Thread Mode (Topics/Threads)</option>
                <option value="simple">Simple Mode (Single Chat)</option>
              </select>
              <p className="text-xs text-slate-400 mt-2" dir={dir}>
                <strong>Thread Mode (Default):</strong> Uses Telegram&apos;s threaded mode. Each conversation creates a new thread/topic. <code>/clear_chat</code> deletes the current thread.
                <br />
                <strong>Simple Mode:</strong> All chats in main private chat without threads. <code>/clear_chat</code> only clears AI history but keeps messages visible.
              </p>
            </div>

            {/* Chat History Configuration */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Conversation History</h3>
                  <p className="text-xs text-slate-400">Control how much conversation history is kept in memory</p>
                </div>
              </div>

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

              <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4" dir={dir}>
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
                    <strong>Recommended:</strong> Keep disabled for better performance. Tool results already exist in memory during execution.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
