# Quick Reference: Topic Support in Telegram Bot

## TL;DR

The bot now automatically detects when users have topics enabled in their private chats and routes all messages to the correct topic. No additional setup needed.

## Helper Functions

All located in: `src/services/draft-streaming.ts`

```typescript
// Check if user has topics enabled
isUserTopicsEnabled(ctx): boolean

// Get current message's topic ID
getMessageThreadId(ctx): number | undefined

// Check if message is in a topic
isTopicMessage(ctx): boolean
```

## Usage in Handlers

### Simple Message Sending
```typescript
import { getMessageThreadId } from '../services/draft-streaming.js';

const messageThreadId = getMessageThreadId(ctx);

await ctx.reply('Response', {
  message_thread_id: messageThreadId, // Auto-includes if in topic
});
```

### With Options
```typescript
const messageThreadId = getMessageThreadId(ctx);

const replyOptions: Record<string, any> = { parse_mode: 'HTML' };
if (messageThreadId) {
  replyOptions.message_thread_id = messageThreadId;
}

await ctx.reply(text, replyOptions);
```

### Chat Actions (Typing Indicator)
```typescript
const messageThreadId = getMessageThreadId(ctx);

const actionOptions: Record<string, any> = {};
if (messageThreadId) {
  actionOptions.message_thread_id = messageThreadId;
}

await ctx.api.sendChatAction(ctx.chat?.id, 'typing', actionOptions);
```

## Integration Points

### Already Integrated ✅
- Message streaming (`message-streaming.ts`)
- AI message handling (`ai-message.ts`)
- AI button callbacks (`ai-button-callback.ts`)
- Callback handlers (`callback-handlers.ts`)

### Pattern for New Features

When adding a new message-sending feature:

1. **Import the helper**
   ```typescript
   import { getMessageThreadId } from '../services/draft-streaming.js';
   ```

2. **Extract thread ID**
   ```typescript
   const messageThreadId = getMessageThreadId(ctx);
   ```

3. **Include in options**
   ```typescript
   await ctx.api.sendMessage(chatId, text, {
     message_thread_id: messageThreadId,
   });
   ```

## Debugging

Enable detailed logging:

```typescript
const messageThreadId = getMessageThreadId(ctx);
const userHasTopics = isUserTopicsEnabled(ctx);

console.log('[my-handler] Topic info:', {
  hasTopicsEnabled: userHasTopics,
  messageThreadId,
});
```

Look for logs in:
- `[telegram-bot]` - Main operations
- `[message-streaming]` - Streaming updates
- `[ai-message]` - AI processing
- `[ai-button-callback]` - Button handling

## Common Scenarios

### Scenario 1: User in Regular Private Chat
```
has_topics_enabled: false
messageThreadId: undefined
Result: Normal behavior, no changes
```

### Scenario 2: User in Topic-Enabled Private Chat
```
has_topics_enabled: true
messageThreadId: 123  (for "General" topic)
Result: All messages route to topic 123
```

### Scenario 3: User in Group Chat
```
has_topics_enabled: N/A
messageThreadId: undefined (unless group has topics)
Result: Normal group behavior
```

## API Methods with Topic Support

These methods accept `message_thread_id` parameter:
- `sendMessage` ✅
- `sendPhoto`, `sendVideo`, `sendAudio` ✅
- `sendDocument`, `sendSticker`, `sendVoice` ✅
- `sendLocation`, `sendVenue`, `sendContact` ✅
- `sendPoll`, `sendDice`, `sendInvoice` ✅
- `sendGame`, `sendMediaGroup` ✅
- `copyMessage`, `copyMessages` ✅
- `forwardMessage`, `forwardMessages` ✅
- `sendChatAction` ✅
- `editMessageText` ✅

## Type Definitions

Custom types in: `src/types/telegram-api-extensions.ts`

```typescript
// For messages with topic support
interface SendMessageWithTopicParams {
  chat_id: number | string;
  text: string;
  message_thread_id?: number;  // NEW
  parse_mode?: string;
  // ... other fields
}

// Check if user has topics
interface UserWithTopics {
  has_topics_enabled?: boolean;  // NEW
  // ... other user fields
}

// Message in a topic
interface MessageWithTopics {
  message_thread_id?: number;  // NEW
  is_topic_message?: boolean;  // NEW
  // ... other message fields
}
```

## No Breaking Changes

- ✅ All changes are backward compatible
- ✅ Non-topic users work normally
- ✅ No configuration required
- ✅ Automatic topic detection

## Testing Checklist

```
□ Message appears in correct topic during AI streaming
□ Button callbacks work in topic messages
□ Chat actions (typing) work in topics
□ Users without topics see no difference
□ Group chats unaffected
```

## Need Help?

1. Check the detailed guide: `TELEGRAM_API_8_0_TOPICS.md`
2. Look at implementation examples: `handlers/ai-message.ts`
3. Review helper functions: `services/draft-streaming.ts`
4. Check type definitions: `types/telegram-api-extensions.ts`

## Related Files

- Type definitions: `src/types/telegram-api-extensions.ts`
- Helper functions: `src/services/draft-streaming.ts`
- Streaming handler: `src/handlers/message-streaming.ts`
- AI message: `src/handlers/ai-message.ts`
- Button callbacks: `src/handlers/ai-button-callback.ts`
- Callback handlers: `src/handlers/callback-handlers.ts`
- Full guide: `TELEGRAM_API_8_0_TOPICS.md`
