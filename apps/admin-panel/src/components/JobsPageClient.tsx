'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { JobsClient } from './JobsClient';

interface JobsPageClientProps {
  totalJobs: number;
  enabledJobs: number;
  recentExecutions: number;
  successRate: number;
}

export function JobsPageClient({
  totalJobs,
  enabledJobs,
  recentExecutions,
  successRate,
}: JobsPageClientProps) {
  const { t } = useLanguage();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t.jobs?.pageTitle || '📋 Scheduled Jobs'}
          </h1>
          <p className="text-slate-400">
            {t.jobs?.pageSubtitle || 'Manage automated tasks and scheduled notifications'}
          </p>
        </div>
        <a
          href="/jobs/new"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
        >
          {t.jobs?.createNew || '➕ New Job'}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{totalJobs}</div>
          <div className="text-slate-400 text-sm">
            {t.jobs?.stats?.totalJobs || 'Total Jobs'}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{enabledJobs}</div>
          <div className="text-slate-400 text-sm">
            {t.jobs?.stats?.activeJobs || 'Active Jobs'}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{recentExecutions}</div>
          <div className="text-slate-400 text-sm">
            {t.jobs?.stats?.executions24h || 'Executions (24h)'}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400">{successRate}%</div>
          <div className="text-slate-400 text-sm">
            {t.jobs?.stats?.successRate || 'Success Rate'}
          </div>
        </div>
      </div>

      <JobsClient />
    </div>
  );
}
