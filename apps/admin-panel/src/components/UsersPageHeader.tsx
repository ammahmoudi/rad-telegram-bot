'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function UsersPageHeader() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">
        {t.users.title} 👥
      </h1>
      <p className="text-slate-300">
        {t.users.subtitle}
      </p>
    </div>
  );
}
