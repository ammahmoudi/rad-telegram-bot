# Dynamic AI-Suggested Buttons

## Overview

The bot now supports **dynamic, context-aware buttons** that the AI can suggest based on the conversation. These buttons appear below AI responses and provide quick actions for users.

## How It Works

### 1. AI Suggests Buttons

The AI includes button definitions in its response using a special XML-like format:

```
Here are your unselected food days...

<buttons>[
  {"type":"text","label":"Choose all intelligently","text":"Please select all my unselected foods based on variety"},
  {"type":"text","label":"Show this week","text":"What's this week's menu?"}
]</buttons>
```

### 2. Bot Parses and Renders

- The `<buttons>` tag is automatically removed from the displayed message
- JSON is parsed to extract button definitions
- Buttons are rendered as Telegram InlineKeyboard
- Button data is cached for handling clicks

### 3. User Clicks Button

- Button click triggers `callback_query` handler
- Bot retrieves cached button data
- Action is executed based on button type

## Button Types

### Text Buttons (`type: "text"`)
Simulates the user sending a message. Best for most use cases.

```json
{
  "type": "text",
  "label": "Show today's menu",
  "text": "What's today's food menu?"
}
```

### URL Buttons (`type: "url"`)
Opens a web page.

```json
{
  "type": "url",
  "label": "Visit Planka",
  "url": "https://planka.company.com"
}
```

### Tool Call Buttons (`type: "tool_call"`)
Directly calls an MCP tool (advanced, currently limited).

```json
{
  "type": "tool_call",
  "label": "Select food",
  "tool": "rastar.menu.select_food",
  "args": {"date": "2025-12-27"}
}
```

## Best Practices

### When to Suggest Buttons

✅ **Good Use Cases:**
- After showing data that has obvious next actions
- When there are common follow-up questions
- To provide shortcuts for complex operations
- When user might need guidance on what to do next

❌ **Avoid:**
- Too many buttons (max 2-3)
- Buttons for every response
- Unclear or vague button labels
- Buttons that don't add value

### Button Label Guidelines

- **Keep it short:** Max 20 characters
- **Action-oriented:** Start with verbs (Show, Create, View, Select)
- **Clear intent:** User should immediately understand what happens
- **Localized:** Match the user's language

Good examples:
- ✅ "Choose all foods"
- ✅ "Show my tasks"
- ✅ "Create new card"

Bad examples:
- ❌ "Click here for more information about your tasks"  (too long)
- ❌ "Next" (unclear what happens)
- ❌ "Options" (vague)

## Implementation Details

### Files

- `apps/telegram-bot/src/utils/dynamic-buttons.ts` - Core button logic
- `apps/telegram-bot/src/handlers/button-callback.ts` - Click handler
- `apps/telegram-bot/src/handlers/ai-message.ts` - Integration with AI responses
- `apps/telegram-bot/src/config/system-prompt.ts` - AI instructions

### Button Caching

Buttons are cached in memory for 1 hour after being displayed. This is necessary because:
1. Telegram `callback_data` is limited to 64 bytes
2. We need to store full button metadata (text, tool names, args)
3. Cache is automatically cleaned up after expiration

### Security Considerations

- Button data is validated before execution
- Expired buttons show error message
- Tool calls are subject to same authentication as direct calls
- Cache is per-message, preventing cross-contamination

## Examples

### Example 1: Unselected Food Days

**AI Response:**
```
You haven't selected food for these days:

🗓️ Monday, Dec 23
🗓️ Tuesday, Dec 24
🗓️ Wednesday, Dec 25

<buttons>[
  {"type":"text","label":"Choose all smartly","text":"Select all my unselected foods with variety"},
  {"type":"text","label":"Show this week","text":"What's this week's menu?"}
]</buttons>
```

**User Sees:**
```
You haven't selected food for these days:

🗓️ Monday, Dec 23
🗓️ Tuesday, Dec 24
🗓️ Wednesday, Dec 25

[Choose all smartly] [Show this week]
```

### Example 2: Task Search Results

**AI Response:**
```
Found 5 tasks assigned to you:

🔴 Urgent: Deploy hotfix
🟡 Review PR #123
🟢 Update documentation

<buttons>[
  {"type":"text","label":"Show all details","text":"Give me detailed info for each of my tasks"},
  {"type":"text","label":"Create new task","text":"I want to create a new task"}
]</buttons>
```

## Future Enhancements

Potential improvements:
- Direct tool execution from buttons (currently redirects to text)
- Multi-step workflows (button chains)
- Confirmation dialogs for destructive actions
- Button states (loading, disabled)
- Persistent buttons across messages
- Button analytics to improve suggestions
