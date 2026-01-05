/**
 * User Commands - General bot commands
 */

import { userCommands } from './index.js';
import { handleStartCommand, handleMenuCommand } from '../handlers/commands/start.js';

// Start command - Welcome and menu
userCommands.command(
  'start',
  'Start the bot and see the main menu',
  handleStartCommand
)
  .localize('fa', 'start', 'شروع ربات و مشاهده منوی اصلی');

// Menu command - Show main menu
userCommands.command(
  'menu',
  'Show main menu',
  handleMenuCommand
)
  .localize('fa', 'menu', 'نمایش منوی اصلی');

// Clear chat command - Clear chat history (MOVED HERE for higher visibility)
import { handleClearChatCommand } from '../handlers/commands/chat.js';

userCommands.command(
  'clear_chat',
  'Clear current conversation',
  handleClearChatCommand
)
  .localize('fa', 'clear_chat', 'پاک کردن گفتگوی فعلی');

// Settings command - Navigate to settings
userCommands.command(
  'settings',
  'Bot settings',
  async (ctx) => {
    const { mainMenu } = await import('../menus/index.js');
    await ctx.reply('⚙️ <b>Settings</b>', { reply_markup: mainMenu });
  }
)
  .localize('fa', 'settings', 'تنظیمات ربات');

// Help command - Show all available commands
userCommands.command(
  'help',
  'Show this help message',
  async (ctx) => {
    await ctx.reply(
      `<b>📚 Available Commands</b>\n\n` +
      `<b>General:</b>\n` +
      `/start - Start the bot\n` +
      `/menu - Show main menu\n` +
      `/clear_chat - Clear conversation\n` +
      `/settings - Bot settings\n` +
      `/help - This help message\n\n` +
      `<b>Planka:</b>\n` +
      `/link_planka - Link your Planka account\n` +
      `/planka_status - Check connection\n` +
      `/planka_unlink - Unlink account\n\n` +
      `<b>Rastar:</b>\n` +
      `/link_rastar - Link your Rastar account\n` +
      `/rastar_status - Check connection\n` +
      `/rastar_unlink - Unlink account\n\n` +
      `💬 <i>Just send me a message to chat!</i>`
    );
  }
)
  .localize('fa', 'help', 'نمایش پیام راهنما');
