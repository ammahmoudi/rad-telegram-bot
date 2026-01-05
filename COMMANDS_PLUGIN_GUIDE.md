# Grammy Commands Plugin Integration

## Overview
Migrated from basic command handling to the advanced `@grammyjs/commands` plugin for better organization, scoping, and user experience.

## Features Implemented

### 1. **Command Organization**
Commands are now organized into logical groups:

- **User Commands** ([user.ts](apps/telegram-bot/src/commands/user.ts))
  - `/start` - Start the bot and see main menu
  - `/menu` - Show main menu
  - `/settings` - Bot settings
  - `/help` - Show available commands

- **Chat Management** ([chat.ts](apps/telegram-bot/src/commands/chat.ts))
  - `/new_chat` - Start new conversation  
  - `/history` - View chat history
  - `/clear_chat` - Clear chat history

- **Integrations** ([integrations.ts](apps/telegram-bot/src/commands/integrations.ts))
  - `/link_planka` - Link Planka account
  - `/planka_status` - Check Planka connection
  - `/planka_unlink` - Unlink Planka account
  - `/link_rastar` - Link Rastar account
  - `/rastar_status` - Check Rastar connection
  - `/rastar_unlink` - Unlink Rastar account

### 2. **"Did You Mean...?" Feature**
Automatically suggests the closest command when users make typos:

```typescript
bot
  .filter(commandNotFound([userCommands, chatCommands, integrationCommands], {
    ignoreCase: true,
    similarityThreshold: 0.4,
  }))
  .use(async (ctx) => {
    if (ctx.commandSuggestion) {
      await ctx.reply(
        `🤔 Hmm... I don't know that command.\n\n` +
        `Did you mean <code>${ctx.commandSuggestion}</code>?`,
        { parse_mode: 'HTML' }
      );
    }
  });
```

**Examples:**
- User types: `/strat` → Bot suggests: "Did you mean `/start`?"
- User types: `/MENU` → Works! (case-insensitive)
- User types: `/histoy` → Bot suggests: "Did you mean `/history`?"

### 3. **Command Menu Synchronization**
All commands are automatically synced to Telegram's UI menu (the "/" button):

```typescript
await userCommands.setCommands(bot);
```

Users can now:
- See all available commands in Telegram's native command menu
- Get auto-completion while typing commands
- View command descriptions before using them

### 4. **Better Code Organization**
```
apps/telegram-bot/src/
├── commands/
│   ├── index.ts          # Command group definitions
│   ├── user.ts           # General user commands
│   ├── chat.ts           # Chat management commands
│   └── integrations.ts   # Planka & Rastar commands
└── handlers/
    └── commands/         # Original command handlers (reused)
```

### 5. **Thread-Safe Command Handling**
Commands properly respect Telegram's threaded mode:
- Commands work in both general chat and threads
- Thread context is preserved through command execution
- Reply keyboards in general chat, inline buttons in threads

## Configuration Options

The `commandNotFound` filter accepts these options:

```typescript
{
  ignoreCase: true,              // Match /START as /start
  ignoreLocalization: false,     // Consider localized commands
  similarityThreshold: 0.4,      // How close a match needs to be (0-1)
}
```

## Benefits

### For Users:
✅ Command auto-completion in Telegram UI  
✅ Typo correction with smart suggestions  
✅ Clear command descriptions  
✅ Case-insensitive commands  

### For Developers:
✅ Better code organization by functionality  
✅ Type-safe command definitions  
✅ Easy to add/modify commands  
✅ Centralized command management  
✅ No duplicate command registration  

## Migration Notes

**Before:**
```typescript
bot.command('start', handleStartCommand);
bot.command('menu', handleMenuCommand);
// ... 13 more commands scattered in index.ts
```

**After:**
```typescript
// Organized in separate files
userCommands.command('start', 'Start the bot', handleStartCommand);
chatCommands.command('history', 'View chat history', handleHistoryCommand);

// Single registration
bot.use(userCommands);
bot.use(chatCommands);
bot.use(integrationCommands);
```

## Future Enhancements

Possible additions using the commands plugin:

1. **Command Scoping** - Different commands for admins vs regular users
2. **Localization** - Multi-language command names/descriptions
3. **Custom Prefixes** - Use `?`, `!`, or custom symbols instead of `/`
4. **RegExp Commands** - Pattern-based command matching
5. **Per-Chat Command Menus** - Different commands in groups vs private chats

## Testing

Start the bot and try:
- `/start` - Should work normally
- `/strat` - Should suggest "/start"
- `/HELP` - Should work (case-insensitive)
- `/xyz123` - Should show "Unknown command"
- Type `/` in chat - Should show all commands with descriptions

## References

- [Grammy Commands Plugin Documentation](https://grammy.dev/plugins/commands)
- [Command Groups Source](apps/telegram-bot/src/commands/)
- [Main Integration](apps/telegram-bot/src/index.ts#L95-L120)
