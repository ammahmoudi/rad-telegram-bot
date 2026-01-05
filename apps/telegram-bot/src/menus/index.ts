/**
 * Modern Menu System using @grammyjs/menu
 * Uses proper inline keyboards instead of fake AI messages
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../bot.js';

/**
 * Main Menu - Shows only Settings and account connections
 */
export const mainMenu = new Menu<BotContext>('main-menu')
  .text(
    (ctx) => {
      const status = ctx.session.plankaLinked ? '✅' : '⚠️';
      return `${status} ${ctx.t('menu-planka') || '📋 Planka'}`;
    },
    async (ctx) => {
      await ctx.answerCallbackQuery();
      const { showPlankaStatus } = await import('../handlers/commands/planka.js');
      await showPlankaStatus(ctx);
    }
  )
  .row()
  .text(
    (ctx) => {
      const status = ctx.session.rastarLinked ? '✅' : '⚠️';
      return `${status} ${ctx.t('menu-rastar') || '🍽️ Rastar'}`;
    },
    async (ctx) => {
      await ctx.answerCallbackQuery();
      const { showRastarStatus } = await import('../handlers/commands/rastar.js');
      await showRastarStatus(ctx);
    }
  )
  .row()
  .text(
    (ctx) => ctx.t('menu-settings') || '⚙️ Settings',
    async (ctx) => {
      ctx.menu.nav('settings-menu');
      await ctx.answerCallbackQuery();
    }
  );

/**
 * Menu buttons now call the single source functions from command handlers
 */

/**
 * Settings Menu with language, connections, and notifications
 */
const settingsMenu = new Menu<BotContext>('settings-menu')
  .text('🌐 Language / زبان', (ctx) => {
    ctx.menu.nav('language-menu');
    ctx.answerCallbackQuery();
  })
  .row()
  .text(
    (ctx) => {
      const status = ctx.session.plankaLinked ? '✅' : '⚠️';
      return `${status} ${ctx.t('settings-planka-connection') || '📋 Planka'}`;
    },
    async (ctx) => {
      await ctx.answerCallbackQuery();
      const { showPlankaStatus } = await import('../handlers/commands/planka.js');
      await showPlankaStatus(ctx);
    }
  )
  .row()
  .text(
    (ctx) => {
      const status = ctx.session.rastarLinked ? '✅' : '⚠️';
      return `${status} ${ctx.t('settings-rastar-connection') || '🍽️ Rastar'}`;
    },
    async (ctx) => {
      await ctx.answerCallbackQuery();
      const { showRastarStatus } = await import('../handlers/commands/rastar.js');
      await showRastarStatus(ctx);
    }
  )
  .row()
  .text(
    (ctx) => {
      const icon = ctx.session.notificationsEnabled !== false ? '🔔' : '🔕';
      return `${icon} ${ctx.t('settings-notifications') || 'Notifications'}`;
    },
    async (ctx) => {
      ctx.session.notificationsEnabled = !(ctx.session.notificationsEnabled !== false);
      const status = ctx.session.notificationsEnabled ? ctx.t('settings-notifications-enabled') : ctx.t('settings-notifications-disabled');
      await ctx.answerCallbackQuery({ text: status || `Notifications ${ctx.session.notificationsEnabled ? 'enabled' : 'disabled'}!` });
      ctx.menu.update();
    }
  )
  .row()
  .text('« Back', (ctx) => {
    ctx.menu.nav('main-menu');
    ctx.answerCallbackQuery();
  });

/**
 * Language Selection Menu
 */
const languageMenu = new Menu<BotContext>('language-menu')
  .text('🇬🇧 English', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramUserId = String(ctx.from?.id || '');
    const { setUserLanguage } = await import('@rad/shared');
    await setUserLanguage(telegramUserId, 'en');
    ctx.session.language = 'en';
    
    // Clear cache and immediately sync commands with new language
    const { clearCommandCache } = await import('../middleware/sync-commands.js');
    const { userCommands, integrationCommands } = await import('../commands/index.js');
    clearCommandCache(ctx.from?.id || 0);
    
    // Build and set commands in English immediately
    const commandsToSet = [];
    for (const group of [userCommands, integrationCommands]) {
      for (const cmd of group.commands) {
        commandsToSet.push({
          command: typeof cmd.name === 'string' ? cmd.name : String(cmd.name),
          description: cmd.description // English is default
        });
      }
    }
    
    await ctx.api.setMyCommands(commandsToSet, {
      scope: { type: 'chat', chat_id: ctx.from?.id || 0 }
    });
    
    await ctx.reply('✅ Language changed to English\n\n💡 <i>This overrides your Telegram language setting for this bot only.</i>', { parse_mode: 'HTML' });
    ctx.menu.nav('settings-menu');
  })
  .row()
  .text('🇮🇷 فارسی', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramUserId = String(ctx.from?.id || '');
    const { setUserLanguage } = await import('@rad/shared');
    await setUserLanguage(telegramUserId, 'fa');
    ctx.session.language = 'fa';
    
    // Clear cache and immediately sync commands with new language
    const { clearCommandCache } = await import('../middleware/sync-commands.js');
    const { userCommands, integrationCommands } = await import('../commands/index.js');
    clearCommandCache(ctx.from?.id || 0);
    
    // Build and set commands in Farsi immediately
    const commandsToSet = [];
    for (const group of [userCommands, integrationCommands]) {
      for (const cmd of group.commands) {
        let description = cmd.description;
        
        // Get Farsi localization
        const cmdAny = cmd as any;
        if (cmdAny._localizations && Array.isArray(cmdAny._localizations)) {
          const faLoc = cmdAny._localizations.find((loc: any) => loc.languageCode === 'fa');
          if (faLoc?.description) description = faLoc.description;
        } else if (cmdAny.localizations && Array.isArray(cmdAny.localizations)) {
          const faLoc = cmdAny.localizations.find((loc: any) => loc.languageCode === 'fa');
          if (faLoc?.description) description = faLoc.description;
        }
        
        commandsToSet.push({
          command: typeof cmd.name === 'string' ? cmd.name : String(cmd.name),
          description: description
        });
      }
    }
    
    await ctx.api.setMyCommands(commandsToSet, {
      scope: { type: 'chat', chat_id: ctx.from?.id || 0 }
    });
    
    await ctx.reply('✅ زبان به فارسی تغییر کرد\n\n💡 <i>این تنظیم زبان تلگرام شما را فقط برای این ربات تغییر می‌دهد.</i>', { parse_mode: 'HTML' });
    ctx.menu.nav('settings-menu');
  })
  .row()
  .text('🔄 Use Telegram Language', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramUserId = String(ctx.from?.id || '');
    
    // Delete language preference to use Telegram's language
    const { getPrisma } = await import('@rad/shared');
    try {
      await getPrisma().userPreferences.delete({
        where: { telegramUserId }
      });
    } catch (err) {
      // It's okay if preference doesn't exist
    }
    
    // Detect Telegram language
    const telegramLang = ctx.from?.language_code?.toLowerCase();
    const detectedLang = (telegramLang?.startsWith('en') ? 'en' : 'fa') as 'en' | 'fa';
    ctx.session.language = detectedLang;
    
    // Clear command cache
    const { clearCommandCache } = await import('../middleware/sync-commands.js');
    clearCommandCache(ctx.from?.id || 0);
    
    const message = detectedLang === 'en' 
      ? `✅ Using Telegram language (${ctx.from?.language_code || 'en'})\n\n💡 <i>Language will auto-detect from your Telegram settings.</i>`
      : `✅ استفاده از زبان تلگرام (${ctx.from?.language_code || 'fa'})\n\n💡 <i>زبان به صورت خودکار از تنظیمات تلگرام شما تشخیص داده می‌شود.</i>`;
    
    await ctx.reply(message, { parse_mode: 'HTML' });
    ctx.menu.nav('settings-menu');
  })
  .row()
  .text('« Back', (ctx) => {
    ctx.menu.nav('settings-menu');
    ctx.answerCallbackQuery();
  });

// Register submenus
mainMenu.register(settingsMenu);
mainMenu.register(languageMenu);

/**
 * Helper to show the main menu
 */
export async function showMainMenu(ctx: BotContext) {
  await ctx.reply(
    ctx.t('menu-welcome') || '🤖 <b>Main Menu</b>\n\nChoose an option below:',
    { reply_markup: mainMenu, parse_mode: 'HTML' }
  );
}
