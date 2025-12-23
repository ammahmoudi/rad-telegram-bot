import i18next from 'i18next';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translation files
const fa = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'fa.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'en.json'), 'utf-8'));

// Initialize i18next
await i18next.init({
  lng: 'fa', // Default language is Persian
  fallbackLng: 'en',
  resources: {
    fa: { translation: fa },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Get translation function for a specific user's language
 */
export function getUserI18n(language: string = 'fa') {
  const instance = i18next.cloneInstance({ lng: language });
  return instance.t.bind(instance);
}

/**
 * Get default i18n instance (Persian)
 */
export function getI18n() {
  return i18next.t.bind(i18next);
}

/**
 * Change language for a user
 */
export function changeLanguage(language: 'fa' | 'en') {
  return i18next.changeLanguage(language);
}

export default i18next;
