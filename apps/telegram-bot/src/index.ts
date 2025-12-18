import dotenv from 'dotenv';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Bot } from 'grammy';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

import {
  createLinkState,
  deletePlankaToken,
  getPlankaToken,
  OpenRouterClient,
  trimConversationHistory,
  validateMessageHistory,
  getOrCreateChatSession,
  createNewChatSession,
  getSessionMessages,
  addMessage,
  listUserSessions,
  deleteChatSession,
  getSystemConfig,
  type ChatMessage,
} from '@rastar/shared';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import { executePlankaTool } from './planka-tools.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const LINK_PORTAL_BASE_URL = process.env.LINK_PORTAL_BASE_URL || 'http://localhost:8787';
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'rastaar_bot';

// Initialize AI client - will be set up after checking env and system config
let aiClient: OpenRouterClient | null = null;
let cachedApiKey: string | undefined = undefined;
let cachedModel: string | undefined = undefined;

/**
 * Get or initialize the AI client
 * Checks both environment variables and system config
 * Recreates client if API key or model changes
 */
async function getAiClient(): Promise<OpenRouterClient | null> {
  // Get current config (system config overrides env)
  const systemApiKey = await getSystemConfig('OPENROUTER_API_KEY');
  const systemModel = await getSystemConfig('DEFAULT_AI_MODEL');
  
  const apiKey = systemApiKey || process.env.OPENROUTER_API_KEY;
  const model = systemModel || process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey) {
    return null;
  }

  // Recreate client if settings changed
  if (!aiClient || cachedApiKey !== apiKey || cachedModel !== model) {
    // eslint-disable-next-line no-console
    console.log('[telegram-bot] Initializing AI client with model:', model);
    aiClient = new OpenRouterClient(apiKey, model);
    cachedApiKey = apiKey;
    cachedModel = model;
  }

  return aiClient;
}

/**
 * Get available AI tools for the user
 * Returns Planka tools if user has linked their account
 */
async function getAiTools(telegramUserId: string): Promise<ChatCompletionTool[]> {
  const token = await getPlankaToken(telegramUserId);
  console.log('[getAiTools] User has Planka token:', !!token);
  if (!token) {
    console.log('[getAiTools] No Planka token, returning empty tools');
    return [];
  }

  console.log('[getAiTools] Returning 6 Planka tools');
  // Define core Planka tools for AI assistant
  return [
    {
      type: 'function',
      function: {
        name: 'planka_projects_list',
        description: 'List all accessible Planka projects',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_boards_list',
        description: 'List all boards in a specific project',
        parameters: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The ID of the project',
            },
          },
          required: ['projectId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_lists_list',
        description: 'List all lists in a specific board',
        parameters: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board',
            },
          },
          required: ['boardId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_cards_search',
        description: 'Search for cards by keyword in a specific board',
        parameters: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board to search in',
            },
            query: {
              type: 'string',
              description: 'Search query to find cards',
            },
          },
          required: ['boardId', 'query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_cards_create',
        description: 'Create a new card in a Planka list',
        parameters: {
          type: 'object',
          properties: {
            listId: {
              type: 'string',
              description: 'The ID of the list where the card should be created',
            },
            name: {
              type: 'string',
              description: 'The title/name of the card',
            },
            description: {
              type: 'string',
              description: 'Optional: The description of the card',
            },
            position: {
              type: 'number',
              description: 'Optional: Position of the card in the list',
            },
          },
          required: ['listId', 'name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'planka_cards_update',
        description: 'Update an existing Planka card',
        parameters: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card to update',
            },
            name: {
              type: 'string',
              description: 'Optional: New name for the card',
            },
            description: {
              type: 'string',
              description: 'Optional: New description for the card',
            },
          },
          required: ['cardId'],
        },
      },
    },
  ];
}

const SYSTEM_PROMPT = `You are a helpful AI assistant integrated with a Telegram bot. You can help users manage their Planka tasks and boards.

When users ask about Planka, you can use the available tools to:
- List projects, boards, and lists
- Search for cards in boards
- Create new cards in lists
- Update existing cards

Always be concise and friendly. Use Telegram-friendly formatting (HTML tags like <b>, <i>, <code>).

When searching or listing data, first get the projects, then boards, then lists/cards as needed.`;

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /start', { fromId: ctx.from?.id, username: ctx.from?.username });
  
  const name = ctx.from?.first_name || 'there';
  const client = await getAiClient();
  const hasAI = client !== null;
  
  await ctx.reply(
    [
      `👋 <b>Hi ${name}!</b>`,
      '',
      hasAI
        ? '🤖 I\'m an AI assistant that can help you manage your Planka tasks right from Telegram.'
        : 'I can help you manage your Planka tasks right from Telegram.',
      '',
      '🔧 <b>Available Commands:</b>',
      '',
      '🔗 /link_planka - Connect your Planka account',
      '📊 /planka_status - Check connection status',
      '🔓 /planka_unlink - Disconnect your account',
      ...(hasAI
        ? [
            '💬 /new_chat - Start a new conversation',
            '📚 /history - View your chat sessions',
            '🗑️ /clear_chat - Clear current conversation',
          ]
        : []),
      '',
      '💡 <b>Getting Started:</b>',
      hasAI
        ? 'Just send me a message to start chatting! I can help you with Planka tasks once you connect your account with /link_planka'
        : 'Start by running /link_planka to connect your account!',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
});

bot.command('link_planka', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /link_planka', { telegramUserId });

  // Check if already linked
  const existingToken = await getPlankaToken(telegramUserId);
  if (existingToken) {
    await ctx.reply(
      [
        '✅ Your Planka account is already linked!',
        '',
        `Base URL: ${existingToken.plankaBaseUrl}`,
        '',
        '💡 To re-link your account:',
        '1. First run /planka_unlink',
        '2. Then run /link_planka again',
      ].join('\n'),
    );
    return;
  }

  const state = await createLinkState(telegramUserId);
  const linkUrl = `${stripTrailingSlash(LINK_PORTAL_BASE_URL)}/link/planka?state=${encodeURIComponent(state)}`;

  await ctx.reply(
    [
      '🔗 <b>Link Your Planka Account</b>',
      '',
      '1️⃣ Click the secure link below',
      '2️⃣ Enter your Planka credentials',
      '3️⃣ Return here after successful linking',
      '',
      `👉 <a href="${linkUrl}">Open Secure Link Portal</a>`,
      '',
      '⏱️ This link expires in 10 minutes',
      '🔒 Your password is never stored - only used to get an access token',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
});

bot.command('planka_status', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /planka_status', { telegramUserId });

  const token = await getPlankaToken(telegramUserId);
  if (!token) {
    await ctx.reply(
      [
        '❌ <b>Not Connected</b>',
        '',
        'Your Planka account is not linked yet.',
        '',
        '🔗 Run /link_planka to connect your account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
    return;
  }

  await ctx.reply(
    [
      '✅ <b>Connected</b>',
      '',
      `🌐 Base URL: <code>${token.plankaBaseUrl}</code>`,
      '',
      '💡 You can now use Planka commands in this bot',
      '',
      'To disconnect: /planka_unlink',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
});

bot.command('planka_unlink', async (ctx) => {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] /planka_unlink', { telegramUserId });

  const removed = await deletePlankaToken(telegramUserId);
  
  if (removed) {
    await ctx.reply(
      [
        '✅ <b>Account Unlinked</b>',
        '',
        'Your Planka account has been disconnected.',
        '',
        '🔗 Run /link_planka to connect again',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  } else {
    await ctx.reply(
      [
        'ℹ️ <b>No Account Linked</b>',
        '',
        'There was no Planka account connected to unlink.',
        '',
        '🔗 Run /link_planka to connect an account',
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  }
});

// ============================================================================
// AI Chat Commands
// ============================================================================

bot.command('new_chat', async (ctx) => {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured. Please set OPENROUTER_API_KEY in admin panel.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const session = await createNewChatSession(telegramUserId);
  await ctx.reply('✨ <b>New conversation started!</b>\n\nSend me a message to begin.', {
    parse_mode: 'HTML',
  });
});

bot.command('history', async (ctx) => {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const sessions = await listUserSessions(telegramUserId);
  
  if (sessions.length === 0) {
    await ctx.reply('📚 No chat sessions yet. Send me a message to start!');
    return;
  }

  const sessionList = sessions
    .slice(0, 5)
    .map((s, idx) => {
      const date = new Date(s.updatedAt).toLocaleDateString();
      const time = new Date(s.updatedAt).toLocaleTimeString();
      const msgCount = s.messageCount || 0;
      return `${idx + 1}. ${date} ${time} - ${msgCount} messages`;
    })
    .join('\n');

  await ctx.reply(
    `📚 <b>Recent Chat Sessions:</b>\n\n${sessionList}\n\n<i>Showing ${Math.min(5, sessions.length)} of ${sessions.length} sessions</i>`,
    { parse_mode: 'HTML' },
  );
});

bot.command('clear_chat', async (ctx) => {
  const client = await getAiClient();
  if (!client) {
    await ctx.reply('❌ AI chat is not configured.');
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram user.');
    return;
  }

  const session = await createNewChatSession(telegramUserId);
  await ctx.reply('🗑️ <b>Chat cleared!</b>\n\nStarting fresh. Send me a message!', {
    parse_mode: 'HTML',
  });
});

// ============================================================================
// AI Chat Handler (for regular messages)
// ============================================================================

bot.on('message:text', async (ctx) => {
  const client = await getAiClient();
  if (!client) {
    return; // AI not configured, ignore messages
  }

  const text = ctx.message.text;
  
  // Ignore commands (already handled above)
  if (text.startsWith('/')) {
    return;
  }

  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[telegram-bot] AI chat message', { telegramUserId, text: text.slice(0, 50) });

  try {
    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Get or create session
    const session = await getOrCreateChatSession(telegramUserId);

    // Get conversation history
    const messages = await getSessionMessages(session.id, 50);
    const chatHistory: ChatMessage[] = messages.map((m) => ({
      role: m.role as any,
      content: m.content,
      toolCallId: m.toolCallId || undefined,
      toolName: m.toolName || undefined,
      toolArgs: m.toolArgs || undefined,
    }));

    // Validate and clean message history (remove orphaned tool messages)
    const validatedHistory = validateMessageHistory(chatHistory);

    // Trim to fit context window
    const trimmedHistory = trimConversationHistory(validatedHistory, 30);

    // Add user message
    await addMessage(session.id, 'user', text);
    trimmedHistory.push({ role: 'user', content: text });

    // Get Planka tools if user has linked account
    const tools = await getAiTools(telegramUserId);
    console.log('[telegram-bot] Tools available:', tools.length);
    if (tools.length > 0) {
      console.log('[telegram-bot] Tool names:', tools.map(t => (t as any).function?.name).filter(Boolean));
    }

    // Get AI response with system prompt
    console.log('[telegram-bot] Conversation history length:', trimmedHistory.length);
    console.log('[telegram-bot] Last 2 messages:', JSON.stringify(trimmedHistory.slice(-2), null, 2));
    console.log('[telegram-bot] Calling AI with', tools.length, 'tools');
    let response = await client.chat(trimmedHistory, { systemPrompt: SYSTEM_PROMPT }, tools);
    console.log('[telegram-bot] AI response:', { 
      hasContent: !!response.content, 
      contentLength: response.content?.length || 0,
      toolCallsCount: response.toolCalls?.length || 0,
      finishReason: response.finishReason 
    });
    if (response.content) {
      console.log('[telegram-bot] AI response content:', response.content.substring(0, 200));
    }

    // Handle tool calls
    let maxToolCalls = 5; // Prevent infinite loops
    while (response.toolCalls && response.toolCalls.length > 0 && maxToolCalls > 0) {
      maxToolCalls--;

      for (const toolCall of response.toolCalls) {
        console.log('[telegram-bot] Tool call:', { id: toolCall.id, name: toolCall.name, args: toolCall.arguments });
        
        // Save assistant's tool call
        await addMessage(
          session.id,
          'assistant',
          '',
          toolCall.id,
          toolCall.name,
          toolCall.arguments,
        );

        // Execute tool
        const toolResult = await executePlankaTool(
          telegramUserId,
          toolCall.name,
          JSON.parse(toolCall.arguments),
        );
        console.log('[telegram-bot] Tool result:', { success: toolResult.success, contentLength: toolResult.content?.length || 0, error: toolResult.error });

        const resultContent = toolResult.success
          ? toolResult.content
          : `Error: ${toolResult.error}`;

        // Save tool result
        await addMessage(session.id, 'tool', resultContent, toolCall.id);

        // Add to history
        trimmedHistory.push({
          role: 'assistant',
          content: '',
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          toolArgs: toolCall.arguments,
        });
        trimmedHistory.push({
          role: 'tool',
          content: resultContent,
          toolCallId: toolCall.id,
        });
      }

      // Get next response from AI
      await ctx.replyWithChatAction('typing');
      response = await client.chat(trimConversationHistory(trimmedHistory, 30), {}, tools);
    }

    // Save assistant response
    if (response.content) {
      await addMessage(session.id, 'assistant', response.content);
    }

    // Send response to user
    const finalContent = response.content || '🤔 I processed your request but have nothing to say.';
    console.log('[telegram-bot] Sending final response, length:', finalContent.length);
    
    // Split long messages
    if (finalContent.length > 4000) {
      const chunks = finalContent.match(/.{1,4000}/gs) || [];
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'HTML' });
      }
    } else {
      await ctx.reply(finalContent, { parse_mode: 'HTML' });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[telegram-bot] AI chat error', error);
    
    // Provide more specific error messages
    let errorMessage = '❌ Sorry, I encountered an error processing your message. Please try again.';
    
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      
      if (errorStr.includes('tool use') || errorStr.includes('endpoints found')) {
        errorMessage = '❌ The current AI model doesn\'t support tool use (function calling). Please ask an admin to select a different model that supports tools, such as:\n\n' +
          '• anthropic/claude-3.5-sonnet\n' +
          '• openai/gpt-4-turbo\n' +
          '• google/gemini-pro-1.5\n\n' +
          'Tip: Avoid using "openrouter/auto" mode as it may route to models without tool support.';
      } else if (errorStr.includes('rate limit') || errorStr.includes('temporarily rate-limited')) {
        errorMessage = '❌ The AI model is temporarily rate-limited. Please try again in a few moments, or ask an admin to switch to a different model.';
      } else if (errorStr.includes('insufficient credits') || errorStr.includes('quota')) {
        errorMessage = '❌ Insufficient API credits. Please ask an admin to add credits to the OpenRouter account.';
      } else if (errorStr.includes('unauthorized') || errorStr.includes('401')) {
        errorMessage = '❌ API authentication failed. Please ask an admin to check the OpenRouter API key.';
      }
    }
    
    await ctx.reply(errorMessage);
  }
});

bot.catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] error', err);
});

try {
  // If this bot token was previously used in a webhook-based deployment,
  // polling will fail with a 409 conflict until the webhook is removed.
  await bot.api.deleteWebhook({ drop_pending_updates: true });
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[telegram-bot] failed to deleteWebhook (continuing)', err);
}

bot.start({
  onStart: (info) => {
    // eslint-disable-next-line no-console
    console.log(`[telegram-bot] started as @${info.username} (polling)`);
  },
});

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}
