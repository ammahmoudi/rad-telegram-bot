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
    await ctx.reply('✅ Language changed to English');
    ctx.menu.nav('settings-menu');
  })
  .row()
  .text('🇮🇷 فارسی', async (ctx) => {
    await ctx.answerCallbackQuery();
    const telegramUserId = String(ctx.from?.id || '');
    const { setUserLanguage } = await import('@rad/shared');
    await setUserLanguage(telegramUserId, 'fa');
    ctx.session.language = 'fa';
    await ctx.reply('✅ زبان به فارسی تغییر کرد');
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
