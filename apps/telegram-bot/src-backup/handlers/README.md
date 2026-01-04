# Handlers Directory Structure

This directory contains all the telegram bot handlers organized by functionality.

## File Organization

### `commands.ts`
Core command handlers for telegram commands like `/start`, `/planka_status`, `/rastar_status`, etc.

**Exports:**
- `handleStartCommand` - `/start` - Welcome message with main menu
- `handleMenuCommand` - `/menu` - Show quick access keyboard
- `handleLinkPlankaCommand` - `/link_planka` - Link Planka account
- `handlePlankaStatusCommand` - `/planka_status` - Check Planka connection status
- `handlePlankaUnlinkCommand` - `/planka_unlink` - Disconnect Planka account
- `handleLinkRastarCommand` - `/link_rastar` - Link Rastar account
- `handleRastarStatusCommand` - `/rastar_status` - Check Rastar connection status
- `handleRastarUnlinkCommand` - `/rastar_unlink` - Disconnect Rastar account
- `handleNewChatCommand` - `/new_chat` - Start new conversation
- `handleHistoryCommand` - `/history` - View chat history
- `handleClearChatCommand` - `/clear_chat` - Clear current conversation

### `keyboards.ts`
Keyboard definitions for reply keyboards and inline keyboards.

**Exports:**
- `getMainMenuKeyboard()` - Main menu reply keyboard with quick access buttons
- `getPlankaConnectedKeyboard()` - Inline keyboard for connected Planka status
- `getPlankaNotConnectedKeyboard()` - Inline keyboard for not connected Planka
- `getPlankaExpiredKeyboard()` - Inline keyboard for expired Planka token
- `getRastarConnectedKeyboard()` - Inline keyboard for connected Rastar status
- `getRastarNotConnectedKeyboard()` - Inline keyboard for not connected Rastar
- `getRastarExpiredKeyboard()` - Inline keyboard for expired Rastar token

### `callback-handlers.ts`
Handlers for inline keyboard button callbacks (when users click inline buttons).

**Exports:**
- `handleLinkPlankaCallback` - Handle "Link Planka" button click
- `handlePlankaUnlinkCallback` - Handle "Unlink Planka" button click
- `handlePlankaListBoardsCallback` - Handle "List my boards" button
- `handlePlankaDelayedTasksCallback` - Handle "Delayed tasks" button
- `handlePlankaCreateCardCallback` - Handle "Create card" button
- `handleLinkRastarCallback` - Handle "Link Rastar" button click
- `handleRastarUnlinkCallback` - Handle "Unlink Rastar" button click
- `handleRastarTodayMenuCallback` - Handle "Today's Menu" button
- `handleRastarUnselectedDaysCallback` - Handle "Unselected Days" button
- `handleRastarWeekMenuCallback` - Handle "This Week's Menu" button

### `keyboard-text-handlers.ts`
Handlers for reply keyboard button text (when users press keyboard buttons at bottom of screen).

**Exports:**
- `handlePlankaStatusButton` - Handle "📊 Planka Status" button
- `handleRastarStatusButton` - Handle "🍽️ Rastar Status" button
- `handleNewChatButton` - Handle "💬 New Chat" button
- `handleHistoryButton` - Handle "📚 History" button
- `handleTodayMenuButton` - Handle "📋 Today's Menu" button
- `handleUnselectedDaysButton` - Handle "⚠️ Unselected Days" button
- `handleDelayedTasksButton` - Handle "🔴 Delayed Tasks" button
- `handleMyBoardsButton` - Handle "📂 My Boards" button

### `ai-message.ts`
Handler for AI-powered message processing.

**Exports:**
- `handleAiMessage` - Process user messages with AI and execute tools

### `message-streaming.ts`
Utilities for streaming AI responses to Telegram.

**Exports:**
- `streamToTelegram` - Stream AI responses with progress updates

## Features Implemented

### Quick Access Buttons (Reply Keyboard)
The main menu provides instant access to common actions:
- **📊 Planka Status** - Check Planka connection
- **🍽️ Rastar Status** - Check Rastar connection  
- **📋 Today's Menu** - View today's food menu
- **⚠️ Unselected Days** - Check days without food selection
- **🔴 Delayed Tasks** - View overdue Planka tasks
- **📂 My Boards** - View Planka boards
- **💬 New Chat** - Start new conversation
- **📚 History** - View chat sessions

### Inline Action Buttons
Context-specific buttons appear under status messages:

**Planka Status:**
- List my boards
- Delayed tasks
- Create card
- Unlink account

**Rastar Status:**
- Today's Menu
- Unselected Days
- This Week's Menu
- Unlink account

### Token Expiration Handling
Both Planka and Rastar status commands check for:
- Missing tokens (not connected)
- Expired tokens (need re-linking)
- Valid tokens (show expiration time)

Each state shows appropriate inline buttons and clear instructions.

## Adding New Features

### To add a new keyboard button:
1. Add button to `keyboards.ts` in the appropriate keyboard function
2. Create handler in `keyboard-text-handlers.ts`
3. Register handler in `index.ts` with `bot.hears()`

### To add a new inline button:
1. Add button to keyboard in `keyboards.ts`
2. Create callback handler in `callback-handlers.ts`
3. Register handler in `index.ts` with `bot.callbackQuery()`

### To add a new command:
1. Create command handler in `commands.ts`
2. Export handler function
3. Register in `index.ts` with `bot.command()`
