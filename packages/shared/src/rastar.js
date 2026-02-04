import { getRastarToken, upsertRastarToken } from './db.js';
export function getRastarConfig() {
    const baseUrl = process.env.RASTAR_SUPABASE_URL;
    const apiKey = process.env.RASTAR_SUPABASE_ANON_KEY;
    if (!baseUrl || !apiKey) {
        throw new Error('RASTAR_SUPABASE_URL and RASTAR_SUPABASE_ANON_KEY environment variables are required');
    }
    return {
        baseUrl,
        apiKey,
    };
}
/**
 * Store Rastar token response in database
 */
export async function storeRastarTokenResponse(telegramUserId, tokenResponse) {
    // Supabase returns expires_at as Unix timestamp in seconds, convert to milliseconds
    const expiresAtMs = tokenResponse.expires_at * 1000;
    await upsertRastarToken(telegramUserId, tokenResponse.access_token, tokenResponse.refresh_token, expiresAtMs, tokenResponse.user.id, tokenResponse.user.email);
}
/**
 * Get valid Rastar access token for a user, refreshing if needed
 * Returns null if no token exists or refresh fails
 */
export async function getValidRastarToken(telegramUserId) {
    const token = await getRastarToken(telegramUserId);
    if (!token)
        return null;
    // Check if token is still valid (with 5 minute buffer)
    const now = Date.now();
    if (token.expiresAt > now + 5 * 60 * 1000) {
        return {
            accessToken: token.accessToken,
            userId: token.userId,
        };
    }
    // Token expired or expiring soon, need to refresh
    try {
        const config = getRastarConfig();
        const response = await fetch(`${config.baseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: config.apiKey,
            },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
        });
        if (!response.ok) {
            return null;
        }
        const tokenResponse = await response.json();
        await storeRastarTokenResponse(telegramUserId, tokenResponse);
        return {
            accessToken: tokenResponse.access_token,
            userId: tokenResponse.user.id,
        };
    }
    catch (error) {
        console.error('Failed to refresh Rastar token:', error);
        return null;
    }
}
