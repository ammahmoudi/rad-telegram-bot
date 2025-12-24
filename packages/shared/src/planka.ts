import { getPlankaToken } from './db.js';

/**
 * Validate if a Planka token is working by making a test API call
 * Returns true if token is valid, false otherwise
 */
export async function validatePlankaToken(
  telegramUserId: string
): Promise<boolean> {
  const token = await getPlankaToken(telegramUserId);
  if (!token) return false;

  try {
    // Try to fetch current user profile as a simple validation check
    const response = await fetch(`${token.plankaBaseUrl}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[validatePlankaToken] Error:', error);
    return false;
  }
}
