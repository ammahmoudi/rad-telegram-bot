export interface RastarConfig {
    baseUrl: string;
    apiKey: string;
}
export declare function getRastarConfig(): RastarConfig;
export interface RastarTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        [key: string]: any;
    };
}
/**
 * Store Rastar token response in database
 */
export declare function storeRastarTokenResponse(telegramUserId: string, tokenResponse: RastarTokenResponse): Promise<void>;
/**
 * Get valid Rastar access token for a user, refreshing if needed
 * Returns null if no token exists or refresh fails
 */
export declare function getValidRastarToken(telegramUserId: string): Promise<{
    accessToken: string;
    userId: string;
} | null>;
