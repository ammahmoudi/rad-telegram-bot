import { getPrisma } from './prisma.js';

/**
 * Get user's language preference with smart fallback
 * Priority: Manual override (DB) > Telegram language > Default (FA)
 * 
 * @param telegramUserId - User's Telegram ID
 * @param telegramLanguage - User's Telegram client language (optional)
 * @returns 'en' | 'fa'
 */
export async function getUserLanguage(
  telegramUserId: string,
  telegramLanguage?: string
): Promise<string> {
  const prefs = await getPrisma().userPreferences.findUnique({
    where: { telegramUserId },
  });
  
  // If user has manually set language in bot, use that (highest priority)
  if (prefs?.language) {
    return prefs.language;
  }
  
  // Otherwise, try to use Telegram's language
  if (telegramLanguage) {
    const lang = telegramLanguage.toLowerCase();
    // If Telegram is set to English, use English
    if (lang === 'en' || lang.startsWith('en-')) {
      return 'en';
    }
    // If Telegram is set to Persian/Farsi, use Farsi
    if (lang === 'fa' || lang === 'per' || lang === 'fas') {
      return 'fa';
    }
  }
  
  // Default to Persian (most common for this bot's users)
  return 'fa';
}

/**
 * Set user's language preference
 */
export async function setUserLanguage(telegramUserId: string, language: string): Promise<void> {
  await getPrisma().userPreferences.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      language,
      updatedAt: BigInt(Date.now()),
    },
    update: {
      language,
      updatedAt: BigInt(Date.now()),
    },
  });
}
