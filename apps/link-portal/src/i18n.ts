import enTranslations from './locales/en.json' assert { type: 'json' };
import faTranslations from './locales/fa.json' assert { type: 'json' };

type Translations = typeof enTranslations;

const translations: Record<string, Translations> = {
  en: enTranslations,
  fa: faTranslations,
};

/**
 * Get translation function for a specific language
 */
export function getTranslations(language: string = 'fa'): Translations {
  return translations[language] || translations.fa;
}

/**
 * Simple template replacement for translation strings
 * Replaces {{key}} with values from params object
 */
export function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
}

/**
 * Get a translated message with optional parameter interpolation
 */
export function t(language: string, key: string, params?: Record<string, string>): string {
  const translations = getTranslations(language);
  const keys = key.split('.');
  
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`[i18n] Missing translation key: ${key} for language: ${language}`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`[i18n] Translation value is not a string: ${key}`);
    return key;
  }
  
  return interpolate(value, params);
}
