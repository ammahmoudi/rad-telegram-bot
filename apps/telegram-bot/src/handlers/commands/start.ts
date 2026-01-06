import type { BotContext } from '../../bot.js';
import { getUserLanguage } from '@rad/shared';
import { getAiClient } from '../../services/ai-client.js';
import { getMainMenuKeyboard } from '../keyboards.js';
import { withThreadContext } from '../../utils/thread-helper.js';

/**
 * Handle /start command
 */
export async function handleStartCommand(ctx: BotContext) {
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
  
  const telegramUserId = String(ctx.from?.id ?? '');
  // Get Telegram's language setting from user object
  const telegramLanguage = ctx.from?.language_code;
  console.log('[start] Telegram language code:', telegramLanguage);
  
  // Get language with smart fallback: DB override > Telegram language > Default (FA)
  const language = await getUserLanguage(telegramUserId, telegramLanguage);
  console.log('[start] Selected language:', language, '(Telegram:', telegramLanguage, ')');
  
  const name = ctx.from?.first_name || 'there';
  const client = await getAiClient();
  const hasAI = client !== null;
  
  // Create/update user in database
  try {
    const { getPrisma } = await import('@rad/shared');
    const prisma = getPrisma();
    const now = Date.now();
    await prisma.telegramUser.upsert({
      where: { id: telegramUserId },
      update: {
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        lastSeenAt: now,
        updatedAt: now,
      },
      create: {
        id: telegramUserId,
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        username: ctx.from?.username || null,
        role: 'user',
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (dbError) {
    console.error('[telegram-bot] Could not create/update user:', dbError);
  }
  
  // Check connection status from database
  const { getPlankaToken, getRastarToken } = await import('@rad/shared');
  const plankaToken = await getPlankaToken(telegramUserId);
  const rastarToken = await getRastarToken(telegramUserId);
  
  // Update session with connection status and language
  ctx.session.plankaLinked = !!plankaToken;
  ctx.session.rastarLinked = !!rastarToken;
  ctx.session.language = language as 'en' | 'fa';
  
  // Force sync command menu with current language immediately
  try {
    const { clearCommandCache } = await import('../../middleware/sync-commands.js');
    const { userCommands, integrationCommands } = await import('../../commands/index.js');
    
    clearCommandCache(ctx.from?.id || 0);
    console.log('[start] Cleared command cache, syncing commands to', language);
    
    // Build commands with proper language
    const commandsToSet = [];
    for (const group of [userCommands, integrationCommands]) {
      for (const cmd of group.commands) {
        let description = cmd.description;
        
        // Debug: Log the entire command structure to find where localizations are stored
        console.log('[start] Command structure for', cmd.name, ':', JSON.stringify(cmd, null, 2));
        console.log('[start] Command keys:', Object.keys(cmd));
        
        if (language === 'fa') {
          const cmdAny = cmd as any;
          
          // Try all possible locations
          if (cmdAny._localizations) {
            console.log('[start] Found _localizations:', cmdAny._localizations);
            if (Array.isArray(cmdAny._localizations)) {
              const faLoc = cmdAny._localizations.find((loc: any) => loc.languageCode === 'fa');
              if (faLoc?.description) {
                description = faLoc.description;
                console.log('[start] ✓ Using FA description from _localizations:', description);
              }
            }
          } else if (cmdAny.localizations) {
            console.log('[start] Found localizations:', cmdAny.localizations);
            if (Array.isArray(cmdAny.localizations)) {
              const faLoc = cmdAny.localizations.find((loc: any) => loc.languageCode === 'fa');
              if (faLoc?.description) {
                description = faLoc.description;
                console.log('[start] ✓ Using FA description from localizations:', description);
              }
            }
          } else {
            console.log('[start] No localizations found for command:', cmd.name);
          }
        }
        
        commandsToSet.push({
          command: typeof cmd.name === 'string' ? cmd.name : String(cmd.name),
          description: description
        });
      }
    }
    
    // Set commands for this specific user
    await ctx.api.setMyCommands(commandsToSet, {
      scope: { type: 'chat', chat_id: ctx.from?.id || 0 }
    });
    
    console.log(`[start] ✓ Synced ${commandsToSet.length} commands in ${language}`);
  } catch (err) {
    console.error('[start] Failed to sync commands:', err);
  }
  
  // Build reply keyboard with user's language and connection status
  console.log('[start] About to create keyboard for language:', language);
  console.log('[start] Connection status:', { planka: ctx.session.plankaLinked, rastar: ctx.session.rastarLinked });
  const keyboard = getMainMenuKeyboard(language, {
    plankaLinked: ctx.session.plankaLinked,
    rastarLinked: ctx.session.rastarLinked,
  });
  console.log('[start] Keyboard created');
  
  // Get welcome message from user's pack or default pack
  const { getWelcomeMessage } = await import('../../config/welcome-messages.js');
  const welcomeMessage = await getWelcomeMessage(language as 'fa' | 'en', telegramUserId, name);
  
  console.log('[start] Sending welcome message with reply keyboard');
  // Send welcome message with reply keyboard (persistent buttons at bottom)
  await ctx.reply(welcomeMessage, await withThreadContext(ctx, { 
    parse_mode: 'HTML',
    reply_markup: keyboard
  }));
  console.log('[start] Reply sent successfully');
}

/**
 * Handle /menu command - Show keyboard menu
 */
export async function handleMenuCommand(ctx: BotContext) {
  const telegramUserId = String(ctx.from?.id ?? '');
  const telegramLanguage = ctx.from?.language_code;
  const language = await getUserLanguage(telegramUserId, telegramLanguage);
  const keyboard = getMainMenuKeyboard(language, {
    plankaLinked: ctx.session.plankaLinked,
    rastarLinked: ctx.session.rastarLinked,
  });
  
  await ctx.reply(
    [
      '⌨️ <b>' + ctx.t('menu-title') + '</b>',
      '',
      ctx.t('menu-use-buttons'),
      '',
      '📊 <b>' + ctx.t('menu-planka-status') + '</b> - ' + ctx.t('menu-planka-status-desc'),
      '🍽️ <b>' + ctx.t('menu-rastar-status') + '</b> - ' + ctx.t('menu-rastar-status-desc'),
      '📋 <b>' + ctx.t('menu-today-menu') + '</b> - ' + ctx.t('menu-today-menu-desc'),
      '⚠️ <b>' + ctx.t('menu-unselected-days') + '</b> - ' + ctx.t('menu-unselected-days-desc'),
      '🔴 <b>' + ctx.t('menu-delayed-tasks') + '</b> - ' + ctx.t('menu-delayed-tasks-desc'),
      '📂 <b>' + ctx.t('menu-my-boards') + '</b> - ' + ctx.t('menu-my-boards-desc'),
      '💬 <b>' + ctx.t('menu-new-chat') + '</b> - ' + ctx.t('menu-new-chat-desc'),
      '📚 <b>' + ctx.t('menu-history') + '</b> - ' + ctx.t('menu-history-desc'),
      '',
      ctx.t('menu-or-type'),
    ].join('\n'),
    await withThreadContext(ctx, { parse_mode: 'HTML', reply_markup: keyboard }),
  );
  
  // Also show Grammy inline menu
  const { showMainMenu } = await import('../../menus/index.js');
  await showMainMenu(ctx);
}
