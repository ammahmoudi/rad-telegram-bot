/**
 * Conversation Flows using @grammyjs/conversations
 * Modern multi-step interactions replacing manual state management
 */

import type { Conversation } from '@grammyjs/conversations';
import type { BotContext } from '../bot.js';

/**
 * Planka Account Linking Conversation
 * Replaces the old multi-step manual flow
 */
export async function linkPlankaConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext
) {
  const telegramUserId = String(ctx.from?.id || '');
  
  // Step 1: Ask for server URL
  await ctx.reply(
    ctx.t('link-planka-enter-url') || 
    '🔗 <b>Link Planka Account</b>\n\n' +
    'Please enter your Planka server URL (e.g., https://planka.example.com):'
  );
  
  const urlCtx = await conversation.wait();
  const serverUrl = urlCtx.message?.text;
  
  if (!serverUrl) {
    await ctx.reply(ctx.t('link-planka-invalid-url') || '❌ Invalid URL. Please try again with /link_planka');
    return;
  }
  
  // Step 2: Ask for username/email
  await ctx.reply(
    ctx.t('link-planka-enter-username') || 
    '👤 Now enter your Planka username or email:'
  );
  
  const usernameCtx = await conversation.wait();
  const emailOrUsername = usernameCtx.message?.text;
  
  if (!emailOrUsername) {
    await ctx.reply(ctx.t('link-planka-invalid-username') || '❌ Invalid username. Please try again.');
    return;
  }
  
  // Step 3: Ask for password
  await ctx.reply(
    ctx.t('link-planka-enter-password') ||
    '🔐 Finally, enter your Planka password:\n\n' +
    '<i>Note: Your password is never stored, only used to get an access token.</i>'
  );
  
  const passwordCtx = await conversation.wait();
  const password = passwordCtx.message?.text;
  
  if (!password) {
    await ctx.reply(ctx.t('link-planka-invalid-password') || '❌ Invalid password. Please try again.');
    return;
  }
  
  // Delete the password message for security
  await passwordCtx.deleteMessage().catch(() => {});
  
  // Step 4: Note - Account linking should be done via link portal
  // The actual linking happens through the link portal web interface
  // This conversation is kept for future direct linking implementation
  
  await ctx.reply(
    ctx.t('link-planka-use-portal') ||
    '🔗 <b>Please use the link portal</b>\n\n' +
    'For security reasons, account linking is done through our secure web portal.\n\n' +
    'Use the /link_planka command to get your personalized link!'
  );
}

/**
 * Rastar Account Linking Conversation
 */
export async function linkRastarConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext
) {
  const telegramUserId = String(ctx.from?.id || '');
  
  // Step 1: Ask for server URL
  await ctx.reply(
    ctx.t('link-rastar-enter-url') ||
    '🔗 <b>Link Rastar Account</b>\n\n' +
    'Please enter your Rastar server URL (e.g., https://rastar.example.com):'
  );
  
  const urlCtx = await conversation.wait();
  const serverUrl = urlCtx.message?.text;
  
  if (!serverUrl) {
    await ctx.reply(ctx.t('link-rastar-invalid-url') || '❌ Invalid URL. Please try again with /link_rastar');
    return;
  }
  
  // Step 2: Ask for username
  await ctx.reply(
    ctx.t('link-rastar-enter-username') ||
    '👤 Now enter your Rastar username:'
  );
  
  const usernameCtx = await conversation.wait();
  const username = usernameCtx.message?.text;
  
  if (!username) {
    await ctx.reply(ctx.t('link-rastar-invalid-username') || '❌ Invalid username. Please try again.');
    return;
  }
  
  // Step 3: Ask for password
  await ctx.reply(
    ctx.t('link-rastar-enter-password') ||
    '🔐 Finally, enter your Rastar password:\n\n' +
    '<i>Note: Your password is never stored, only used to get an access token.</i>'
  );
  
  const passwordCtx = await conversation.wait();
  const password = passwordCtx.message?.text;
  
  if (!password) {
    await ctx.reply(ctx.t('link-rastar-invalid-password') || '❌ Invalid password. Please try again.');
    return;
  }
  
  // Delete the password message for security
  await passwordCtx.deleteMessage().catch(() => {});
  
  // Step 4: Note - Account linking should be done via link portal
  // The actual linking happens through the link portal web interface
  // This conversation is kept for future direct linking implementation
  
  await ctx.reply(
    ctx.t('link-rastar-use-portal') ||
    '🔗 <b>Please use the link portal</b>\n\n' +
    'For security reasons, account linking is done through our secure web portal.\n\n' +
    'Use the /link_rastar command to get your personalized link!'
  );
}

/**
 * New Chat Conversation - Clear history with confirmation
 */
export async function newChatConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext
) {
  await ctx.reply(
    ctx.t('new-chat-confirm') ||
    '⚠️ <b>Start New Chat?</b>\n\n' +
    'This will clear your conversation history.\n\n' +
    'Type <b>yes</b> to confirm or <b>no</b> to cancel.'
  );
  
  const confirmCtx = await conversation.wait();
  const response = confirmCtx.message?.text?.toLowerCase();
  
  if (response === 'yes' || response === 'بله') {
    // Import dynamically
    const { handleNewChatCommand } = await import('../handlers/commands/index.js');
    await handleNewChatCommand(ctx);
  } else {
    await ctx.reply(ctx.t('new-chat-cancelled') || '✅ Cancelled. Your chat history is preserved.');
  }
}
