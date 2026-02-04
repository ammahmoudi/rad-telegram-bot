'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TIMEZONES } from '../lib/job-utils';

interface JobExecution {
  id: string;
  status: string;
  startedAt: number;
  completedAt: number | null;
  durationMs: number | null;
  usersAffected: number;
  error: string | null;
}

interface Job {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  schedule: string;
  timezone: string;
  enabled: boolean;
  config: Record<string, unknown>;
  lastRunAt: number | null;
  nextRunAt: number | null;
  lastExecution: JobExecution | null;
}

function formatDate(timestamp: number | null, locale: string): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDuration(ms: number | null, t: any): string {
  if (!ms) return '-';
  const units = t?.jobs?.units;
  const msLabel = units?.ms || 'ms';
  const secLabel = units?.secondsShort || 's';
  const minLabel = units?.minutesShort || 'm';
  if (ms < 1000) return `${ms}${msLabel}`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}${secLabel}`;
  return `${Math.floor(ms / 60000)}${minLabel} ${Math.floor((ms % 60000) / 1000)}${secLabel}`;
}

function getStatusBadge(status: string, t: any): { color: string; label: string } {
  const labels = t?.jobs?.executionStatus;
  switch (status) {
    case 'success':
      return { color: 'bg-green-500/20 text-green-400', label: `✓ ${labels?.success || 'Success'}` };
    case 'failed':
      return { color: 'bg-red-500/20 text-red-400', label: `✕ ${labels?.failed || 'Failed'}` };
    case 'running':
      return { color: 'bg-blue-500/20 text-blue-400', label: `⟳ ${labels?.running || 'Running'}` };
    case 'pending':
      return { color: 'bg-yellow-500/20 text-yellow-400', label: `⏳ ${labels?.pending || 'Pending'}` };
    default:
      return { color: 'bg-slate-500/20 text-slate-400', label: status };
  }
}

export function JobsClient() {
  const { language, t } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(t.jobs?.errors?.fetchJobs || 'Failed to fetch jobs');
      const data = await res.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.jobs?.errors?.unknown || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function triggerJob(jobName: string) {
    try {
      setTriggeringJob(jobName);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', jobName }),
      });
      if (!res.ok) throw new Error(t.jobs?.errors?.triggerFailed || 'Failed to trigger job');
      // Refresh jobs list
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.jobs?.errors?.triggerFailed || 'Failed to trigger job'));
    } finally {
      setTriggeringJob(null);
    }
  }

  async function toggleJob(job: Job) {
    try {
      const res = await fetch(`/api/jobs/${job.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      });
      if (!res.ok) throw new Error(t.jobs?.errors?.updateFailed || 'Failed to update job');
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.jobs?.errors?.updateFailed || 'Failed to update job'));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        <p className="font-medium">{t.jobs?.errors?.loadTitle || 'Error loading jobs'}</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchJobs}
          className="mt-3 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-lg text-sm"
        >
          {t.jobs?.actions?.retry || 'Retry'}
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-lg">{t.jobs?.empty?.title || 'No scheduled jobs configured'}</p>
        <p className="text-sm mt-2">{t.jobs?.empty?.subtitle || 'Jobs will appear here once the scheduler is initialized'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{job.displayName}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {job.enabled ? (t.jobs?.enabled || 'Enabled') : (t.jobs?.disabled || 'Disabled')}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{job.description}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">⏰ {t.jobs?.schedule || 'Schedule'}:</span>
                  <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                    {job.schedule}
                  </code>
                  <span className="text-slate-500 text-xs">({job.timezone})</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📅 {t.jobs?.nextRun || 'Next Run'}:</span>
                  <span>{formatDate(job.nextRunAt, language)}</span>
                </div>
                
                {job.lastRunAt && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-500">🕐 {t.jobs?.lastRun || 'Last Run'}:</span>
                    <span>{formatDate(job.lastRunAt, language)}</span>
                  </div>
                )}
              </div>

              {job.lastExecution && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        getStatusBadge(job.lastExecution.status, t).color
                      }`}
                    >
                      {getStatusBadge(job.lastExecution.status, t).label}
                    </span>
                    <span className="text-slate-400">
                      {t.jobs?.duration || 'Duration'}: {formatDuration(job.lastExecution.durationMs, t)}
                    </span>
                    <span className="text-slate-400">
                      {t.jobs?.usersAffected || 'Users affected'}: {job.lastExecution.usersAffected}
                    </span>
                    {job.lastExecution.error && (
                      <span className="text-red-400 text-xs truncate max-w-xs">
                        {job.lastExecution.error}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              <a
                href={`/jobs/${job.name}`}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                title={t.jobs?.actions?.edit || 'Edit job'}
              >
                ✏️
              </a>
              <button
                onClick={() => toggleJob(job)}
                className={`p-2 rounded-lg transition-colors ${
                  job.enabled
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400'
                }`}
                title={job.enabled ? (t.jobs?.actions?.disable || 'Disable job') : (t.jobs?.actions?.enable || 'Enable job')}
              >
                {job.enabled ? '⏸' : '▶️'}
              </button>
              <button
                onClick={() => triggerJob(job.name)}
                disabled={triggeringJob === job.name || !job.enabled}
                className={`p-2 rounded-lg transition-colors ${
                  triggeringJob === job.name
                    ? 'bg-blue-500/20 text-blue-400 cursor-wait'
                    : job.enabled
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                    : 'bg-slate-500/10 text-slate-500 cursor-not-allowed'
                }`}
                title={t.jobs?.actions?.runNow || 'Run now'}
              >
                {triggeringJob === job.name ? '⟳' : '▶'}
              </button>
              <button
                onClick={() => setSelectedJob(job)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={t.jobs?.actions?.viewDetails || 'View details'}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Job details modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={fetchJobs}
        />
      )}
    </div>
  );
}

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
  onUpdate: () => void;
}

function JobDetailsModal({ job, onClose, onUpdate }: JobDetailsModalProps) {
  const { language, t } = useLanguage();
  const [schedule, setSchedule] = useState(job.schedule);
  const [timezone, setTimezone] = useState(job.timezone);
  const [config, setConfig] = useState(JSON.stringify(job.config, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  useEffect(() => {
    loadExecutions();
  }, [job.name]);

  async function loadExecutions() {
    try {
      setLoadingExecutions(true);
      const res = await fetch(`/api/jobs/${job.name}`);
      if (!res.ok) throw new Error(t.jobs?.errors?.loadExecutions || 'Failed to load executions');
      const data = await res.json();
      setExecutions(data.job.executions || []);
    } catch (err) {
      console.error(t.jobs?.errors?.loadExecutionsLog || 'Failed to load executions:', err);
    } finally {
      setLoadingExecutions(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      let parsedConfig;
      try {
        parsedConfig = JSON.parse(config);
      } catch {
        setError(t.jobs?.errors?.invalidJson || 'Invalid JSON in config');
        return;
      }

      const res = await fetch(`/api/jobs/${job.name}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, timezone, config: parsedConfig }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (t.jobs?.errors?.saveFailed || 'Failed to save'));
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.jobs?.errors?.saveFailed || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{job.displayName}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-1">{job.description}</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Schedule config */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t.jobs?.details?.scheduleConfig || 'Schedule Configuration'}</h3>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t.jobs?.details?.cronSchedule || 'Cron Schedule'}
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
                placeholder={t.jobs?.details?.cronPlaceholder || '0 22 * * *'}
              />
              <p className="text-xs text-slate-500 mt-1">
                {t.jobs?.details?.cronHelp || 'Format: minute hour day month weekday (e.g., "0 22 * * *" = 10 PM daily)'}
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t.jobs?.timezone || 'Timezone'}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {t.jobs?.timezones?.[tz.labelKey] || tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t.jobs?.details?.jobConfigJson || 'Job Configuration (JSON)'}
              </label>
              <textarea
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm h-32"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white font-medium transition-colors"
            >
              {saving ? (t.jobs?.actions?.saving || 'Saving...') : (t.jobs?.actions?.saveChanges || 'Save Changes')}
            </button>
          </div>

          {/* Execution history */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t.jobs?.details?.executionHistory || 'Execution History'}</h3>
            
            {loadingExecutions ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              </div>
            ) : executions.length === 0 ? (
              <p className="text-slate-400 text-sm">{t.jobs?.details?.noExecutions || 'No executions yet'}</p>
            ) : (
              <div className="space-y-2">
                {executions.slice(0, 10).map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          getStatusBadge(exec.status, t).color
                        }`}
                      >
                          {getStatusBadge(exec.status, t).label}
                      </span>
                      <span className="text-slate-300">
                        {formatDate(exec.startedAt, language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>{formatDuration(exec.durationMs, t)}</span>
                      <span>👥 {exec.usersAffected}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
