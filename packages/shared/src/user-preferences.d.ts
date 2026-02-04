/**
 * Get user's language preference with smart fallback
 * Priority: Manual override (DB) > Telegram language > Default (FA)
 *
 * @param telegramUserId - User's Telegram ID
 * @param telegramLanguage - User's Telegram client language (optional)
 * @returns 'en' | 'fa'
 */
export declare function getUserLanguage(telegramUserId: string, telegramLanguage?: string): Promise<string>;
/**
 * Set user's language preference
 */
export declare function setUserLanguage(telegramUserId: string, language: string): Promise<void>;
