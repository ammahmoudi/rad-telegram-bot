import { getPrisma } from './prisma.js';

/**
 * Get user's language preference
 */
export async function getUserLanguage(telegramUserId: string): Promise<string> {
  const prefs = await getPrisma().userPreferences.findUnique({
    where: { telegramUserId },
  });
  return prefs?.language || 'fa'; // Default to Persian
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
