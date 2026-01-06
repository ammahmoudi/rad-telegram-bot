# Chat Mode Configuration

## Overview
The bot now supports two chat modes to work around Telegram's thread API limitations and provide flexible deployment options.

## Chat Modes

### Thread Mode (Default)
- **Behavior**: Uses Telegram's threaded mode (topics/threads) for separate conversations
- **Benefits**: 
  - Organized conversations in separate threads
  - Each thread has independent AI memory
  - Clean separation of different topics
- **Limitations**:
  - Telegram's thread API has bugs (as of January 2026)
  - Requires "Topics" to be enabled in BotFather settings
- **Clear Chat**: Deletes the current thread/topic completely

### Simple Mode
- **Behavior**: All chats happen in the main private chat (no threads/topics)
- **Benefits**:
  - No reliance on buggy thread APIs
  - Simpler user experience
  - More stable in development
- **Limitations**:
  - All conversations in one place
  - Single AI memory context
- **Clear Chat**: Only clears AI conversation history, messages remain visible

## Configuration

### Option 1: Environment Variable

Add to your `.env` or `.env.local` file:

```env
# Chat mode: 'thread' or 'simple'
CHAT_MODE=thread
```

Options:
- `CHAT_MODE=thread` (default) - Use threaded mode
- `CHAT_MODE=simple` - Use simple mode

### Option 2: Admin Panel

1. Open Admin Panel (http://localhost:3000)
2. Scroll to "Chat Mode" section
3. Select from dropdown:
   - **Thread Mode (Topics/Threads)** - Default, uses Telegram's threaded mode
   - **Simple Mode (Single Chat)** - All chats in main private chat
4. Click "Save Configuration"

**Priority**: Admin panel setting > Environment variable > Default (thread)

## Command Changes

### Removed Commands
- `/new_chat` - Removed (not needed in thread mode, Telegram handles topic creation)
- `/history` - Removed (redundant with thread history)

### Updated Commands
- `/clear_chat` - Behavior now depends on chat mode:
  - **Thread mode**: Deletes the current thread/topic
  - **Simple mode**: Clears AI history but keeps messages visible

### Remaining Commands (11 total)
- **General**: `/start`, `/menu`, `/settings`, `/help`
- **Chat**: `/clear_chat`
- **Planka**: `/link_planka`, `/planka_status`, `/planka_unlink`
- **Rastar**: `/link_rastar`, `/rastar_status`, `/rastar_unlink`

## Implementation Details

### Mode Detection
The bot checks for chat mode in this order:
1. System config from admin panel (`SystemConfig.CHAT_MODE`)
2. Environment variable (`CHAT_MODE`)
3. Default to `thread` mode

```typescript
async function getChatMode(): Promise<'thread' | 'simple'> {
  const configMode = await getSystemConfig('CHAT_MODE');
  if (configMode) return configMode as 'thread' | 'simple';
  
  const envMode = process.env.CHAT_MODE?.toLowerCase();
  if (envMode === 'simple') return 'simple';
  
  return 'thread'; // Default
}
```

### Clear Chat Logic

**Thread Mode:**
```typescript
// Delete the Telegram topic/thread
await ctx.api.deleteForumTopic(ctx.chat.id, topicId);

// Clear session data
if (ctx.session.threadSessions) {
  delete ctx.session.threadSessions[topicId];
}

// Delete database records for this thread
await prisma.chatSession.deleteMany({
  where: { telegramUserId, threadId: BigInt(topicId) }
});
```

**Simple Mode:**
```typescript
// Delete all chat sessions for user (clears AI memory)
await prisma.chatSession.deleteMany({
  where: { telegramUserId }
});

// Clear session data
ctx.session.threadSessions = {};

// Telegram messages remain visible
```

## Migration Guide

### Switching from Thread to Simple Mode
1. Set `CHAT_MODE=simple` in `.env` or via admin panel
2. Restart bot
3. Use `/clear_chat` to reset AI memory
4. All future chats will be in main private chat

### Switching from Simple to Thread Mode
1. Set `CHAT_MODE=thread` in `.env` or via admin panel
2. Restart bot
3. Enable "Topics" in @BotFather for your bot
4. User messages will create new threads automatically

## Troubleshooting

### Thread Mode Issues
**Problem**: Threads not creating automatically  
**Solution**: Enable "Topics" in @BotFather settings

**Problem**: Can't delete threads  
**Solution**: Check bot has admin permissions in the chat

**Problem**: Thread API errors  
**Solution**: Switch to simple mode temporarily

### Simple Mode Issues
**Problem**: Can't separate conversations  
**Solution**: Use `/clear_chat` to reset and start fresh

**Problem**: Messages piling up  
**Solution**: Manually delete messages in Telegram, or use `/clear_chat` to reset AI memory

## Database Schema

No schema changes required. The `ChatSession` model already supports both modes:

```prisma
model ChatSession {
  id              String @id @default(cuid())
  telegramUserId  String
  threadId        BigInt?  // null in simple mode, set in thread mode
  messages        Message[]
  // ...
}
```

## Future Enhancements

Possible additions:
- Per-user mode preferences (override global setting)
- Automatic mode switching based on Telegram API health
- Hybrid mode (optional threads in simple mode)
- Session archiving before clear in simple mode

## References

- [Environment Configuration](ENV_CONFIGURATION.md)
- [Grammy Commands Plugin](COMMANDS_PLUGIN_GUIDE.md)
- [Clear Chat Handler](apps/telegram-bot/src/handlers/commands/chat-management.ts)
- [Admin Panel Settings](apps/admin-panel/src/components/SettingsForm.tsx)
