/**
 * AI response formatting and finalization
 * Handles parsing buttons, formatting output, and sending final responses
 */

import type { BotContext } from '../bot.js';
import { parseAiButtons, createButtonKeyboard } from '../utils/ai-buttons.js';
import { splitHtmlSafely } from '../utils/html-splitter.js';

/**
 * Format and send final AI response with optional buttons
 */
export async function sendFinalResponse(
  ctx: BotContext,
  sentMessage: { chat: { id: number }, message_id: number },
  finalContent: string,
  telegramUserId: string
): Promise<void> {
  console.log('[ai-response] Sending final response, length:', finalContent.length);
  console.log('[ai-response] Content preview:', finalContent.substring(0, 500));
  
  // Parse AI-suggested buttons from response
  const { messageText, buttons } = parseAiButtons(finalContent);
  const keyboard = buttons.length > 0 ? createButtonKeyboard(buttons, telegramUserId) : undefined;
  
  console.log('[ai-response] Parsed buttons:', buttons.length);
  
  // Use the cleaned message text (without button tags)
  const cleanContent = messageText;
  
  // Update with final content or send new messages for long content
  if (cleanContent.length > 4000) {
    // Delete the streaming message and send chunks with safe HTML splitting
    try {
      await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
    } catch (delError) {
      console.log('[ai-response] Could not delete message, continuing...');
    }
    
    const chunks = splitHtmlSafely(cleanContent, 4000);
    for (let i = 0; i < chunks.length; i++) {
      // Only add buttons to the last chunk
      const isLastChunk = i === chunks.length - 1;
      const replyOptions: any = { parse_mode: 'HTML' };
      if (isLastChunk && keyboard) {
        replyOptions.reply_markup = keyboard;
      }
      await ctx.reply(chunks[i], replyOptions);
    }
  } else {
    try {
      const editOptions: any = { parse_mode: 'HTML' };
      if (keyboard) {
        editOptions.reply_markup = keyboard;
      }
      await ctx.api.editMessageText(
        sentMessage.chat.id,
        sentMessage.message_id,
        cleanContent,
        editOptions
      );
    } catch (editError: any) {
      // If edit fails, the streamed message is already visible - no need to send duplicate
      const errorDesc = editError?.description || editError?.message || '';
      
      // Only log non-duplicate errors
      if (!errorDesc.includes('message is not modified')) {
        console.log('[ai-response] Could not edit message:', errorDesc);
      }
      
      console.log('[ai-response] Streamed message is already visible, skipping duplicate');
    }
  }
}
