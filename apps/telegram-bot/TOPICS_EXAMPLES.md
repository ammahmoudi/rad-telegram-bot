# Topic Support: Implementation Examples

This document provides real-world examples of how to use the new topic support features in the Telegram bot.

## Example 1: Basic Message Sending in Topics

### Simple Response
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function myCommandHandler(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  
  // Simple approach - let the helper handle it
  await ctx.reply('Hello! 👋', {
    message_thread_id: messageThreadId,
  });
}
```

### With HTML Formatting
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function formattedResponse(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  
  await ctx.reply('<b>Bold text</b>\n<i>Italic text</i>', {
    parse_mode: 'HTML',
    message_thread_id: messageThreadId,
  });
}
```

## Example 2: Conditional Topic Handling

### Advanced Pattern
```typescript
import { 
  getMessageThreadId, 
  isUserTopicsEnabled 
} from '../services/draft-streaming.js';

export async function conditionalHandler(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  const userHasTopics = isUserTopicsEnabled(ctx);
  
  if (userHasTopics) {
    console.log(`User has topics enabled, sending to topic: ${messageThreadId}`);
  }
  
  const options: Record<string, any> = { parse_mode: 'HTML' };
  
  // Only add message_thread_id if we have one
  if (messageThreadId) {
    options.message_thread_id = messageThreadId;
  }
  
  await ctx.reply('Response text', options);
}
```

## Example 3: Multiple Message Sends in Topic

### Sending Multiple Messages
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function multiMessageHandler(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  const options = { message_thread_id: messageThreadId };
  
  // Send multiple messages to the same topic
  await ctx.reply('📊 Fetching data...', options);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await ctx.reply('✅ Data loaded!', options);
  await ctx.reply('📈 Results:\n• Item 1\n• Item 2', { 
    ...options,
    parse_mode: 'HTML',
  });
}
```

## Example 4: Chat Actions in Topics

### Typing Indicator
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function typingIndicatorHandler(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  
  // Send typing action to the correct topic
  const actionOptions: Record<string, any> = {};
  if (messageThreadId) {
    actionOptions.message_thread_id = messageThreadId;
  }
  
  await ctx.api.sendChatAction(ctx.chat?.id, 'typing', actionOptions);
  
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send response to the same topic
  const msgOptions: Record<string, any> = {};
  if (messageThreadId) {
    msgOptions.message_thread_id = messageThreadId;
  }
  
  await ctx.reply('Done! Here is my response.', msgOptions);
}
```

## Example 5: AI Message Handler with Topics

This is how it's done in `ai-message.ts`:

```typescript
import { getMessageThreadId, isUserTopicsEnabled } from '../services/draft-streaming.js';

export async function handleAiMessage(ctx: Context) {
  // Get topic information
  const messageThreadId = getMessageThreadId(ctx);
  const userHasTopics = isUserTopicsEnabled(ctx);
  
  console.log('[ai-message] Topic info:', {
    hasTopicsEnabled: userHasTopics,
    messageThreadId,
  });
  
  // Send initial thinking message with topic support
  const replyOptions: Record<string, any> = { parse_mode: 'HTML' };
  if (messageThreadId) {
    replyOptions.message_thread_id = messageThreadId;
  }
  
  let sentMessage;
  try {
    sentMessage = await ctx.reply('💭 <i>Thinking...</i>', replyOptions);
  } catch (error) {
    console.error('Failed to send initial message:', error);
    throw error;
  }
  
  // The sentMessage will now be in the correct topic
  // All subsequent updates will maintain the topic context
}
```

## Example 6: Button Callback with Topics

From `ai-button-callback.ts`:

```typescript
import { 
  getMessageThreadId, 
  isUserTopicsEnabled 
} from '../services/draft-streaming.js';

async function handleSendMessage(
  ctx: CallbackQueryContext<Context>,
  message: string,
  t: any
) {
  // Get topic information
  const messageThreadId = getMessageThreadId(ctx);
  const userHasTopics = isUserTopicsEnabled(ctx);
  
  // Echo the message in the same topic
  try {
    const sendOptions: Record<string, any> = { 
      reply_to_message_id: ctx.callbackQuery.message?.message_id 
    };
    
    if (messageThreadId) {
      sendOptions.message_thread_id = messageThreadId;
    }
    
    await ctx.api.sendMessage(ctx.chat?.id || 0, message, sendOptions);
  } catch (err) {
    console.log('Could not echo user message:', err);
  }
  
  // Import and call AI handler
  const { handleAiMessage } = await import('./ai-message.js');
  
  // Create fake context with topic info
  const fakeCtx = {
    ...ctx,
    message: {
      text: message,
      from: ctx.from,
      chat: ctx.chat,
      message_id: ctx.callbackQuery.message?.message_id || 0,
      date: Date.now(),
      message_thread_id: messageThreadId, // Include topic ID
    },
  };
  
  // Process as if user typed it (with topic support)
  await handleAiMessage(fakeCtx as any);
}
```

## Example 7: Error Handling with Topics

### Robust Error Response
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function robustErrorHandler(ctx: Context) {
  const messageThreadId = getMessageThreadId(ctx);
  
  try {
    // Some operation that might fail
    const result = await performSomeOperation();
    
    const options = { message_thread_id: messageThreadId };
    await ctx.reply(`✅ Success: ${result}`, options);
    
  } catch (error) {
    const messageThreadId = getMessageThreadId(ctx); // Refresh in case needed
    
    const options: Record<string, any> = { 
      parse_mode: 'HTML',
      message_thread_id: messageThreadId,
    };
    
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await ctx.reply(
      `<b>❌ Error:</b>\n<code>${errorMsg}</code>`,
      options
    );
  }
}
```

## Example 8: Streaming Response with Topics

From `message-streaming.ts` - How updates work:

```typescript
export async function handleStreamingResponse(
  ctx: Context,
  client: OpenRouterClient,
  trimmedHistory: ChatMessage[],
  systemPrompt: string,
  tools: ChatCompletionTool[],
  sentMessage: Message.TextMessage
): Promise<{ finalResponse: string }> {
  
  // Extract topic info at the start
  const messageThreadId = getMessageThreadId(ctx);
  
  // Helper to update message in the topic
  const updateMessage = async (force: boolean = false) => {
    let content = '';
    // Build content...
    
    try {
      // Pass message_thread_id to editMessageText
      const editOptions: Record<string, any> = { parse_mode: 'HTML' };
      if (messageThreadId) {
        editOptions.message_thread_id = messageThreadId;
      }
      
      // Update happens in the same topic
      await ctx.api.editMessageText(
        sentMessage.chat.id, 
        sentMessage.message_id, 
        content, 
        editOptions
      );
    } catch (error) {
      // Ignore update errors
    }
  };
  
  // Stream and update...
  let finalResponse = '';
  
  for await (const chunk of stream) {
    if (chunk.type === 'content') {
      finalResponse += chunk.content;
      await updateMessage(); // Updates in the correct topic
    }
  }
  
  return { finalResponse };
}
```

## Example 9: Creating Fake Context for Testing

```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

function createMessageContext(ctx: Context, messageText: string): Context {
  const messageThreadId = getMessageThreadId(ctx);
  
  // Create message with topic info
  const message: Record<string, any> = {
    message_id: ctx.callbackQuery?.message?.message_id || 0,
    date: Math.floor(Date.now() / 1000),
    chat: ctx.chat!,
    from: ctx.callbackQuery!.from,
    text: messageText
  };
  
  // Include topic if available
  if (messageThreadId) {
    message.message_thread_id = messageThreadId;
  }
  
  // Return proxy context with topic support
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'message') return message;
      return (target as any)[prop];
    }
  }) as Context;
}
```

## Example 10: Topic-Aware Service Method

```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

class MyService {
  async sendUserNotification(ctx: Context, message: string) {
    const messageThreadId = getMessageThreadId(ctx);
    
    // Build options with topic support
    const options: Record<string, any> = {
      parse_mode: 'HTML',
      disable_notification: false,
    };
    
    // Add topic if user has them enabled
    if (messageThreadId) {
      options.message_thread_id = messageThreadId;
    }
    
    return ctx.api.sendMessage(ctx.chat?.id, message, options);
  }
  
  async sendNotificationWithAction(ctx: Context, message: string) {
    const messageThreadId = getMessageThreadId(ctx);
    
    // Send typing indicator
    const actionOpts: Record<string, any> = {};
    if (messageThreadId) {
      actionOpts.message_thread_id = messageThreadId;
    }
    await ctx.api.sendChatAction(ctx.chat?.id, 'typing', actionOpts);
    
    // Wait a moment
    await new Promise(r => setTimeout(r, 500));
    
    // Send message
    const msgOpts: Record<string, any> = {};
    if (messageThreadId) {
      msgOpts.message_thread_id = messageThreadId;
    }
    await ctx.api.sendMessage(ctx.chat?.id, message, msgOpts);
  }
}
```

## Best Practices

### ✅ DO
- Extract `messageThreadId` once per handler
- Pass it to all message operations
- Log topic info for debugging
- Handle undefined `messageThreadId` gracefully

### ❌ DON'T
- Assume `messageThreadId` is always present
- Forget to include it in follow-up messages
- Create separate code paths for topics vs non-topics
- Hard-code any topic IDs

## Common Pattern

The recommended pattern for any message-sending operation:

```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

export async function handler(ctx: Context) {
  // 1. Extract once at the start
  const messageThreadId = getMessageThreadId(ctx);
  
  // 2. Use in all operations
  const options: Record<string, any> = {};
  if (messageThreadId) {
    options.message_thread_id = messageThreadId;
  }
  
  // 3. Send/edit with options
  await ctx.reply('Message', options);
}
```

This simple pattern ensures all message operations respect the user's topic context.
