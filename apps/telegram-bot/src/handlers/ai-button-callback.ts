/**
 * Handler for AI-suggested button callbacks
 */

import type { CallbackQueryContext, Context } from 'grammy';
import { parseButtonCallback, BUTTON_ACTIONS } from '../utils/ai-buttons.js';
import { executeRastarTool } from '../rastar-tools.js';
import { executePlankaToolCall } from '../planka-tools.js';
import { getUserI18n } from '../i18n.js';
import { getUserLanguage } from '@rad/shared';

/**
 * Handle button callback from user clicking an AI-suggested button
 */
export async function handleAiButtonCallback(ctx: CallbackQueryContext<Context>) {
  const callbackData = ctx.callbackQuery.data;
  if (!callbackData) return;

  const parsed = parseButtonCallback(callbackData);
  const telegramUserId = ctx.from?.id.toString();
  const language = await getUserLanguage(telegramUserId || '');
  const t = getUserI18n(language);
  
  if (!parsed) {
    await ctx.answerCallbackQuery({ text: t('ai_buttons.invalid_data') });
    return;
  }

  const { action, data, userId, message } = parsed;
  
  // Verify the button belongs to this user
  if (telegramUserId !== userId) {
    await ctx.answerCallbackQuery({ text: t('ai_buttons.not_for_you') });
    return;
  }

  console.log('[ai-button-callback]', { action, data, userId, message });

  try {
    // Show processing indicator
    await ctx.answerCallbackQuery({ text: t('ai_buttons.processing') });

    // Handle different button actions
    switch (action) {
      case BUTTON_ACTIONS.SEND_MESSAGE:
        await handleSendMessage(ctx, message, t);
        break;

      case BUTTON_ACTIONS.SELECT_ALL_FOODS:
        await handleSelectAllFoods(ctx, telegramUserId, data, t);
        break;

      case BUTTON_ACTIONS.SELECT_BY_APPETITE:
        await handleSelectByAppetite(ctx, telegramUserId, data, t);
        break;

      case BUTTON_ACTIONS.VIEW_TODAY_MENU:
        await handleViewTodayMenu(ctx, telegramUserId, t);
        break;

      case BUTTON_ACTIONS.VIEW_WEEK_MENU:
        await handleViewWeekMenu(ctx, telegramUserId, t);
        break;

      case BUTTON_ACTIONS.VIEW_MY_TASKS:
        await handleViewMyTasks(ctx, telegramUserId, t);
        break;

      case BUTTON_ACTIONS.RETRY_ACTION:
        await handleRetryAction(ctx, telegramUserId, data, t);
        break;

      case BUTTON_ACTIONS.CANCEL:
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
        await ctx.reply(t('ai_buttons.cancelled'));
        break;

      default:
        await ctx.reply(t('ai_buttons.unknown_action', { action }));
    }
  } catch (error) {
    console.error('[ai-button-callback] Error:', error);
    await ctx.reply(t('ai_buttons.error'));
  }
}

/**
 * Handle send_message action: send a message to AI as if user typed it
 * If message is a command (starts with /), suggest using it directly
 */
async function handleSendMessage(
  ctx: CallbackQueryContext<Context>,
  message: string | undefined,
  t: any
) {
  if (!message) {
    await ctx.reply(t('ai_buttons.no_message'));
    return;
  }

  // If the message is a command, suggest using it directly
  if (message.startsWith('/')) {
    await ctx.reply(`💡 لطفاً از دستور ${message} استفاده کنید.`);
    return;
  }

  // Import the AI message handler dynamically to avoid circular dependency
  const { handleAiMessage } = await import('./ai-message.js');
  
  // Create a fake message context to pass to AI handler
  // The AI will process this as if the user sent the message
  const fakeCtx = {
    ...ctx,
    message: {
      text: message,
      from: ctx.from,
      chat: ctx.chat,
      message_id: ctx.callbackQuery.message?.message_id || 0,
      date: Date.now(),
    },
  };

  await handleAiMessage(fakeCtx as any);
}

/**
 * Select all foods for unselected days
 */
async function handleSelectAllFoods(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  data: Record<string, any>,
  t: any
) {
  await ctx.reply(t('ai_buttons.selecting_foods'));

  const result = await executeRastarTool(
    telegramUserId,
    'rastar.menu.get_unselected_days',
    {}
  );

  if (!result.success) {
    await ctx.reply(t('ai_buttons.error_with_message', { error: result.error }));
    return;
  }

  // Parse unselected days and bulk select first option for each
  try {
    const unselectedDays = JSON.parse(result.content);
    
    if (!unselectedDays.days || unselectedDays.days.length === 0) {
      await ctx.reply(t('ai_buttons.all_days_selected'));
      return;
    }

    const selections = unselectedDays.days.map((day: any) => ({
      date: day.date,
      menuScheduleId: day.options[0]?.id, // Select first option
    }));

    const bulkResult = await executeRastarTool(
      telegramUserId,
      'rastar.menu.bulk_select_foods',
      { selections }
    );

    if (bulkResult.success) {
      await ctx.reply(t('ai_buttons.foods_selected_success'));
    } else {
      await ctx.reply(t('ai_buttons.error_with_message', { error: bulkResult.error }));
    }
  } catch (error) {
    await ctx.reply(t('ai_buttons.data_processing_error'));
  }
}

/**
 * Select foods based on user's appetite preference
 */
async function handleSelectByAppetite(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  data: Record<string, any>,
  t: any
) {
  const appetite = data.appetite || 'normal'; // 'light', 'normal', 'heavy'
  
  // Use send_message approach for appetite-based selection
  // This allows AI to understand the context and select appropriately
  const message = `Please select foods for all unselected days based on ${appetite} appetite preference`;
  await handleSendMessage(ctx, message, t);
}

/**
 * View today's menu
 */
async function handleViewTodayMenu(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  t: any
) {
  // Use send_message to let AI format today's menu nicely
  return handleSendMessage(ctx, telegramUserId, 'show me today\'s menu', t);
}

/**
 * View this week's menu
 */
async function handleViewWeekMenu(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  t: any
) {
  // Use send_message to let AI format the week menu nicely
  return handleSendMessage(ctx, telegramUserId, 'show me this week\'s menu', t);
}

/**
 * View user's Planka tasks
 */
async function handleViewMyTasks(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  t: any
) {
  // Use send_message to let AI fetch and format tasks
  await handleSendMessage(ctx, 'Show me my tasks', t);
}

/**
 * Retry a previous action
 */
async function handleRetryAction(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  data: Record<string, any>,
  t: any
) {
  const originalMessage = data.original_message;

  if (!originalMessage) {
    await ctx.reply(t('ai_buttons.action_not_found'));
    return;
  }

  // Resend the original message to AI
  await handleSendMessage(ctx, originalMessage, t);
}
