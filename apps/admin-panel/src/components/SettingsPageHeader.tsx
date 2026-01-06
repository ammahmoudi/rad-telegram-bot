'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function SettingsPageHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">{t.settings.title}</h1>
      <p className="text-slate-400 mt-2">{t.settings.subtitle}</p>
    </div>
  );
}
