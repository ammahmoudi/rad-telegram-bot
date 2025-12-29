'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function PacksPageHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">
        {t.packs.title} 🎭
      </h1>
      <p className="text-slate-300">
        {t.packs.subtitle}
      </p>
    </div>
  );
}
