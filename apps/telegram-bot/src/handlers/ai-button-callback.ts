/**
 * Handler for AI-suggested button callbacks
 */

import type { BotContext } from '../bot.js';
import { parseButtonCallback, BUTTON_ACTIONS } from '../utils/ai-buttons.js';
import { executeRastarTool } from '../rastar-tools.js';

/**
 * Handle button callback from user clicking an AI-suggested button
 */
export async function handleAiButtonCallback(ctx: BotContext) {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !('data' in callbackQuery)) return;
  
  const callbackData = callbackQuery.data;
  if (!callbackData) return;

  const parsed = parseButtonCallback(callbackData);
  const telegramUserId = ctx.from?.id.toString();
  
  if (!parsed) {
    await ctx.answerCallbackQuery({ text: ctx.t('ai-buttons-invalid-data') });
    return;
  }

  const { action, data, userId, message } = parsed;
  
  // Verify the button belongs to this user
  if (telegramUserId !== userId) {
    await ctx.answerCallbackQuery({ text: ctx.t('ai-buttons-not-for-you') });
    return;
  }

  console.log('[ai-button-callback]', { action, data, userId, message });

  try {
    // Show processing indicator
    await ctx.answerCallbackQuery({ text: ctx.t('ai-buttons-processing') });

    // Handle different button actions
    switch (action) {
      case BUTTON_ACTIONS.SEND_MESSAGE:
        await handleSendMessage(ctx, message);
        break;

      case BUTTON_ACTIONS.SELECT_ALL_FOODS:
        await handleSelectAllFoods(ctx, telegramUserId, data);
        break;

      case BUTTON_ACTIONS.SELECT_BY_APPETITE:
        await handleSelectByAppetite(ctx, telegramUserId, data);
        break;

      case BUTTON_ACTIONS.VIEW_TODAY_MENU:
        await handleViewTodayMenu(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.VIEW_WEEK_MENU:
        await handleViewWeekMenu(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.VIEW_NEXT_WEEK_MENU:
        await handleViewNextWeekMenu(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.VIEW_SELECTION_STATS:
        await handleViewSelectionStats(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.VIEW_UNSELECTED_DAYS:
        await handleViewUnselectedDays(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.VIEW_MY_TASKS:
        await handleViewMyTasks(ctx, telegramUserId);
        break;

      case BUTTON_ACTIONS.RETRY_ACTION:
        await handleRetryAction(ctx, telegramUserId, data);
        break;

      case BUTTON_ACTIONS.CANCEL:
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
        await ctx.reply(ctx.t('ai-buttons-cancelled'));
        break;

      default:
        await ctx.reply(ctx.t('ai-buttons-unknown-action', { action }));
    }
  } catch (error) {
    console.error('[ai-button-callback] Error:', error);
    await ctx.reply(ctx.t('ai-buttons-error'));
  }
}

/**
 * Handle send_message action: send a message to AI as if user typed it
 * If message is a command (starts with /), suggest using it directly
 */
async function handleSendMessage(
  ctx: BotContext,
  message: string | undefined
) {
  if (!message) {
    await ctx.reply(ctx.t('ai-buttons-no-message'));
    return;
  }

  // If the message is a command, suggest using it directly
  if (message.startsWith('/')) {
    await ctx.reply(`💡 لطفاً از دستور ${message} استفاده کنید.`);
    return;
  }

  // Get topic information if available (Grammy Bot API 9.3+ support)
  // In private chats, users create topics manually - bot detects and responds in that topic
  let messageThreadId = ctx.callbackQuery?.message?.message_thread_id;

  // Use existing topic from session if available
  if (!messageThreadId && ctx.session?.currentChatTopicId) {
    messageThreadId = ctx.session.currentChatTopicId;
  }

  // Send the message as a reply to the AI's message
  try {
    const sendOptions: Record<string, any> = {
      reply_to_message_id: ctx.callbackQuery?.message?.message_id
    };
    
    // Include message_thread_id if in a topic
    if (messageThreadId) {
      sendOptions.message_thread_id = messageThreadId;
    }
    
    await ctx.api.sendMessage(
      ctx.chat?.id || 0,
      message,
      sendOptions
    );
    
    // Answer the callback to remove loading state
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.log('[handleSendMessage] Could not send message:', err);
  }

  // Import the AI message handler dynamically to avoid circular dependency
  const { handleAiMessage } = await import('./ai-message.js');
  
  // Create a fake message context to pass to AI handler
  // The AI will process this as if the user sent the message
  const fakeCtx = {
    ...ctx,
    from: ctx.from, // Ensure from is properly passed
    message: {
      text: message,
      from: ctx.from,
      chat: ctx.chat,
      message_id: ctx.callbackQuery?.message?.message_id || 0,
      date: Date.now(),
      // Include topic information in the fake message
      message_thread_id: messageThreadId,
    },
    // Add reply and other methods that handleAiMessage expects
    reply: async (text: string, extra?: any) => {
      const sendOptions = { ...extra };
      if (messageThreadId && !sendOptions.message_thread_id) {
        sendOptions.message_thread_id = messageThreadId;
      }
      return ctx.api.sendMessage(ctx.chat?.id || 0, text, sendOptions);
    },
    replyWithChatAction: async (action: string) => {
      const actionOptions: Record<string, any> = {};
      if (messageThreadId) {
        actionOptions.message_thread_id = messageThreadId;
      }
      return ctx.api.sendChatAction(ctx.chat?.id || 0, action as any, actionOptions);
    },
  };

  await handleAiMessage(fakeCtx as any);
}

/**
 * Select all foods for unselected days
 */
async function handleSelectAllFoods(
  ctx: BotContext,
  telegramUserId: string,
  data: Record<string, any>
) {
  await ctx.reply(ctx.t('ai-buttons-selecting-foods'));

  const result = await executeRastarTool(
    telegramUserId,
    'rastar_menu_get_unselected_days',
    {}
  );

  if (!result.success) {
    await ctx.reply(ctx.t('ai-buttons-error-with-message', { error: result.error || 'Unknown error' }));
    return;
  }

  // Parse unselected days and bulk select first option for each
  try {
    const unselectedDays = JSON.parse(result.content);
    
    if (!unselectedDays.days || unselectedDays.days.length === 0) {
      await ctx.reply(ctx.t('ai-buttons-all-days-selected'));
      return;
    }

    const selections = unselectedDays.days.map((day: any) => ({
      date: day.date,
      menuScheduleId: day.options[0]?.id, // Select first option
    }));

    const bulkResult = await executeRastarTool(
      telegramUserId,
      'rastar_menu_bulk_select_foods',
      { selections }
    );

    if (bulkResult.success) {
      await ctx.reply(ctx.t('ai-buttons-foods-selected-success'));
    } else {
      await ctx.reply(ctx.t('ai-buttons-error-with-message', { error: bulkResult.error || 'Unknown error' }));
    }
  } catch (error) {
    await ctx.reply(ctx.t('ai-buttons-data-processing-error'));
  }
}

/**
 * Select foods based on user's appetite preference
 */
async function handleSelectByAppetite(
  ctx: BotContext,
  telegramUserId: string,
  data: Record<string, any>
) {
  const appetite = data.appetite || 'normal'; // 'light', 'normal', 'heavy'
  
  // Use send_message approach for appetite-based selection
  // This allows AI to understand the context and select appropriately
  const message = `Please select foods for all unselected days based on ${appetite} appetite preference`;
  await handleSendMessage(ctx, message);
}

/**
 * View today's menu
 */
async function handleViewTodayMenu(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI format today's menu nicely
  return handleSendMessage(ctx, 'show me today\'s menu');
}

/**
 * View this week's menu
 */
async function handleViewWeekMenu(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI format the week menu nicely
  return handleSendMessage(ctx, 'show me this week\'s menu');
}

/**
 * View next week's menu
 */
async function handleViewNextWeekMenu(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI format next week's menu nicely
  return handleSendMessage(ctx, 'show me next week\'s menu');
}

/**
 * View selection statistics
 */
async function handleViewSelectionStats(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI fetch and format selection stats
  return handleSendMessage(ctx, 'show me my selection statistics');
}

/**
 * View unselected days
 */
async function handleViewUnselectedDays(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI fetch and format unselected days
  return handleSendMessage(ctx, 'show me unselected days');
}

/**
 * View user's Planka tasks
 */
async function handleViewMyTasks(
  ctx: BotContext,
  telegramUserId: string
) {
  // Use send_message to let AI fetch and format tasks
  await handleSendMessage(ctx, 'Show me my tasks');
}

/**
 * Retry a previous action
 */
async function handleRetryAction(
  ctx: BotContext,
  telegramUserId: string,
  data: Record<string, any>
) {
  const originalMessage = data.original_message;

  if (!originalMessage) {
    await ctx.reply(ctx.t('ai-buttons-action-not-found'));
    return;
  }

  // Resend the original message to AI
  await handleSendMessage(ctx, originalMessage);
}

