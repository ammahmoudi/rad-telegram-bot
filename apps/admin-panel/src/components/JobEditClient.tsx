'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CronScheduler } from './CronScheduler';
import { UserMultiSelect } from './UserMultiSelect';
import { PackMultiSelect } from './PackMultiSelect';
import { TIMEZONES } from '../lib/job-utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserOption {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  role: string;
  packId?: string | null;
  packName?: string | null;
}

interface PackOption {
  id: string;
  name: string;
}

interface JobDetail {
  name: string;
  displayName: string;
  description?: string | null;
  schedule: string;
  timezone: string;
  enabled: boolean;
  jobKey: string;
  jobType: string;
  config: Record<string, unknown>;
  targets: {
    includeUsers: string[];
    excludeUsers: string[];
    packIds: string[];
  };
}

export function JobEditClient({ jobName }: { jobName: string }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [packs, setPacks] = useState<PackOption[]>([]);

  const [job, setJob] = useState<JobDetail | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [enabled, setEnabled] = useState(true);
  const [jobType, setJobType] = useState<'coded' | 'custom-message'>('coded');
  const [jobKey, setJobKey] = useState('');

  const [messageText, setMessageText] = useState('');
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown' | 'MarkdownV2'>('HTML');
  const [silent, setSilent] = useState(false);

  const [configJson, setConfigJson] = useState('{}');

  const [includeUsers, setIncludeUsers] = useState<string[]>([]);
  const [excludeUsers, setExcludeUsers] = useState<string[]>([]);
  const [packIds, setPackIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [jobRes, usersRes, packsRes] = await Promise.all([
          fetch(`/api/jobs/${jobName}`),
          fetch('/api/users'),
          fetch('/api/packs'),
        ]);

        if (!jobRes.ok || !usersRes.ok || !packsRes.ok) {
          throw new Error(t.jobs?.errors?.loadJobData || 'Failed to load job data');
        }

        const jobData = await jobRes.json();
        const usersData = await usersRes.json();
        const packsData = await packsRes.json();

        const jobDetail = jobData.job as JobDetail;
        setJob(jobDetail);

        setDisplayName(jobDetail.displayName);
        setDescription(jobDetail.description ?? '');
        setSchedule(jobDetail.schedule);
        setTimezone(jobDetail.timezone);
        setEnabled(jobDetail.enabled);
        setJobType((jobDetail.jobType as any) || 'coded');
        setJobKey(jobDetail.jobKey);

        const cfg = jobDetail.config ?? {};
        if (jobDetail.jobType === 'custom-message') {
          setMessageText(String(cfg.message ?? ''));
          setParseMode((cfg.parseMode as any) || 'HTML');
          setSilent(Boolean(cfg.silent));
        } else {
          setConfigJson(JSON.stringify(cfg, null, 2));
        }

        setIncludeUsers(jobDetail.targets?.includeUsers ?? []);
        setExcludeUsers(jobDetail.targets?.excludeUsers ?? []);
        setPackIds(jobDetail.targets?.packIds ?? []);

        setUsers(usersData.users ?? []);
        setPacks((packsData.packs ?? []).map((p: any) => ({ id: p.id, name: p.name })));
      } catch (err) {
        setError(err instanceof Error ? err.message : (t.jobs?.errors?.loadJobData || 'Failed to load job data'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jobName]);

  const includeSet = useMemo(() => new Set(includeUsers), [includeUsers]);
  const excludeSet = useMemo(() => new Set(excludeUsers), [excludeUsers]);

  const selectedUserLabel = (u: UserOption) => {
    const nameParts = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return nameParts || u.username || u.id;
  };

  const toggleIncludeUser = (id: string) => {
    setIncludeUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExcludeUser = (id: string) => {
    setExcludeUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const togglePack = (id: string) => {
    setPackIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      let config: Record<string, unknown> = {};
      if (jobType === 'custom-message') {
        config = {
          message: messageText,
          parseMode,
          silent,
        };
      } else {
        config = JSON.parse(configJson || '{}');
      }

      const res = await fetch(`/api/jobs/${jobName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          timezone,
          enabled,
          jobKey,
          jobType,
          config,
          targets: {
            includeUsers,
            excludeUsers,
            packIds,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || (t.jobs?.errors?.updateFailed || 'Failed to update job'));
      }

      window.location.href = '/jobs';
    } catch (err) {
      setError(err instanceof Error ? err.message : (t.jobs?.errors?.updateFailed || 'Failed to update job'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.displayName || 'Display Name'}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.jobName || 'Job Name'}</label>
            <input
              value={job.name}
              readOnly
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-slate-400"
            />
          </div>
          <div className="md:col-span-2">
            <CronScheduler
              value={schedule}
              onChange={setSchedule}
              timezone={timezone}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.timezone || 'Timezone'}</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {t.jobs?.timezones?.[tz.labelKey] || tz.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-2">{t.jobs?.description || 'Description'}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            {t.jobs?.enabled || 'Enabled'}
          </label>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm font-medium text-slate-200 mb-3">{t.jobs?.jobType || 'Job Type'}</div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
              <input
                type="radio"
                name="jobType"
                value="custom-message"
                checked={jobType === 'custom-message'}
                onChange={() => setJobType('custom-message')}
                className="mt-1"
              />
              <div>
                <div className="text-slate-200 font-medium">{t.jobs?.customMessage || 'Custom Message'}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {t.jobs?.jobTypeHelp?.customMessage || 'Send a custom text message to users. Perfect for announcements, reminders, and broadcasts.'}
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
              <input
                type="radio"
                name="jobType"
                value="coded"
                checked={jobType === 'coded'}
                onChange={() => setJobType('coded')}
                className="mt-1"
              />
              <div>
                <div className="text-slate-200 font-medium">{t.jobs?.codedJob || 'Coded Job'}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {t.jobs?.jobTypeHelp?.codedJob || 'Execute pre-programmed job logic (e.g., check food selection, send reports). Advanced features with custom logic.'}
                </div>
              </div>
            </label>
          </div>
        </div>

        {jobType === 'custom-message' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">{t.jobs?.messageText || 'Message Text'}</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full min-h-[120px] bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-slate-300">{t.jobs?.parseMode || 'Parse Mode'}</label>
              <select
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value as any)}
                className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="HTML">{t.jobs?.parseModeHtml || 'HTML'}</option>
                <option value="Markdown">{t.jobs?.parseModeMarkdown || 'Markdown'}</option>
                <option value="MarkdownV2">{t.jobs?.parseModeMarkdownV2 || 'MarkdownV2'}</option>
              </select>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" checked={silent} onChange={(e) => setSilent(e.target.checked)} />
                {t.jobs?.silent || 'Silent'}
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">{t.jobs?.jobKey || 'Job Key'}</label>
              <input
                value={jobKey}
                onChange={(e) => setJobKey(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">{t.jobs?.configJson || 'Configuration (JSON)'}</label>
              <textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="w-full min-h-[120px] bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">{t.jobs?.targetUsers || 'Target Users'}</h3>
          {includeUsers.length === 0 && excludeUsers.length === 0 && packIds.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full">
              <span className="text-sm text-blue-300">{t.jobs?.allUsersHint || '⚡ All users will receive this'}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <UserMultiSelect
              users={users}
              selectedIds={includeUsers}
              onChange={setIncludeUsers}
              label={t.jobs?.includeUsers || 'Include Users'}
              placeholder={t.jobs?.includeUsersPlaceholder || 'Search and select users...'}
            />
          </div>

          <div>
            <UserMultiSelect
              users={users}
              selectedIds={excludeUsers}
              onChange={setExcludeUsers}
              label={t.jobs?.excludeUsers || 'Exclude Users'}
              placeholder={t.jobs?.excludeUsersPlaceholder || 'Search users to exclude...'}
            />
            <p className="text-xs text-slate-500 mt-2">{t.jobs?.excludeUsersHelp || 'Excluded users are removed from the target list.'}</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <PackMultiSelect
            packs={packs}
            selectedIds={packIds}
            onChange={setPackIds}
            label={t.jobs?.targetPacks || 'Target Character Packs'}
          />
          <p className="text-xs text-slate-500 mt-2">
            {t.jobs?.targetPacksHelp || 'All users in selected packs will be targeted (combined with include/exclude rules).'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/jobs" className="text-slate-400 hover:text-white">{t.jobs?.actions?.backToJobs || '← Back to Jobs'}</Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
        >
          {saving ? (t.jobs?.actions?.saving || 'Saving...') : (t.jobs?.actions?.saveChanges || 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
