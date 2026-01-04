import type { BotContext } from '../bot.js';
import {
  handleLinkPlankaCommand,
  handlePlankaUnlinkCommand,
  handleLinkRastarCommand,
  handleRastarUnlinkCommand,
} from './commands/index.js';
import { handleAiMessage } from './ai-message.js';

/**
 * Helper function to create a message context from a callback query
 * This simulates a user sending a text message
 */
function createMessageContext(ctx: BotContext, messageText: string): BotContext {
  // Get topic information if available (Grammy Bot API 9.3+ support)
  const messageThreadId = ctx.callbackQuery?.message?.message_thread_id;
  
  // Create a wrapper that proxies most properties to original context
  // but provides custom message and from properties
  const message: Record<string, any> = {
    message_id: ctx.callbackQuery?.message?.message_id || 0,
    date: Math.floor(Date.now() / 1000),
    chat: ctx.chat!,
    from: ctx.callbackQuery!.from,
    text: messageText
  };
  
  // Include message_thread_id if available (for topics in private chats)
  if (messageThreadId) {
    message.message_thread_id = messageThreadId;
  }
  
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'message') return message;
      if (prop === 'from') return ctx.callbackQuery!.from;
      return (target as any)[prop];
    }
  }) as BotContext;
}

/**
 * Handle "link_planka" callback
 */
export async function handleLinkPlankaCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await handleLinkPlankaCommand(ctx);
}

/**
 * Handle "planka_unlink" callback
 */
export async function handlePlankaUnlinkCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await handlePlankaUnlinkCommand(ctx);
}

/**
 * Handle "planka_list_boards" callback
 */
export async function handlePlankaListBoardsCallback(ctx: BotContext) {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('loading-fetching-boards'));
    
    const fakeMessageCtx = createMessageContext(ctx, ctx.t('prompts-list-boards'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] planka_list_boards error:', error);
    await ctx.reply(ctx.t('callback-errors-fetch-boards'));
  }
}

/**
 * Handle "planka_delayed_tasks" callback
 */
export async function handlePlankaDelayedTasksCallback(ctx: BotContext) {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('loading-checking-delayed-tasks'));
    
    const fakeMessageCtx = createMessageContext(ctx, ctx.t('prompts-delayed-tasks'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] planka_delayed_tasks error:', error);
    await ctx.reply(ctx.t('callback-errors-check-tasks'));
  }
}

/**
 * Handle "planka_create_card" callback
 */
export async function handlePlankaCreateCardCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t('callback-errors-create-prompt'));
}

/**
 * Handle "link_rastar" callback
 */
export async function handleLinkRastarCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await handleLinkRastarCommand(ctx);
}

/**
 * Handle "rastar_unlink" callback
 */
export async function handleRastarUnlinkCallback(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  await handleRastarUnlinkCommand(ctx);
}

/**
 * Handle "rastar_today_menu" callback
 */
export async function handleRastarTodayMenuCallback(ctx: BotContext) {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('loading-fetching-today-menu'));
    
    const fakeMessageCtx = createMessageContext(ctx, ctx.t('prompts-today-menu'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_today_menu error:', error);
    await ctx.reply(ctx.t('callback-errors-fetch-menu'));
  }
}

/**
 * Handle "rastar_unselected_days" callback
 */
export async function handleRastarUnselectedDaysCallback(ctx: BotContext) {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('loading-checking-unselected-days'));
    
    const fakeMessageCtx = createMessageContext(ctx, ctx.t('prompts-unselected-days'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_unselected_days error:', error);
    await ctx.reply(ctx.t('callback-errors-check-unselected-days'));
  }
}

/**
 * Handle "rastar_week_menu" callback
 */
export async function handleRastarWeekMenuCallback(ctx: BotContext) {
  try {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('loading-fetching-week-menu'));
    
    const fakeMessageCtx = createMessageContext(ctx, ctx.t('prompts-week-menu'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_week_menu error:', error);
    await ctx.reply(ctx.t('callback-errors-fetch-week-menu'));
  }
}
