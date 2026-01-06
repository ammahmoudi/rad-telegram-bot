/**
 * Simple translation helper for non-context functions
 * Uses Fluent files directly when ctx.t() is not available
 */
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find locales directory (works in both dev and production)
let localesDir = path.join(__dirname, '../locales');
if (!existsSync(localesDir)) {
  // Fallback for dev mode with tsx
  localesDir = path.join(__dirname, '../../src/locales');
}

console.log('[i18n-helper] Loading translations from:', localesDir);

// Load Fluent resources
const enPath = path.join(localesDir, 'en.ftl');
const faPath = path.join(localesDir, 'fa.ftl');

console.log('[i18n-helper] EN path:', enPath, '- exists:', existsSync(enPath));
console.log('[i18n-helper] FA path:', faPath, '- exists:', existsSync(faPath));

const enContent = readFileSync(enPath, 'utf-8');
const faContent = readFileSync(faPath, 'utf-8');

console.log('[i18n-helper] EN content length:', enContent.length);
console.log('[i18n-helper] FA content length:', faContent.length);

const enBundle = new FluentBundle('en');
const faBundle = new FluentBundle('fa');

enBundle.addResource(new FluentResource(enContent));
faBundle.addResource(new FluentResource(faContent));

const bundles: Record<string, FluentBundle> = {
  en: enBundle,
  fa: faBundle,
};

/**
 * Translate a key using Fluent bundles
 * Used in functions that don't have access to ctx
 */
export function t(language: string, key: string, params?: Record<string, string | number>): string {
  const bundle = bundles[language] || bundles['fa']; // Default to Persian
  const message = bundle.getMessage(key);
  
  if (!message || !message.value) {
    console.warn(`[i18n] Missing translation: ${language}.${key}`);
    return key;
  }
  
  const value = bundle.formatPattern(message.value, params || {});
  return value;
}
