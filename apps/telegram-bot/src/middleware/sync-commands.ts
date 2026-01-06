/**
 * Command Menu Sync Middleware
 * Syncs the Telegram command menu based on user's bot language preference
 */

import { Middleware } from 'grammy';
import { BotContext } from '../bot.js';
import { getUserLanguage } from '@rad/shared';

// Import command groups
import { userCommands, chatCommands, integrationCommands } from '../commands/index.js';

// Cache to avoid redundant API calls
const userCommandLanguageCache = new Map<number, 'en' | 'fa'>();

/**
 * Middleware that syncs command menu with user's bot language preference
 * This ensures commands appear in the language the user selected in bot settings
 */
export const syncCommandMenu: Middleware<BotContext> = async (ctx, next) => {
  // Only sync for private chats and when user is available
  if (ctx.chat?.type === 'private' && ctx.from?.id) {
    const userId = ctx.from.id;
    
    try {
      // Get user's language preference from bot database with Telegram fallback
      const telegramLanguage = ctx.from?.language_code;
      const userLanguage = await getUserLanguage(String(userId), telegramLanguage);
      const cachedLanguage = userCommandLanguageCache.get(userId);
      
      // Only update if language changed or not cached
      if (cachedLanguage !== userLanguage) {
        console.log(`[sync-commands] Updating command menu for user ${userId} to ${userLanguage}`);
        
        // Build commands array with proper language
        const commandsToSet = [];
        
        // Process command groups (chatCommands excluded as it's now empty)
        for (const group of [userCommands, integrationCommands]) {
          for (const cmd of group.commands) {
            // Get localized description for Farsi if user language is FA
            let description = cmd.description;
            
            if (userLanguage === 'fa') {
              // Grammy commands plugin stores localizations in the command object directly
              // Try multiple possible locations where localization might be stored
              const cmdAny = cmd as any;
              
              // Try _localizations property (most common)
              if (cmdAny._localizations && Array.isArray(cmdAny._localizations)) {
                const faLoc = cmdAny._localizations.find((loc: any) => loc.languageCode === 'fa');
                if (faLoc?.description) {
                  description = faLoc.description;
                }
              }
              // Try localizations property
              else if (cmdAny.localizations && Array.isArray(cmdAny.localizations)) {
                const faLoc = cmdAny.localizations.find((loc: any) => loc.languageCode === 'fa');
                if (faLoc?.description) {
                  description = faLoc.description;
                }
              }
              // Try _locales property
              else if (cmdAny._locales && Array.isArray(cmdAny._locales)) {
                const faLoc = cmdAny._locales.find((loc: any) => loc.languageCode === 'fa');
                if (faLoc?.description) {
                  description = faLoc.description;
                }
              }
              
              console.log(`[sync-commands] Command ${cmd.name}: FA description = ${description}`);
            }
            
            commandsToSet.push({
              command: typeof cmd.name === 'string' ? cmd.name : String(cmd.name),
              description: description
            });
          }
        }
        
        // Set commands for this specific user
        await ctx.api.setMyCommands(commandsToSet, {
          scope: { type: 'chat', chat_id: userId }
        });
        
        // Update cache
        userCommandLanguageCache.set(userId, userLanguage as 'en' | 'fa');
        
        console.log(`[sync-commands] ✓ Synced ${commandsToSet.length} commands in ${userLanguage} for user ${userId}`);
      }
    } catch (err) {
      console.error('[sync-commands] Failed to sync command menu:', err);
      // Don't block the request if sync fails
    }
  }
  
  await next();
};

/**
 * Clear cache for a specific user (call this when user changes language)
 */
export function clearCommandCache(userId: number) {
  userCommandLanguageCache.delete(userId);
  console.log(`[sync-commands] Cache cleared for user ${userId}`);
}
