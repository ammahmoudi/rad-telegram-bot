console.log('[telegram-bot] Starting bot initialization...');

import dotenv from 'dotenv';

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

const SYSTEM_PROMPT = `You are a helpful Planka project management assistant. This is a Telegram bot using HTML parse mode.

🎯 CRITICAL RULES - READ CAREFULLY:

1. ⚠️ **MANDATORY TEXT RESPONSES** ⚠️
   - You MUST ALWAYS provide a text response after using tools
   - NEVER finish a turn without text - the user is waiting!
   - If tools return empty results (0 cards, no data): Tell the user "No results found"
   - If tools return data: Summarize what you discovered
   - If tools fail: Explain what went wrong
   - NO EXCEPTIONS - Every response needs text content!

2. 🎨 **HTML FORMATTING ONLY** (parse_mode='HTML'):
   ✅ USE: <b>bold</b> <i>italic</i> <u>underline</u> <s>strikethrough</s> <code>code</code>
   ❌ NEVER USE: **bold** __underline__ *italic* _italic_ (these will appear as literal characters!)
   
3. 🔤 **HTML Entity Escaping**:
   - Use &amp; for &
   - Use &lt; for <
   - Use &gt; for >
   - Use &quot; for " in attributes

4. 🚀 **EFFICIENT TASK SEARCHING**:
   ⚡ ALWAYS use planka_cards_searchGlobal FIRST - it searches ALL projects at once
   ⚡ Only use project/board listing if the user explicitly asks to see projects/boards
   ⚡ If global search returns empty: Tell the user immediately, don't dig deeper
   
   Example:
   User: "Show tasks for Sarah"
   ✅ CORRECT: planka_cards_searchGlobal(query: "Sarah") → summarize results
   ❌ WRONG: List all projects → list all boards → search each one

5. 📋 **RESPONSE FORMAT**:
   - Use emojis to make responses scannable: 📅 🔴 🟡 ✅ 👤 📂
   - Show dates in YYYY-MM-DD format
   - Group tasks by urgency (urgent → this week → later)
   - Always provide a summary count at the end
   - Use proper HTML tags and entities

Example task list format:

<b>📊 Tasks for John Smith</b>

🔴 <b>Urgent - Due Today</b>
• <b>Deploy hotfix to production</b>
  📅 Due: 2025-12-20
  📍 Status: In Progress
  👤 Assigned: John Smith
  📂 Project: <i>Backend Services</i>

🟡 <b>This Week</b>
• <b>Code review for feature X</b>
  📅 Due: 2025-12-22
  📍 Status: To Do
  📂 Project: <i>Frontend</i>

✅ <b>Completed</b>
• <b>Update documentation</b>
  📅 Completed: 2025-12-18
  📂 Project: <i>Docs</i>

<b>📈 Summary:</b> 3 tasks total (1 urgent, 1 this week, 1 completed)

Remember: Always respond with text after tool calls. Users are waiting for your analysis!`;


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

    // Get AI response with system prompt
    console.log('[telegram-bot] Conversation history length:', trimmedHistory.length);
    console.log('[telegram-bot] Last 3 messages:', JSON.stringify(trimmedHistory.slice(-3).map((m: any) => ({ role: m.role, content: m.content?.substring(0, 100) || '(tool call)', toolName: m.toolName })), null, 2));
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
    // TODO: Make this configurable in admin settings
    const maxToolCallsConfig = await getSystemConfig('maxToolCalls');
    let maxToolCalls = maxToolCallsConfig ? parseInt(maxToolCallsConfig) : 30; // Default: 5 rounds
    let totalToolCallsMade = 0;
    while (response.toolCalls && response.toolCalls.length > 0 && maxToolCalls > 0) {
      maxToolCalls--;
      totalToolCallsMade += response.toolCalls.length;

      // Add ONE assistant message with ALL tool calls (with reasoning_details if present)
      // This must come BEFORE we process the tool calls
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
      
      // Add to history as a single group with reasoning_details
      const assistantMessages: ChatMessage[] = response.toolCalls.map(tc => ({
        role: 'assistant',
        content: '',
        toolCallId: tc.id,
        toolName: tc.name,
        toolArgs: tc.arguments,
      }));
      
      // Only the FIRST assistant message in this batch gets reasoning_details
      if (response.reasoningDetails) {
        assistantMessages[0].reasoningDetails = response.reasoningDetails;
        console.log('[telegram-bot] Preserving reasoning_details for tool call batch:', {
          hasReasoningDetails: true,
          isArray: Array.isArray(response.reasoningDetails),
          length: Array.isArray(response.reasoningDetails) ? response.reasoningDetails.length : 'N/A',
          toolCallsInBatch: response.toolCalls.length
        });
      }
      
      trimmedHistory.push(...assistantMessages);

      // Now execute each tool and add results
      for (const toolCall of response.toolCalls) {
        console.log('[telegram-bot] Tool call:', { id: toolCall.id, name: toolCall.name, args: toolCall.arguments });

        // Execute tool
        // Convert underscored name back to dots for MCP (e.g., planka_auth_status -> planka.auth.status)
        const mcpToolName = toolCall.name.replace(/_/g, '.');
        const toolResult = await executeMcpTool(
          telegramUserId,
          mcpToolName,
          JSON.parse(toolCall.arguments),
        );
        console.log('[telegram-bot] Tool result:', { success: toolResult.success, contentLength: toolResult.content?.length || 0, error: toolResult.error });

        const resultContent = toolResult.success
          ? toolResult.content
          : `Error: ${toolResult.error}`;

        // Save tool result
        await addMessage(session.id, 'tool', resultContent, toolCall.id);

        // Add tool result to history
        trimmedHistory.push({
          role: 'tool',
          content: resultContent,
          toolCallId: toolCall.id,
        });
      }

      // Get next response from AI
      await ctx.replyWithChatAction('typing');
      response = await client.chat(trimConversationHistory(trimmedHistory, 20), {}, tools);
    }

    // Log final response details
    console.log('[telegram-bot] Final AI response after', totalToolCallsMade, 'tool calls:', {
      hasContent: !!response.content,
      contentLength: response.content?.length || 0,
      toolCallsCount: response.toolCalls?.length || 0,
      finishReason: response.finishReason
    });

    // Save assistant response
    if (response.content) {
      await addMessage(session.id, 'assistant', response.content);
    } else {
      console.log('[telegram-bot] WARNING: No content in final response!');
      
      // Force summarization with explicit prompt if tools were used
      if (totalToolCallsMade > 0) {
        console.log('[telegram-bot] Attempting forced summarization after', totalToolCallsMade, 'tool calls');
        
        try {
          const summaryPrompt: ChatMessage = {
            role: 'user',
            content: 'Based on the tool results above, please provide a summary of what you discovered. ' +
                     'If all results were empty or no data was found, explicitly tell me that. ' +
                     'The user is waiting for your response - you must provide text output.'
          };
          
          // Get fresh history and add summary prompt
          const currentHistory = await getChatHistory(session.id);
          const forcedResponse = await client.chat([...currentHistory, summaryPrompt], {}, tools);
          
          console.log('[telegram-bot] Forced summarization result:', {
            hasContent: !!forcedResponse.content,
            contentLength: forcedResponse.content?.length || 0
          });
          
          if (forcedResponse.content) {
            response.content = forcedResponse.content;
            await addMessage(session.id, 'user', summaryPrompt.content);
            await addMessage(session.id, 'assistant', forcedResponse.content);
          }
        } catch (error) {
          console.error('[telegram-bot] Forced summarization failed:', error);
        }
      }
    }

    // Send response to user
    let finalContent: string;
    
    if (!response.content) {
      // Generate a better fallback based on what happened
      if (totalToolCallsMade === 0) {
        finalContent = '🤔 I didn\'t know how to respond. Could you try rephrasing your question?';
      } else {
        // We made tool calls but got no response text
        finalContent = [
          '⚠️ <b>Response Generation Issue</b>',
          '',
          `I successfully made ${totalToolCallsMade} tool ${totalToolCallsMade === 1 ? 'call' : 'calls'}, but failed to generate a summary.`,
          '',
          '💡 <b>What you can do:</b>',
          '• Ask me to "summarize what you found"',
          '• Try rephrasing your question',
          '• Ask for specific details about the data',
          '',
          '<i>This is a known limitation with the AI model.</i>'
        ].join('\n');
      }
    } else {
      finalContent = response.content;
    }
    
    // Fix markdown formatting to HTML (fallback if AI ignores instructions)
    finalContent = finalContent
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // **text** → <b>text</b>
      .replace(/__(.*?)__/g, '<u>$1</u>')      // __text__ → <u>text</u>
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')    // *text* → <i>text</i>
      .replace(/_([^_]+)_/g, '<i>$1</i>');     // _text_ → <i>text</i>
    
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
