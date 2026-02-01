/**
 * Central Button Registry
 * Single source of truth for all keyboard buttons
 * Used for: rendering keyboards, detecting button clicks, translations
 * 
 * If you add a button here, it's automatically:
 * - Translated via the translation key
 * - Available for keyboard building
 * - Recognized as a system command (won't be sent to AI)
 */

export interface ButtonDefinition {
  id: string;
  translationKey: string;
  emoji: string;
  category: 'status' | 'action' | 'settings' | 'navigation';
}

/**
 * All buttons in the system
 * Defines button ID, translation key, emoji, and category
 */
export const BUTTON_REGISTRY: ButtonDefinition[] = [
  // Status buttons
  { id: 'planka-status', translationKey: 'buttons-planka-status', emoji: '📊', category: 'status' },
  { id: 'rastar-status', translationKey: 'buttons-rastar-status', emoji: '🍽️', category: 'status' },
  
  // Connection buttons
  { id: 'connect-planka', translationKey: 'buttons-connect-planka', emoji: '📋', category: 'action' },
  { id: 'connect-rastar', translationKey: 'buttons-connect-rastar', emoji: '🍽️', category: 'action' },
  
  // Chat actions
  { id: 'new-chat', translationKey: 'buttons-new-chat', emoji: '💬', category: 'action' },
  { id: 'clear-chat', translationKey: 'buttons-clear-chat', emoji: '🗑️', category: 'action' },
  { id: 'history', translationKey: 'buttons-history', emoji: '📚', category: 'action' },
  
  // Settings
  { id: 'settings', translationKey: 'buttons-settings', emoji: '⚙️', category: 'settings' },
];

/**
 * Get all button translation keys
 * Useful for pre-loading translations
 */
export function getAllButtonTranslationKeys(): string[] {
  return BUTTON_REGISTRY.map(btn => btn.translationKey);
}

/**
 * Get all system emojis (used for fallback detection)
 */
export function getAllSystemEmojis(): string[] {
  return [...new Set(BUTTON_REGISTRY.map(btn => btn.emoji))];
}

/**
 * Get a button definition by ID
 */
export function getButtonById(id: string): ButtonDefinition | undefined {
  return BUTTON_REGISTRY.find(btn => btn.id === id);
}

/**
 * Get buttons by category
 */
export function getButtonsByCategory(category: ButtonDefinition['category']): ButtonDefinition[] {
  return BUTTON_REGISTRY.filter(btn => btn.category === category);
}
