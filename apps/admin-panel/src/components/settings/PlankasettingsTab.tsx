'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PlankaSettingsTabProps {
  config: {
    PLANKA_BASE_URL: string;
    PLANKA_AUTH_TOKEN: string;
    PLANKA_DAILY_REPORT_CATEGORY_ID: string;
  };
  envPlankaUrl?: string;
  envDailyReportCategoryId?: string;
  dir: string;
}

interface Category {
  id: string;
  name: string;
}

export function PlankaSettingsTab({
  config,
  envPlankaUrl,
  envDailyReportCategoryId,
  dir,
}: PlankaSettingsTabProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || ''
  );
  const [plankaConnected, setPlankaConnected] = useState(false);
  const [plankaStatusLoading, setPlankaStatusLoading] = useState(false);
  const [plankaStatusError, setPlankaStatusError] = useState<string | null>(null);

  useEffect(() => {
    checkPlankaStatus();
  }, []);

  useEffect(() => {
    if (config.PLANKA_AUTH_TOKEN) {
      checkPlankaStatus();
    }
  }, [config.PLANKA_AUTH_TOKEN]);

  useEffect(() => {
    if (config.PLANKA_AUTH_TOKEN && plankaConnected) {
      fetchCategories();
    }
  }, [config.PLANKA_AUTH_TOKEN, plankaConnected]);

  useEffect(() => {
    setSelectedCategory(config.PLANKA_DAILY_REPORT_CATEGORY_ID || envDailyReportCategoryId || '');
  }, [config.PLANKA_DAILY_REPORT_CATEGORY_ID, envDailyReportCategoryId]);

  const checkPlankaStatus = async () => {
    setPlankaStatusLoading(true);
    try {
      const response = await fetch('/api/planka-status');
      const data = await response.json();
      if (response.ok && data.connected) {
        setPlankaConnected(true);
        setPlankaStatusError(null);
      } else {
        setPlankaConnected(false);
        setPlankaStatusError(data.reason || 'Not connected');
      }
    } catch (error) {
      setPlankaConnected(false);
      setPlankaStatusError('Failed to check connection');
      console.error('Failed to check Planka status:', error);
    } finally {
      setPlankaStatusLoading(false);
    }
  };

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
        toast.success('✓ Successfully authenticated with Planka!', { id: loadingToast });
        (e.target as HTMLFormElement).reset();
        setShowLoginModal(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`✗ ${data.error || 'Login failed'}`, { id: loadingToast });
      }
    } catch (error) {
      toast.error('✗ Failed to connect to server', {
        id: loadingToast,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Planka Base URL */}
      <div className="space-y-2">
        <label htmlFor="plankaBaseUrl" className="text-sm font-medium text-white block" dir={dir}>
          Planka Server URL
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
          placeholder="https://planka.example.com"
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir="ltr"
          required
        />
        <p className="text-xs text-slate-400" dir={dir}>
          This URL will be used for all new Planka account links. Existing links are not affected.
        </p>
      </div>

      {/* Planka Authentication Button */}
      <div className="p-4 bg-white/5 rounded-lg border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-white">Planka Authentication</h3>
              {plankaStatusLoading ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                  🔄 Checking...
                </span>
              ) : plankaConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                  ✓ Connected
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full border border-red-500/30"
                  title={plankaStatusError || 'Not connected'}
                >
                  ✗ Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {plankaStatusLoading
                ? 'Verifying connection...'
                : plankaConnected
                  ? 'Connected to Planka. Click to re-login if needed.'
                  : `${plankaStatusError || 'Not connected'}. Login to enable project category fetching.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
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
        <select
          id="plankaDailyReportCategoryId"
          name="plankaDailyReportCategoryId"
          title="Select a Planka project category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          dir="ltr"
          disabled={!plankaConnected || categoriesLoading}
        >
          <option value="">-- No category (filter by project name) --</option>
          {plankaConnected && categories.length === 0 && !categoriesLoading && (
            <option disabled>No categories available</option>
          )}
          {categoriesLoading && <option disabled>Loading categories...</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} (ID: {cat.id})
            </option>
          ))}
        </select>
        {!plankaConnected && (
          <p className="text-xs text-red-400" dir={dir}>
            ✗ Disabled: Please connect to Planka first to view available categories.
          </p>
        )}
        {plankaConnected && categories.length > 0 && (
          <p className="text-xs text-slate-400" dir={dir}>
            {categories.length} categories available. Select one to filter daily report projects.
          </p>
        )}
        {plankaConnected && categories.length === 0 && !categoriesLoading && (
          <p className="text-xs text-amber-400" dir={dir}>
            ⚠️ No categories found. You may need to create some in Planka first.
          </p>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Planka Login</h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePlankaLogin} className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Login with your Planka credentials to enable project category fetching.</p>

              <div className="space-y-2">
                <label htmlFor="modalPlankaUsername" className="text-sm font-medium text-gray-300 block">
                  Username or Email
                </label>
                <input
                  id="modalPlankaUsername"
                  type="text"
                  name="plankaUsername"
                  placeholder="username or email@example.com"
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginLoading ? '🔄 Logging in...' : '🔐 Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
