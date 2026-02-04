# Telegram Bot Improvements Summary

## New Features Added

### 1. Token Expiration Checking ✅
Both Planka and Rastar commands now properly check for expired tokens:
- **`/link_planka`** and **`/link_rastar`** - Show expiration warning if token exists but is expired
- **`/planka_status`** and **`/rastar_status`** - Display detailed expiration info or warning if expired
- Clear instructions provided for re-linking accounts

### 2. Quick Access Keyboard Menu ⌨️
Added persistent keyboard buttons at the bottom of Telegram for instant access:
- 📊 **Planka Status** - Check connection status
- 🍽️ **Rastar Status** - Check connection status  
- 📋 **Today's Menu** - View today's food options
- ⚠️ **Unselected Days** - Check days without food selection
- 🔴 **Delayed Tasks** - View overdue Planka tasks
- 📂 **My Boards** - View Planka boards
- 💬 **New Chat** - Start fresh conversation
- 📚 **History** - View chat history

### 3. Inline Action Buttons 🔘
Context-aware buttons appear under status messages:

**Planka Status (Connected):**
- 📋 List my boards
- 🔴 Delayed tasks
- ➕ Create card
- 🔓 Unlink Account

**Rastar Status (Connected):**
- 📋 Today's Menu
- ⚠️ Unselected Days  
- 📅 This Week's Menu
- 🔓 Unlink Account

**When Not Connected:**
- 🔗 Link [Service] button

**When Token Expired:**
- 🔓 Unlink button
- 🔗 Re-link button

### 4. New Commands 🆕
- **`/menu`** - Display the quick access keyboard anytime

### 5. Smart Features 🧠
- **Check Unselected Food Days** - Automatically check for days where food hasn't been selected
- **View Delayed Tasks** - See all overdue Planka cards and tasks
- **Quick Board Access** - Instantly list all Planka boards
- **Week Menu View** - See the entire week's food menu at once

## Code Organization Improvements 📁

Refactored handlers directory for better maintainability:

```
apps/telegram-bot/src/handlers/
├── commands.ts                  # Core command handlers
├── keyboards.ts                 # Keyboard definitions (NEW)
├── callback-handlers.ts         # Inline button callbacks (NEW)
├── keyboard-text-handlers.ts    # Reply keyboard handlers (NEW)
├── ai-message.ts               # AI message processing
├── message-streaming.ts         # Response streaming
└── README.md                    # Documentation (NEW)
```

### Benefits:
- **Separation of Concerns** - Each file has a single, clear purpose
- **Reusability** - Keyboard definitions can be reused across commands
- **Maintainability** - Easy to find and update specific handlers
- **Testability** - Each module can be tested independently
- **Scalability** - Easy to add new buttons, commands, or callbacks

## Technical Details

### Keyboard Types
1. **Reply Keyboards** - Persistent buttons at bottom of screen (main menu)
2. **Inline Keyboards** - Contextual buttons under specific messages

### Handler Flow
```
User Action → Bot Receives Event → Handler Processes → Response Sent
```

**Example: User clicks "🔴 Delayed Tasks" button:**
1. grammy detects `bot.hears('🔴 Delayed Tasks')`
2. Calls `handleDelayedTasksButton()`
3. Creates synthetic context with query text
4. Passes to `handleAiMessage()` for AI processing
5. AI uses Planka MCP tools to fetch delayed tasks
6. Response streamed back to user

### Callback Query Pattern
Inline buttons use callback data strings to identify actions:
- `link_planka` → `handleLinkPlankaCallback()`
- `planka_delayed_tasks` → `handlePlankaDelayedTasksCallback()`
- etc.

## User Experience Improvements

### Before:
- Users had to remember and type commands
- No visual indication of available features
- Token expiration not clearly communicated
- No quick access to common actions

### After:
- Visual keyboard with intuitive emoji icons
- One-tap access to common features
- Clear token status with actionable buttons
- Contextual inline buttons for related actions
- Natural language queries generated from button presses

## Future Enhancements

Possible additions:
- **Settings keyboard** - Configure preferences
- **Notifications** - Alert when food selection deadline approaches
- **Quick replies** - Common food selections (e.g., "Same as yesterday")
- **Task creation wizard** - Step-by-step Planka card creation
- **Calendar view** - Visual weekly food menu
- **Favorites** - Save common commands/queries

## Documentation

Complete documentation available in:
- `apps/telegram-bot/src/handlers/README.md` - Detailed handler documentation
- Each handler file has JSDoc comments explaining functionality
