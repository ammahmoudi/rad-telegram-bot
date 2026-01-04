import type { Context } from 'grammy';
import {
  handleLinkPlankaCommand,
  handlePlankaUnlinkCommand,
  handleLinkRastarCommand,
  handleRastarUnlinkCommand,
} from './commands.js';
import { handleAiMessage } from './ai-message.js';
import { getUserI18n } from '../i18n.js';
import { getUserLanguage } from '@rad/shared';
import { getMessageThreadId } from '../services/draft-streaming.js';

/**
 * Helper function to create a message context from a callback query
 * This simulates a user sending a text message
 */
function createMessageContext(ctx: Context, messageText: string): Context {
  // Get topic information if available
  const messageThreadId = getMessageThreadId(ctx);
  
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
  }) as Context;
}

/**
 * Handle "link_planka" callback
 */
export async function handleLinkPlankaCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await handleLinkPlankaCommand(ctx);
}

/**
 * Handle "planka_unlink" callback
 */
export async function handlePlankaUnlinkCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await handlePlankaUnlinkCommand(ctx);
}

/**
 * Handle "planka_list_boards" callback
 */
export async function handlePlankaListBoardsCallback(ctx: Context) {
  try {
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    await ctx.answerCallbackQuery();
    await ctx.reply(t('loading.fetching_boards'));
    
    const fakeMessageCtx = createMessageContext(ctx, t('prompts.list_boards'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] planka_list_boards error:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.fetch_boards'));
  }
}

/**
 * Handle "planka_delayed_tasks" callback
 */
export async function handlePlankaDelayedTasksCallback(ctx: Context) {
  try {
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    await ctx.answerCallbackQuery();
    await ctx.reply(t('loading.checking_delayed_tasks'));
    
    const fakeMessageCtx = createMessageContext(ctx, t('prompts.delayed_tasks'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] planka_delayed_tasks error:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.check_tasks'));
  }
}

/**
 * Handle "planka_create_card" callback
 */
export async function handlePlankaCreateCardCallback(ctx: Context) {
  const telegramUserId = String(ctx.from?.id ?? '');
  const language = await getUserLanguage(telegramUserId);
  const t = getUserI18n(language);
  
  await ctx.answerCallbackQuery();
  await ctx.reply(t('callback_errors.create_prompt'));
}

/**
 * Handle "link_rastar" callback
 */
export async function handleLinkRastarCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await handleLinkRastarCommand(ctx);
}

/**
 * Handle "rastar_unlink" callback
 */
export async function handleRastarUnlinkCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await handleRastarUnlinkCommand(ctx);
}

/**
 * Handle "rastar_today_menu" callback
 */
export async function handleRastarTodayMenuCallback(ctx: Context) {
  try {
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    await ctx.answerCallbackQuery();
    await ctx.reply(t('loading.fetching_today_menu'));
    
    const fakeMessageCtx = createMessageContext(ctx, t('prompts.today_menu'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_today_menu error:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.fetch_menu'));
  }
}

/**
 * Handle "rastar_unselected_days" callback
 */
export async function handleRastarUnselectedDaysCallback(ctx: Context) {
  try {
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    await ctx.answerCallbackQuery();
    await ctx.reply(t('loading.checking_unselected_days'));
    
    const fakeMessageCtx = createMessageContext(ctx, t('prompts.unselected_days'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_unselected_days error:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.check_unselected_days'));
  }
}

/**
 * Handle "rastar_week_menu" callback
 */
export async function handleRastarWeekMenuCallback(ctx: Context) {
  try {
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    
    await ctx.answerCallbackQuery();
    await ctx.reply(t('loading.fetching_week_menu'));
    
    const fakeMessageCtx = createMessageContext(ctx, t('prompts.week_menu'));
    await handleAiMessage(fakeMessageCtx);
  } catch (error) {
    console.error('[callback] rastar_week_menu error:', error);
    const telegramUserId = String(ctx.from?.id ?? '');
    const language = await getUserLanguage(telegramUserId);
    const t = getUserI18n(language);
    await ctx.reply(t('callback_errors.fetch_week_menu'));
  }
}
