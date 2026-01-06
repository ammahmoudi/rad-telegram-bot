/**
 * Error handling for AI chat interactions
 * Provides localized error messages for different error types
 */

import type { BotContext } from '../bot.js';

/**
 * Handle AI chat errors with specific user-friendly messages
 */
export async function handleAiError(ctx: BotContext, error: unknown, client: { model: string }): Promise<void> {
  console.error('[ai-error] AI chat error', error);
  
  // Provide more specific error messages
  let errorMessage = ctx.t('errors-generic');
  
  if (error instanceof Error) {
    const errorStr = error.message.toLowerCase();
    
    // Check for rate limit errors (429)
    if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('temporarily rate-limited') || errorStr.includes('provider returned error')) {
      const modelName = client.model.includes('gemini') ? 'Gemini' : 
                       client.model.includes('claude') ? 'Claude' :
                       client.model.includes('gpt') ? 'GPT' : 'AI model';
      
      errorMessage = `<b>${ctx.t('errors-rate-limit-title')}</b>\n\n` +
        ctx.t('errors-rate-limit-description', { model: modelName }) + '\n\n' +
        `<b>${ctx.t('errors-rate-limit-what-to-do')}</b>\n` +
        ctx.t('errors-rate-limit-wait') + '\n' +
        ctx.t('errors-rate-limit-message-saved') + '\n\n' +
        `<i>${ctx.t('errors-rate-limit-note')}</i>`;
    } 
    else if (errorStr.includes('network connection failed') || errorStr.includes('socket hang up') || errorStr.includes('econnreset')) {
      errorMessage = `<b>${ctx.t('errors-network-title')}</b>\n\n` +
        ctx.t('errors-network-description') + '\n\n' +
        `<b>${ctx.t('errors-network-try')}</b>\n` +
        ctx.t('errors-network-wait-retry') + '\n' +
        ctx.t('errors-network-check-connection') + '\n' +
        ctx.t('errors-network-server-issue');
    } 
    else if (errorStr.includes('tool use') || errorStr.includes('endpoints found')) {
      errorMessage = `<b>${ctx.t('errors-model-compatibility-title')}</b>\n\n` +
        ctx.t('errors-model-compatibility-description') + '\n\n' +
        `<b>${ctx.t('errors-model-compatibility-compatible-models')}</b>\n` +
        '• anthropic/claude-3.5-sonnet\n' +
        '• openai/gpt-4-turbo\n' +
        '• google/gemini-pro-1.5\n\n' +
        `<i>${ctx.t('errors-model-compatibility-ask-admin')}</i>`;
    } 
    else if (errorStr.includes('insufficient credits') || errorStr.includes('quota')) {
      errorMessage = `<b>${ctx.t('errors-credits-title')}</b>\n\n` +
        ctx.t('errors-credits-description') + '\n\n' +
        ctx.t('errors-credits-ask-admin');
    } 
    else if (errorStr.includes('unauthorized') || errorStr.includes('401')) {
      errorMessage = `<b>${ctx.t('errors-auth-title')}</b>\n\n` +
        ctx.t('errors-auth-description') + '\n\n' +
        ctx.t('errors-auth-ask-admin');
    } 
    else if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
      errorMessage = `<b>${ctx.t('errors-timeout-title')}</b>\n\n` +
        ctx.t('errors-timeout-description') + '\n\n' +
        `<b>${ctx.t('errors-timeout-try')}</b>\n` +
        ctx.t('errors-timeout-simplify') + '\n' +
        ctx.t('errors-timeout-retry') + '\n' +
        ctx.t('errors-timeout-break-up');
    }
  }
  
  // Try to send error message, with retry logic
  try {
    await ctx.reply(errorMessage, { parse_mode: 'HTML' });
  } catch (replyError) {
    console.error('[ai-error] Failed to send error message, retrying without HTML...', replyError);
    try {
      await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
    } catch (finalError) {
      console.error('[ai-error] Could not send any error message to user', finalError);
    }
  }
}

/**
 * Handle streaming connection errors with specific guidance
 */
export async function handleStreamingError(ctx: BotContext, error: unknown, client: { model: string }, sentMessage: { chat: { id: number }, message_id: number }): Promise<void> {
  console.error('[ai-error] Streaming error:', error);
  
  // Try to clean up the "Thinking..." message
  try {
    await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
  } catch (delError) {
    // Ignore if delete fails
  }
  
  // Check if it's a network/connection error
  if (error instanceof Error) {
    const errMsg = error.message.toLowerCase();
    if (errMsg.includes('terminated') || errMsg.includes('socket') || errMsg.includes('closed') || errMsg.includes('econnreset')) {
      const isGemini = client.model.includes('gemini') || client.model.includes('google');
      
      let message = '⚠️ <b>Connection Issue</b>\n\n' +
        'The AI service connection was interrupted.\n\n';
      
      if (isGemini) {
        message += '💡 <b>Note:</b> Gemini reasoning models occasionally have connection issues when generating responses.\n\n' +
          '<b>What you can do:</b>\n' +
          '• Send your message again - it usually works on retry\n' +
          '• Ask an admin to switch to Claude (more stable)\n';
      } else {
        message += '💡 <b>Try:</b>\n' +
          '• Send your message again\n' +
          '• Simplify your query\n';
      }
      
      await ctx.reply(message, { parse_mode: 'HTML' });
      return;
    }
  }
  
  throw error;
}
