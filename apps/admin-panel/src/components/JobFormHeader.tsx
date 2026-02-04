'use client';

import { useLanguage } from '@/contexts/LanguageContext';

type JobFormHeaderMode = 'create' | 'edit';

interface JobFormHeaderProps {
  mode: JobFormHeaderMode;
}

export function JobFormHeader({ mode }: JobFormHeaderProps) {
  const { t } = useLanguage();

  const title =
    mode === 'create'
      ? t.jobs?.createTitle || '✨ Create Job'
      : t.jobs?.editTitle || '🛠️ Edit Job';

  const subtitle =
    mode === 'create'
      ? t.jobs?.createSubtitle || 'Create custom or coded jobs with targeting rules'
      : t.jobs?.editSubtitle || 'Adjust schedule, config, and targeting';

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-400">{subtitle}</p>
    </div>
  );
}
