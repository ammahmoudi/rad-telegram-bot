console.log('[telegram-bot] Starting bot initialization...');

import dotenv from 'dotenv';
import { marked } from 'marked';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Bot } from 'grammy';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

console.log('[telegram-bot] Environment loaded');

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

import { executeMcpTool } from './planka-tools.js';
import { initializeMcpServers, getMcpManager } from './mcp-client.js';

/**
 * Convert markdown to Telegram HTML format
 * Handles: **bold**, __underline__, *italic*, _italic_
 * Also escapes HTML entities for safety
 */
function markdownToTelegramHtml(text: string): string {
  // Use marked to parse markdown, then convert to Telegram-safe HTML
  const html = marked.parse(text, { async: false }) as string;
  
  return html
    // Convert standard HTML tags to Telegram-supported ones
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<strong>/g, '<b>')
    .replace(/<\/strong>/g, '</b>')
    .replace(/<em>/g, '<i>')
    .replace(/<\/em>/g, '</i>')
    .replace(/<h[1-6]>/g, '<b>')
    .replace(/<\/h[1-6]>/g, '</b>\n')
    .replace(/<ul>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<code>/g, '<code>')
    .replace(/<\/code>/g, '</code>')
    .replace(/<pre><code>/g, '<pre>')
    .replace(/<\/code><\/pre>/g, '</pre>')
    // Remove any other unsupported HTML tags
    .replace(/<[^>]+>/g, '')
    .trim();
}

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
 * Returns MCP tools if user has access
 * Throws error if Planka authentication fails
 */
async function getAiTools(telegramUserId: string): Promise<ChatCompletionTool[]> {
  const token = await getPlankaToken(telegramUserId);
  console.log('[getAiTools] User has Planka token:', !!token);
  if (!token) {
    console.log('[getAiTools] No Planka token, returning empty tools');
    return [];
  }

  // Get tools dynamically from MCP server
  const manager = getMcpManager();
  try {
    const mcpTools = await manager.listTools('planka');
    console.log('[getAiTools] Found', mcpTools.length, 'MCP tools');
    
    // Temporarily disabled tools (causing issues with Gemini)
    const disabledTools = [
      'planka.users.listAll',
      'planka.cards.searchGlobal'
    ];
    
    // Filter out disabled tools
    const enabledTools = mcpTools.filter(tool => !disabledTools.includes(tool.name));
    console.log('[getAiTools] Enabled tools after filtering:', enabledTools.length);
    
    // Convert MCP tools to OpenAI function calling format
    // Replace dots with underscores in tool names (OpenAI requires ^[a-zA-Z0-9_-]+$)
    const aiTools: ChatCompletionTool[] = enabledTools.map((tool) => {
      // Clone the input schema to avoid modifying the original
      const inputSchema = JSON.parse(JSON.stringify(tool.inputSchema || {}));
      
      // Remove credential parameters since bot will inject them automatically
      if (inputSchema.properties) {
        delete inputSchema.properties.plankaBaseUrl;
        delete inputSchema.properties.plankaToken;
      }
      
      // Remove credentials from required array and clean up
      if (inputSchema.required && Array.isArray(inputSchema.required)) {
        inputSchema.required = inputSchema.required.filter(
          (param: string) => param !== 'plankaBaseUrl' && param !== 'plankaToken'
        );
        
        // Validate that all required properties exist in properties
        if (inputSchema.properties) {
          inputSchema.required = inputSchema.required.filter(
            (param: string) => param in inputSchema.properties
          );
        }
        
        // Remove required array if empty (some AI providers don't like empty required arrays)
        if (inputSchema.required.length === 0) {
          delete inputSchema.required;
        }
      }
      
      return {
        type: 'function' as const,
        function: {
          name: tool.name.replace(/\./g, '_'),
          description: tool.description || '',
          parameters: inputSchema,
        },
      };
    });
    
    return aiTools;
  } catch (error) {
    console.error('[getAiTools] Error listing MCP tools:', error);
    return [];
  }
}

// Old static tool definitions (commented out, now using MCP server):
/*
async function getAiToolsOld(telegramUserId: string): Promise<ChatCompletionTool[]> {
  const token = await getPlankaToken(telegramUserId);
  if (!token) {
    return [];
  }
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
*/

const SYSTEM_PROMPT = `You are a friendly and helpful Planka project management assistant integrated with Telegram.

🎯 YOUR ROLE:
- Be conversational and friendly in casual chats
- Help users manage their Planka tasks and projects
- Always provide clear, helpful responses
- CRITICAL: You MUST always generate a text response - never finish without saying something!

💬 RESPONDING TO USERS:
When user says "hi", "hello", "hey": Respond warmly like "Hi! 👋 I'm here to help you manage your Planka tasks. How can I assist you today?"

When asked "what can you do?": Explain you can help with Planka project management - viewing tasks, creating cards, searching projects, etc.

For casual chat: Respond naturally and friendly, no tools needed.

For task questions: Use tools, then summarize findings in a friendly way.

NEVER send empty responses - always include text!

🎨 FORMATTING (HTML parse_mode):
- Use: <b>bold</b> <i>italic</i> <u>underline</u> <code>code</code>
- DON'T use: **bold** *italic* (these show as literal text!)
- Emojis are great: 📅 🔴 🟡 ✅ 👤 📂

📋 TASK DISPLAY FORMAT:
<b>📊 Tasks for John</b>

🔴 <b>Urgent</b>
• <b>Deploy hotfix</b>
  📅 Due: 2025-12-20
  👤 John Smith
  📂 Backend Services

<b>📈 Summary:</b> 1 task found

Examples:
User: "hi"
You: "Hi! 👋 I'm your Planka assistant. I can help you view tasks, create cards, search projects, and more. What would you like to do?"

User: "show me my tasks"  
You: [use tools, then] "Here are your tasks: [list them]"`;



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

  console.log('[telegram-bot] /planka_link - generated URL:', linkUrl);

  await ctx.reply(
    [
      '🔗 <b>Link Your Planka Account</b>',
      '',
      '1️⃣ Click the link below (or copy and paste in browser):',
      `<a href="${linkUrl}">Open Secure Link Portal</a>`,
      '',
      '📋 Or copy this URL:',
      `<code>${linkUrl}</code>`,
      '',
      '2️⃣ Enter your Planka credentials',
      '3️⃣ Return here after successful linking',
      '',
      '⏱️ This link expires in 10 minutes',
      '🔒 Your password is never stored - only used to get an access token',
      '',
      '💡 <i>Note: Localhost links may not be clickable - use the URL above</i>',
    ].join('\n'),
    { 
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true }
    },
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

  // Create new session
  await createNewChatSession(telegramUserId);
  await ctx.reply(
    [
      '✨ <b>New Chat Started</b>',
      '',
      '🧹 Previous conversation history has been cleared.',
      '💬 Send me a message to start a fresh conversation!',
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
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
    .map((s: any, idx: number) => {
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

// Helper function to get chat history as ChatMessage array
async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const messages = await getSessionMessages(sessionId, 50);
  return messages.map((m: any) => ({
    role: m.role as any,
    content: m.content,
    toolCallId: m.toolCallId || undefined,
    toolName: m.toolName || undefined,
    toolArgs: m.toolArgs || undefined,
  }));
}

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
    // Show typing indicator (ignore network errors)
    try {
      await ctx.replyWithChatAction('typing');
    } catch (typingError) {
      // Ignore typing indicator errors - they're not critical
      console.log('[telegram-bot] Could not send typing indicator (network issue)');
    }

    // Get or create session
    const session = await getOrCreateChatSession(telegramUserId);

    // Get conversation history
    const messages = await getSessionMessages(session.id, 50);
    const chatHistory: ChatMessage[] = messages.map((m: any) => ({
      role: m.role as any,
      content: m.content,
      toolCallId: m.toolCallId || undefined,
      toolName: m.toolName || undefined,
      toolArgs: m.toolArgs || undefined,
    }));

    // For Gemini models, strip out tool call history since we don't store reasoning_details
    // This prevents "missing thought_signature" errors on follow-up questions
    const isGemini = client.model.includes('gemini') || client.model.includes('google');
    const cleanedHistory = isGemini 
      ? chatHistory.filter(msg => 
          // Keep user messages and assistant text responses, remove tool calls and results
          msg.role === 'user' || 
          (msg.role === 'assistant' && !msg.toolName && msg.content)
        )
      : chatHistory;

    // Validate and clean message history (remove orphaned tool messages)
    const validatedHistory = validateMessageHistory(cleanedHistory);

    // Add user message
    await addMessage(session.id, 'user', text);
    validatedHistory.push({ role: 'user', content: text });

    // Trim to fit context window (keep last 20 messages)
    const trimmedHistory = trimConversationHistory(validatedHistory, 20);

    // Get Planka tools if user has linked account
    let tools: ChatCompletionTool[] = [];
    let plankaAuthFailed = false;
    try {
      tools = await getAiTools(telegramUserId);
      console.log('[telegram-bot] Tools available:', tools.length);
      if (tools.length > 0) {
        console.log('[telegram-bot] Tool names:', tools.map(t => (t as any).function?.name).filter(Boolean));
      }
    } catch (error) {
      plankaAuthFailed = true;
      console.log('[telegram-bot] Failed to get Planka tools:', error instanceof Error ? error.message : error);
      
      // Check if user has a token that's invalid (needs re-auth)
      const hasInvalidToken = error instanceof Error && error.message.includes('authenticate');
      
      if (hasInvalidToken) {
        await ctx.reply(
          '⚠️ <b>Planka Authentication Error</b>\n\n' +
          'Your Planka credentials have expired or are invalid.\n\n' +
          '🔄 <b>To fix this:</b>\n' +
          '1. Run /planka_unlink to disconnect\n' +
          '2. Run /link_planka to reconnect with fresh credentials\n\n' +
          '<i>Your previous tasks and data are safe - you just need to re-authenticate.</i>',
          { parse_mode: 'HTML' }
        );
      }
    }
    
    // If user asked for Planka-specific task and auth failed, stop here
    if (plankaAuthFailed && (text.toLowerCase().includes('task') || text.toLowerCase().includes('تسک') || text.toLowerCase().includes('planka'))) {
      return;
    }

    console.log('[telegram-bot] Conversation history length:', trimmedHistory.length);
    console.log('[telegram-bot] Last 3 messages:', JSON.stringify(trimmedHistory.slice(-3).map((m: any) => ({ role: m.role, content: m.content?.substring(0, 100) || '(tool call)', toolName: m.toolName })), null, 2));
    console.log('[telegram-bot] Calling AI with streaming and', tools.length, 'tools');
    
    // Create initial message for live updates
    let displayContent = '💭 <i>Thinking...</i>';
    let toolCallsDisplay: string[] = [];
    let activeTools = new Set<string>();
    
    // Send initial message, retry once if network fails
    let sentMessage;
    try {
      sentMessage = await ctx.reply(displayContent, { parse_mode: 'HTML' });
    } catch (replyError) {
      console.error('[telegram-bot] Failed to send initial message, retrying...', replyError);
      // Wait 1 second and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        sentMessage = await ctx.reply(displayContent, { parse_mode: 'HTML' });
      } catch (retryError) {
        // If both attempts fail, inform user and exit
        console.error('[telegram-bot] Failed to send message after retry', retryError);
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
    }
    
    let lastUpdateTime = Date.now();
    let reasoningActive = false;
    let reasoningText = '';
    
    // Track all reasoning and tool calls for final summary
    let allReasoningTexts: string[] = [];
    let allToolCallsMade: Array<{ name: string, args?: any }> = [];
    
    // Track reasoning steps with their associated tools
    interface ReasoningStep {
      reasoning: string;
      tools: string[];
    }
    let reasoningSteps: ReasoningStep[] = [];
    let currentStepTools: string[] = [];
    
    // Loading animation
    const loadingFrames = ['⏳', '⌛'];
    let loadingFrameIndex = 0;
    
    // Stream AI response with live updates
    const maxToolCallsConfig = await getSystemConfig('maxToolCalls');
    let maxToolCalls = maxToolCallsConfig ? parseInt(maxToolCallsConfig) : 30;
    let totalToolCallsMade = 0;
    let finalResponse = '';
    let reasoningDetails: unknown = undefined;
    
    // Helper function to format tool name nicely
    const formatToolName = (toolName: string): string => {
      // Convert planka_cards_search -> 🔧 Cards Search
      const parts = toolName.replace('planka_', '').split('_');
      const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      return `🔧 ${formatted}`;
    };
    
    // Helper to update message (with rate limiting)
    const updateMessage = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastUpdateTime < 500) return; // Rate limit: 2 updates per second
      
      lastUpdateTime = now;
      
      let content = '';
      
      // Show reasoning indicator if active
      if (reasoningActive && reasoningText) {
        content += '🧠 <b>Reasoning...</b>\n\n';
        const formattedReasoning = markdownToTelegramHtml(reasoningText);
        content += '<blockquote>' + formattedReasoning.substring(0, 500) + '</blockquote>\n\n';
      } else if (reasoningActive) {
        content += '🧠 <i>Reasoning...</i>\n\n';
      }
      
      // Show active tools
      if (toolCallsDisplay.length > 0) {
        content += '<b>🛠️ Tools in use:</b>\n';
        content += toolCallsDisplay.map(t => `  ${t}`).join('\n');
        content += '\n\n';
      }
      
      // Show accumulated response content
      if (finalResponse) {
        content += markdownToTelegramHtml(finalResponse);
      } else if (!reasoningActive && toolCallsDisplay.length === 0) {
        content += '💭 <i>Generating response...</i>';
      }
      
      try {
        await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, content, { parse_mode: 'HTML' });
      } catch (error) {
        // Ignore errors from too frequent updates or identical content
      }
    };
    
    try {
      const stream = client.streamChat(trimmedHistory, { systemPrompt: SYSTEM_PROMPT }, tools);
      
      for await (const chunk of stream) {
        if (chunk.type === 'reasoning') {
          reasoningActive = true;
          if (chunk.content) {
            reasoningText = chunk.content;
            allReasoningTexts.push(chunk.content);
          }
          console.log('[telegram-bot] 🧠 Reasoning chunk received');
          await updateMessage();
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          reasoningActive = false;
          const toolName = chunk.toolCall.name;
          
          if (!activeTools.has(toolName)) {
            activeTools.add(toolName);
            toolCallsDisplay.push(formatToolName(toolName));
            allToolCallsMade.push({ name: toolName, args: chunk.toolCall.arguments });
            currentStepTools.push(toolName); // Track tool for current reasoning step
            totalToolCallsMade++;
            console.log('[telegram-bot] 🔧 Tool call:', toolName);
            await updateMessage();
          }
        } else if (chunk.type === 'content' && chunk.content) {
          reasoningActive = false;
          finalResponse += chunk.content;
          console.log('[telegram-bot] 💬 Content chunk:', chunk.content.substring(0, 50));
          await updateMessage();
        } else if (chunk.type === 'done') {
          // Save final reasoning step with its tools
          if (reasoningText && currentStepTools.length > 0) {
            reasoningSteps.push({
              reasoning: reasoningText,
              tools: [...currentStepTools]
            });
            currentStepTools = [];
          }
          
          reasoningDetails = chunk.reasoningDetails;
          reasoningActive = false;
          reasoningText = '';
          console.log('[telegram-bot] ✅ Streaming complete');
          console.log('[telegram-bot] Done event:', {
            finishReason: chunk.finishReason,
            contentLength: chunk.content?.length || 0
          });
          
          // If the done event has content we haven't seen yet, add it
          if (chunk.content && !finalResponse) {
            finalResponse = chunk.content;
            console.log('[telegram-bot] Using content from done event');
          }
        }
      }
      
      console.log('[telegram-bot] Stream finished, total response length:', finalResponse.length);
      
      console.log('[telegram-bot] Stream finished, total response length:', finalResponse.length);
      
      // Force final update only if we have content to show
      if (finalResponse || toolCallsDisplay.length > 0) {
        await updateMessage(true);
      }
      
      // Now handle tool execution if tools were called
      // We need to re-run the AI to get the actual tool call objects with IDs and arguments
      // For now, fall back to non-streaming for tool execution rounds
      
      if (totalToolCallsMade > 0 && maxToolCalls > 0) {
        console.log('[telegram-bot] Tools were called, executing them...');
        
        // Get full response with tool calls
        let response = await client.chat(trimmedHistory, { systemPrompt: SYSTEM_PROMPT }, tools);
        
        // Handle tool calls (same logic as before)
        while (response.toolCalls && response.toolCalls.length > 0 && maxToolCalls > 0) {
          maxToolCalls--;

          // Add tool calls to history and database
          for (const toolCall of response.toolCalls) {
            await addMessage(
              session.id,
              'assistant',
              '',
              toolCall.id,
              toolCall.name,
              toolCall.arguments,
            );
          }
          
          // Map reasoning details to tool calls by ID
          const reasoningByToolCallId = new Map<string, any>();
          if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
            for (const detail of response.reasoningDetails) {
              if (detail.id) {
                // Store reasoning details for this specific tool call
                if (!reasoningByToolCallId.has(detail.id)) {
                  reasoningByToolCallId.set(detail.id, []);
                }
                reasoningByToolCallId.get(detail.id)!.push(detail);
              }
            }
          }
          
          const assistantMessages: ChatMessage[] = response.toolCalls.map(tc => ({
            role: 'assistant',
            content: '',
            toolCallId: tc.id,
            toolName: tc.name,
            toolArgs: tc.arguments,
            reasoningDetails: response.reasoningDetails, // All reasoning for this turn
            toolCallReasoningDetails: reasoningByToolCallId.get(tc.id), // Reasoning specific to this tool call
          }));
          
          trimmedHistory.push(...assistantMessages);

          // Execute tools
          for (const toolCall of response.toolCalls) {
            const mcpToolName = toolCall.name.replace(/_/g, '.');
            
            // Track tool for summary AND display
            if (!activeTools.has(toolCall.name)) {
              activeTools.add(toolCall.name);
              allToolCallsMade.push({ name: toolCall.name, args: toolCall.arguments });
              
              // Add to display list so user sees it
              const toolDisplayName = formatToolName(toolCall.name);
              if (!toolCallsDisplay.includes(toolDisplayName)) {
                toolCallsDisplay.push(toolDisplayName);
                
                // Update message immediately to show new tool
                loadingFrameIndex = (loadingFrameIndex + 1) % loadingFrames.length;
                const loadingEmoji = loadingFrames[loadingFrameIndex];
                
                let tempReasoningDisplay = '';
                if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
                  const textDetails = response.reasoningDetails
                    .filter((detail: any) => detail.type === 'reasoning.text')
                    .map((detail: any) => detail.text)
                    .join('\n\n');
                  if (textDetails) {
                    tempReasoningDisplay = '🧠 <b>Reasoning...</b>\n\n<blockquote>' + 
                      markdownToTelegramHtml(textDetails).substring(0, 500) + 
                      (textDetails.length > 500 ? '...' : '') + 
                      '</blockquote>\n\n';
                  }
                }
                
                let tempToolsDisplay = `<b>🛠️ Tools ${loadingEmoji}</b>\n`;
                tempToolsDisplay += toolCallsDisplay.map(t => `  ${t}`).join('\n') + '\n';
                tempToolsDisplay += `\n💭 <i>Executing ${toolDisplayName.replace('🔧 ', '')}...</i> ${loadingEmoji}`;
                
                try {
                  await ctx.api.editMessageText(
                    sentMessage.chat.id,
                    sentMessage.message_id,
                    tempReasoningDisplay + tempToolsDisplay,
                    { parse_mode: 'HTML' }
                  );
                } catch (editError: any) {
                  // Ignore errors
                }
              }
            }
            
            const toolResult = await executeMcpTool(
              telegramUserId,
              mcpToolName,
              JSON.parse(toolCall.arguments),
            );

            const resultContent = toolResult.success
              ? toolResult.content
              : `Error: ${toolResult.error}`;

            await addMessage(session.id, 'tool', resultContent, toolCall.id);
            trimmedHistory.push({
              role: 'tool',
              content: resultContent,
              toolCallId: toolCall.id,
            });
          }

          // Update display to show we're processing results
          // Extract reasoning if available to show user
          let reasoningDisplay = '';
          if (response.reasoningDetails && Array.isArray(response.reasoningDetails)) {
            const textDetails = response.reasoningDetails
              .filter((detail: any) => detail.type === 'reasoning.text')
              .map((detail: any) => detail.text)
              .join('\n\n');
            if (textDetails) {
              // Save previous reasoning step with tools before starting new one
              if (reasoningText && currentStepTools.length > 0) {
                reasoningSteps.push({
                  reasoning: reasoningText,
                  tools: [...currentStepTools]
                });
                currentStepTools = [];
              }
              
              allReasoningTexts.push(textDetails);
              reasoningText = textDetails;
              
              // Track tools from this execution phase
              for (const tc of response.toolCalls) {
                if (!currentStepTools.includes(tc.name)) {
                  currentStepTools.push(tc.name);
                }
              }
              
              const formattedReasoning = markdownToTelegramHtml(textDetails);
              reasoningDisplay = '🧠 <b>Reasoning...</b>\n\n<blockquote>' + 
                formattedReasoning.substring(0, 500) + 
                (textDetails.length > 500 ? '...' : '') + 
                '</blockquote>\n\n';
            }
          }
          
          // Build tools list with animation
          loadingFrameIndex = (loadingFrameIndex + 1) % loadingFrames.length;
          const loadingEmoji = loadingFrames[loadingFrameIndex];
          
          let toolsDisplay = `<b>🛠️ Tools ${loadingEmoji}</b>\n`;
          if (toolCallsDisplay.length > 0) {
            toolsDisplay += toolCallsDisplay.map(t => `  ${t}`).join('\n') + '\n';
          }
          
          displayContent = reasoningDisplay + toolsDisplay + `\n💭 <i>Analyzing results...</i> ${loadingEmoji}`;
          try {
            await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, displayContent, { parse_mode: 'HTML' });
          } catch (error: any) {
            // Ignore message not modified errors
            if (!error?.description?.includes('message is not modified')) {
              console.error('[telegram-bot] Failed to update message:', error.message);
            }
          }

          // Get next response
          response = await client.chat(trimConversationHistory(trimmedHistory, 20), { systemPrompt: SYSTEM_PROMPT }, tools);
          
          if (response.content) {
            finalResponse = response.content;
          }
        }
      }

      // Save final response
      if (finalResponse) {
        await addMessage(session.id, 'assistant', finalResponse);
      } else {
        console.log('[telegram-bot] WARNING: No content in final response!');
        
        // Force summarization if needed
        if (totalToolCallsMade > 0) {
          console.log('[telegram-bot] Attempting forced summarization after', totalToolCallsMade, 'tool calls');
          
          const summaryPrompt: ChatMessage = {
            role: 'user',
            content: 'Based on the tool results above, please provide a summary of what you discovered. ' +
                     'If all results were empty or no data was found, explicitly tell me that. ' +
                     'The user is waiting for your response - you must provide text output.'
          };
          
          // Use trimmedHistory which preserves reasoning_details, not database history
          const forcedResponse = await client.chat([...trimmedHistory, summaryPrompt], { systemPrompt: SYSTEM_PROMPT }, tools);
          
          if (forcedResponse.content) {
            finalResponse = forcedResponse.content;
            await addMessage(session.id, 'user', summaryPrompt.content);
            await addMessage(session.id, 'assistant', forcedResponse.content);
          }
        }
      }

      // Final display
      let finalContent: string;
      
      if (!finalResponse) {
        if (totalToolCallsMade === 0) {
          finalContent = '🤔 I didn\'t know how to respond. Could you try rephrasing your question?';
        } else {
          // Build a detailed summary even when final response fails
          let detailedSummary = '⚠️ <b>Response Generation Issue</b>\n\n';
          detailedSummary += `I executed ${totalToolCallsMade} tool ${totalToolCallsMade === 1 ? 'call' : 'calls'}, but couldn't generate a final summary.\n\n`;
          
          // Show reasoning steps with their associated tools
          if (reasoningSteps.length > 0) {
            detailedSummary += '🧠 <b>What I Did:</b>\n\n';
            reasoningSteps.forEach((step, i) => {
              const cleanText = markdownToTelegramHtml(step.reasoning.substring(0, 250));
              detailedSummary += `<b>Step ${i + 1}:</b>\n${cleanText}${step.reasoning.length > 250 ? '...' : ''}\n\n`;
              
              if (step.tools.length > 0) {
                detailedSummary += '<i>↳ Tools used:</i>\n';
                step.tools.forEach(toolName => {
                  const toolDisplayName = formatToolName(toolName).replace('🔧 ', '');
                  detailedSummary += `  • ${toolDisplayName}\n`;
                });
                detailedSummary += '\n';
              }
            });
          } else if (allToolCallsMade.length > 0) {
            // Fallback: show tools if no reasoning steps were captured
            detailedSummary += '🔧 <b>Tools Called:</b>\n';
            allToolCallsMade.forEach((tool, i) => {
              const toolDisplayName = formatToolName(tool.name).replace('🔧 ', '');
              detailedSummary += `${i + 1}. ${toolDisplayName}\n`;
            });
            detailedSummary += '\n';
          }
          
          detailedSummary += '💡 <b>What you can do:</b>\n';
          detailedSummary += '• Ask me to "summarize what you found"\n';
          detailedSummary += '• Try rephrasing your question\n';
          detailedSummary += '• Be more specific about what you need\n\n';
          detailedSummary += '<i>This is a known limitation with the AI model.</i>';
          
          finalContent = detailedSummary;
        }
      } else {
        finalContent = markdownToTelegramHtml(finalResponse);
        
        // Add expandable summary if there was reasoning or tool calls
        if (reasoningSteps.length > 0 || allToolCallsMade.length > 0) {
          let summaryContent = '';
          
          if (reasoningSteps.length > 0) {
            summaryContent += '🧠 <b>What I Did:</b>\n\n';
            reasoningSteps.forEach((step, i) => {
              // Clean and truncate text properly
              const cleanText = step.reasoning
                .replace(/\*\*/g, '') // Remove bold
                .replace(/`/g, '') // Remove code markers
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .substring(0, 200) // Limit to 200 chars per step
                .trim();
              
              summaryContent += `<b>Step ${i + 1}:</b>\n${cleanText}${step.reasoning.length > 200 ? '...' : ''}\n`;
              
              // Show tools used in this step
              if (step.tools.length > 0) {
                summaryContent += '<i>↳ Tools:</i> ';
                summaryContent += step.tools.map(t => formatToolName(t).replace('🔧 ', '')).join(', ');
                summaryContent += '\n';
              }
              summaryContent += '\n';
            });
          } else if (allToolCallsMade.length > 0) {
            // Fallback if no reasoning steps
            summaryContent += '🔧 <b>Tools Used:</b>\n';
            allToolCallsMade.forEach((tool, i) => {
              const toolDisplayName = formatToolName(tool.name).replace('🔧 ', '');
              summaryContent += `${i + 1}. ${toolDisplayName}\n`;
            });
          }
          
          // Only add summary if finalContent + summary won't exceed Telegram's limit
          const summaryBlock = '\n\n<blockquote expandable>💡 <b>Process Summary</b>\n\n' + 
            summaryContent + '</blockquote>';
          
          if ((finalContent.length + summaryBlock.length) < 3800) {
            finalContent += summaryBlock;
          }
        }
      }
      
      console.log('[telegram-bot] Sending final response, length:', finalContent.length);
      console.log('[telegram-bot] Final response content:', finalContent.substring(0, 500));
      
      // Update with final content or send new messages for long content
      if (finalContent.length > 4000) {
        // Delete the streaming message and send chunks
        try {
          await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
        } catch (delError) {
          console.log('[telegram-bot] Could not delete message, continuing...');
        }
        const chunks = finalContent.match(/.{1,4000}/gs) || [];
        for (const chunk of chunks) {
          await ctx.reply(chunk, { parse_mode: 'HTML' });
        }
      } else {
        try {
          await ctx.api.editMessageText(sentMessage.chat.id, sentMessage.message_id, finalContent, { parse_mode: 'HTML' });
        } catch (editError) {
          // If edit fails (e.g., message deleted or network error), send as new message
          console.log('[telegram-bot] Could not edit message, sending new message instead');
          await ctx.reply(finalContent, { parse_mode: 'HTML' });
        }
      }
      
    } catch (streamError) {
      console.error('[telegram-bot] Streaming error:', streamError);
      
      // Try to clean up the "Thinking..." message
      try {
        await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
      } catch (delError) {
        // Ignore if delete fails
      }
      
      // Check if it's a network/connection error
      if (streamError instanceof Error) {
        const errMsg = streamError.message.toLowerCase();
        if (errMsg.includes('terminated') || errMsg.includes('socket') || errMsg.includes('closed') || errMsg.includes('econnreset')) {
          // Network error - provide helpful message
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
          return; // Don't throw, we handled it
        }
      }
      
      throw streamError;
    }
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[telegram-bot] AI chat error', error);
    
    // Provide more specific error messages
    let errorMessage = '❌ Sorry, I encountered an error processing your message. Please try again.';
    
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      
      if (errorStr.includes('network connection failed') || errorStr.includes('socket hang up') || errorStr.includes('econnreset')) {
        errorMessage = '⚠️ <b>Network Connection Issue</b>\n\n' +
          'Could not connect to Telegram servers. This is usually temporary.\n\n' +
          '💡 <b>Try:</b>\n' +
          '• Wait a moment and send your message again\n' +
          '• Check your internet connection\n' +
          '• If the problem persists, it may be a Telegram server issue';
      } else if (errorStr.includes('tool use') || errorStr.includes('endpoints found')) {
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
    
    // Try to send error message, with retry logic
    try {
      await ctx.reply(errorMessage, { parse_mode: 'HTML' });
    } catch (replyError) {
      console.error('[telegram-bot] Failed to send error message, retrying without HTML...', replyError);
      try {
        // Retry without HTML formatting
        await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
      } catch (finalError) {
        console.error('[telegram-bot] Could not send any error message to user', finalError);
        // Nothing more we can do - user will see nothing :(
      }
    }
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

// Initialize MCP servers before starting the bot
try {
  // eslint-disable-next-line no-console
  console.log('[telegram-bot] Initializing MCP servers...');
  await initializeMcpServers();
  // eslint-disable-next-line no-console
  console.log('[telegram-bot] MCP servers initialized successfully');
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] Failed to initialize MCP servers:', err);
  // eslint-disable-next-line no-console
  console.log('[telegram-bot] Bot will start without MCP tools');
}

bot.start({
  onStart: (info) => {
    // eslint-disable-next-line no-console
    console.log(`[telegram-bot] started as @${info.username} (polling)`);
  },
});

// Keep process alive and handle errors
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[telegram-bot] Uncaught exception:', err);
});

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}
