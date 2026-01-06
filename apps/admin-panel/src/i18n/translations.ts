import enTranslations from './locales/en.json';
import faTranslations from './locales/fa.json';

export type Language = 'fa' | 'en';

export const translations = {
  en: enTranslations,
  fa: faTranslations,
} as const;

export type TranslationKey = typeof enTranslations;
