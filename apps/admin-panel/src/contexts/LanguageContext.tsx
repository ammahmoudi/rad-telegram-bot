'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKey;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fa');

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'fa' || saved === 'en')) {
      setLanguage(saved);
    }
  }, []);

  // Save language to localStorage when it changes
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t: translations[language],
    dir: language === 'fa' ? 'rtl' : 'ltr',
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={value.dir} className="h-full">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
