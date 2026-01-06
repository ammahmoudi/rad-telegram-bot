/**
 * AI response formatting and finalization
 * Handles parsing buttons, formatting output, and sending final responses
 */

import type { BotContext } from '../bot.js';
import { parseAiButtons, createButtonKeyboard } from '../utils/ai-buttons.js';
import { splitHtmlSafely } from '../utils/html-splitter.js';
import { getMainMenuKeyboard, getThreadQuickActionsKeyboard } from './keyboards.js';
import { getUserLanguage, getPlankaToken, getRastarToken } from '@rad/shared';
import { InlineKeyboard } from 'grammy';

/**
 * Format and send final AI response with optional buttons
 * Returns the message ID of the final response
 */
export async function sendFinalResponse(
  ctx: BotContext,
  sentMessage: { chat: { id: number }, message_id: number },
  finalContent: string,
  telegramUserId: string,
  messageThreadId?: number
): Promise<number> {
  console.log('[ai-response] Sending final response, length:', finalContent.length);
  console.log('[ai-response] Content preview:', finalContent.substring(0, 500));
  
  // Parse AI-suggested buttons from response
  const { messageText, buttons } = parseAiButtons(finalContent);
  const keyboard = buttons.length > 0 ? createButtonKeyboard(buttons, telegramUserId) : undefined;
  
  console.log('[ai-response] Parsed buttons:', buttons.length);
  
  // Use the cleaned message text (without button tags)
  const cleanContent = messageText;
  
  // Get keyboards - always show reply keyboard at bottom, AI buttons are additional
  const language = await getUserLanguage(telegramUserId);
  
  // Refresh connection status from database (in case tokens were deleted during tool execution)
  const plankaToken = await getPlankaToken(telegramUserId);
  const rastarToken = await getRastarToken(telegramUserId);
  const plankaLinked = !!plankaToken;
  const rastarLinked = !!rastarToken;
  
  // Update session cache
  if (ctx.session) {
    ctx.session.plankaLinked = plankaLinked;
    ctx.session.rastarLinked = rastarLinked;
  }
  
  // Reply keyboard (persistent at bottom) - always use in both general chat and threads
  const replyKeyboard = getMainMenuKeyboard(language, {
    plankaLinked,
    rastarLinked,
  });
  
  // AI-suggested inline buttons (additional to reply keyboard)
  const aiInlineButtons = keyboard;
  
  console.log('[ai-response] Keyboard configuration:', {
    inThread: !!messageThreadId,
    hasReplyKeyboard: !!replyKeyboard,
    hasAiButtons: buttons.length > 0
  });
  
  // Update with final content or send new messages for long content
  if (cleanContent.length > 4000) {
    // Delete the streaming message and send chunks with safe HTML splitting
    try {
      await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
    } catch (delError) {
      console.log('[ai-response] Could not delete message, continuing...');
    }
    
    const chunks = splitHtmlSafely(cleanContent, 4000);
    let lastMessageId = sentMessage.message_id;
    
    for (let i = 0; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const replyOptions: any = { parse_mode: 'HTML' };
      if (messageThreadId) {
        replyOptions.message_thread_id = messageThreadId;
      }
      if (isLastChunk) {
        // Last chunk: Add reply keyboard (works in both general chat and threads)
        replyOptions.reply_markup = replyKeyboard;
      }
      const msg = await ctx.reply(chunks[i], replyOptions);
      if (isLastChunk) {
        lastMessageId = msg.message_id;
      }
    }
    
    return lastMessageId;
  } else {
    try {
      console.log('[ai-response] Editing message:', {
        hasAiButtons: !!aiInlineButtons,
        inThread: !!messageThreadId
      });
      
      // editMessageText only accepts inline keyboards, not reply keyboards
      await ctx.api.editMessageText(
        sentMessage.chat.id,
        sentMessage.message_id,
        cleanContent,
        {
          parse_mode: 'HTML',
          ...(aiInlineButtons && { reply_markup: aiInlineButtons })
        }
      );
      
      // Reply keyboard is already persistent and doesn't need constant updates
      // It was set during /start and will remain visible
      
      return sentMessage.message_id;
    } catch (editError: any) {
      // If edit fails, the streamed message is already visible - no need to send duplicate
      const errorDesc = editError?.description || editError?.message || '';
      
      // Only log non-duplicate errors
      if (!errorDesc.includes('message is not modified')) {
        console.log('[ai-response] Could not edit message:', errorDesc);
      }
      
      console.log('[ai-response] Streamed message is already visible, skipping duplicate');
      
      // Reply keyboard is already persistent, no need to update
      
      return sentMessage.message_id;
    }
  }
}
