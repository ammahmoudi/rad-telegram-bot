# AI-Suggested Dynamic Buttons

## Overview

The bot supports **AI-suggested dynamic buttons** that appear below AI responses. These buttons provide contextual actions that help guide users through common workflows without requiring them to type commands.

## How It Works

### 1. AI Suggests Buttons

The AI can include button suggestions in its response using a special XML tag:

```
<buttons>[{"text":"Button Label","action":"action_id","data":{"key":"value"}}]</buttons>
```

### 2. Buttons Are Parsed

The `parseAiButtons()` utility extracts button definitions and removes the `<buttons>` tag from the message text.

### 3. Buttons Are Rendered

The `createButtonKeyboard()` utility creates a Telegram `InlineKeyboard` with the suggested buttons.

### 4. User Clicks Button

When clicked, the button callback is handled by `handleAiButtonCallback()` which executes the associated action.

## Button Format

There are **two types** of button actions:

### 1. Predefined Actions (Direct Execution)

Execute specific operations immediately without AI involvement:

```typescript
{
  text: string;        // Button label (shown to user)
  action: string;      // Predefined action identifier
  data?: object;       // Optional data passed to action handler
}
```

**Example:**
```json
{
  "text": "🍽️ Select All Foods",
  "action": "rastar_select_all"
}
```

### 2. Custom Message Actions (Send to AI)

Send a message to AI as if the user typed it - useful for conversational follow-ups:

```typescript
{
  text: string;        // Button label (shown to user)
  action: "send_message";  // Always "send_message"
  message: string;     // The message to send to AI
}
```

**Example:**
```json
{
  "text": "🤔 Choose for Me",
  "action": "send_message",
  "message": "select all unselected foods based on light appetite"
}
```

## Available Actions

### Predefined Actions

#### Rastar Food Management

- `rastar_select_all` - Automatically select all unselected foods (fast, direct)
- `rastar_view_today` - View today's menu
- `rastar_view_week` - View this week's menu
- `rastar_change_selection` - Change a food selection
- `rastar_remove_selection` - Remove a food selection

#### Planka Task Management

- `planka_create_task` - Create a new task
- `planka_view_my_tasks` - View user's tasks
- `planka_mark_complete` - Mark task as complete
- `planka_add_comment` - Add comment to a card

#### General Actions

- `cancel` - Cancel current operation
- `help` - Show help message

### Custom Message Action

- `send_message` - Send any message to AI as if user typed it

**When to use send_message:**
- For not-yet-implemented features (let AI handle them)
- For conversational follow-ups ("choose for me", "what do you recommend?")
- For complex requests requiring AI context and reasoning
- For appetite-based selection, task creation with details, etc.

**When to use predefined actions:**
- For simple, fast operations (viewing menus, selecting all foods)
- When you want guaranteed execution without AI interpretation
- For operations that don't need AI reasoning

## Implementation## Implementation

### Core Files

1. **[`apps/telegram-bot/src/utils/ai-buttons.ts`](apps/telegram-bot/src/utils/ai-buttons.ts)**
   - `parseAiButtons()` - Parse button definitions from AI response
   - `createButtonKeyboard()` - Create Telegram inline keyboard
   - `parseButtonCallback()` - Parse button callback data
   - `BUTTON_ACTIONS` - Constant for available actions

2. **[`apps/telegram-bot/src/handlers/ai-button-callback.ts`](apps/telegram-bot/src/handlers/ai-button-callback.ts)**
   - `handleAiButtonCallback()` - Main callback handler
   - Individual action handlers (e.g., `handleSelectAllFoods()`)

3. **[`apps/telegram-bot/src/handlers/button-callback.ts`](apps/telegram-bot/src/handlers/button-callback.ts)**
   - Routes button callbacks to appropriate handler

4. **[`apps/telegram-bot/src/handlers/ai-message.ts`](apps/telegram-bot/src/handlers/ai-message.ts)**
   - Integrates button parsing and rendering into AI message flow

5. **[`apps/telegram-bot/src/config/system-prompt.ts`](apps/telegram-bot/src/config/system-prompt.ts)**
   - System prompt with button format documentation for AI

### Integration Flow

```
User sends message
    ↓
AI processes and suggests buttons
    ↓
parseAiButtons() extracts button definitions
    ↓
createButtonKeyboard() creates Telegram keyboard
    ↓
Message sent with buttons attached
    ↓
User clicks button
    ↓
handleButtonCallback() routes to handleAiButtonCallback()
    ↓
Action executed (e.g., select all foods)
    ↓
Result sent to user
```

## Adding New Actions

### 1. Add Action Constant

Edit [`apps/telegram-bot/src/utils/ai-buttons.ts`](apps/telegram-bot/src/utils/ai-buttons.ts):

```typescript
export const BUTTON_ACTIONS = {
  // ... existing actions
  MY_NEW_ACTION: 'my_new_action',
} as const;
```

### 2. Add Action Handler

Edit [`apps/telegram-bot/src/handlers/ai-button-callback.ts`](apps/telegram-bot/src/handlers/ai-button-callback.ts):

```typescript
// In handleAiButtonCallback switch statement
case BUTTON_ACTIONS.MY_NEW_ACTION:
  await handleMyNewAction(ctx, telegramUserId, data);
  break;

// Add handler function
async function handleMyNewAction(
  ctx: CallbackQueryContext<Context>,
  telegramUserId: string,
  data: Record<string, any>
) {
  // Implementation here
  await ctx.reply('Action executed!');
}
```

### 3. Update System Prompt

Edit [`apps/telegram-bot/src/config/system-prompt.ts`](apps/telegram-bot/src/config/system-prompt.ts):

```typescript
Available actions:
- my_new_action: Description of what it does
```

### 4. Test

Send a message that should trigger your new button:

```
User: "test my new feature"
AI: "Here's the result!
<buttons>[{"text":"🔥 Try It","action":"my_new_action"}]</buttons>"
```

## Best Practices

### Button Design

✅ **Good Examples:**
- `🍽️ انتخاب همه غذاها` - Clear action with emoji
- `📅 منوی این هفته` - Concise and descriptive
- `✅ تایید` - Simple confirmation

❌ **Bad Examples:**
- `Click here to automatically select all unselected foods for this week` - Too long
- `OK` - Too vague
- `button1` - No context

### When to Suggest Buttons

✅ **Use buttons for:**
- Common next steps (e.g., "View menu" after showing unselected days)
- Quick actions (e.g., "Select all")
- Navigation shortcuts (e.g., "Back to main menu")
- Retry mechanisms (e.g., "Try again")

❌ **Don't use buttons for:**
- Complex operations requiring more input
- Destructive actions without confirmation
- One-off unique requests
- Every single response (causes button fatigue)

### Callback Data Limits

Telegram's `callback_data` has a **64-byte limit**. Keep button data minimal:

```typescript
// ✅ Good - compact with predefined action
{ a: 'rastar_select_all', d: {}, u: '12345' }

// ✅ Good - compact with send_message
{ a: 'send_message', m: 'show my tasks', u: '12345' }

// ❌ Bad - too verbose
{ 
  action: 'select_all_foods_for_user',
  fullUserData: { name: '...', email: '...' },
  additionalMetadata: { ... },
  message: 'A very long message that exceeds the limit...'
}
```

**Tips for staying under 64 bytes:**
- Use short action names
- Keep messages concise for send_message buttons
- Minimize data payloads
- Use abbreviations in keys (a/d/u/m)

## Troubleshooting

### Buttons Not Appearing

1. Check AI response includes `<buttons>` tag
2. Verify JSON format is valid
3. Check console logs for parsing errors
4. Ensure button text and action are provided

### Button Click Not Working

1. Check callback data size (< 64 bytes)
2. Verify action is in `BUTTON_ACTIONS` constants
3. Check switch statement includes the action
4. Review console logs for errors

### Button Shows "Invalid"

1. Callback data format may be wrong
2. Button may be from an old session (data not cached)
3. User ID mismatch (button not for this user)

## Example Usage

### Example 1: Predefined Actions (Fast & Direct)

```typescript
// AI generates this response with predefined actions
const aiResponse = `
You have 3 unselected food days:
• Monday, Dec 27
• Tuesday, Dec 28  
• Wednesday, Dec 29

<buttons>[
  {"text":"🍽️ Auto Select","action":"rastar_select_all"},
  {"text":"📅 View Week","action":"rastar_view_week"}
]</buttons>
`;

// Bot processes it
const { messageText, buttons } = parseAiButtons(aiResponse);
const keyboard = createButtonKeyboard(buttons, userId);
await ctx.reply(messageText, { reply_markup: keyboard });
```

**User clicks "🍽️ Auto Select":**
```typescript
// Handler executes predefined action directly
await handleSelectAllFoods(ctx, userId, data, t);
// Result: All foods selected immediately, no AI roundtrip
```

### Example 2: Custom Message (AI Handles Request)

```typescript
// AI generates this response with send_message action
const aiResponse = `
You have 3 unselected food days. I can help you choose!

<buttons>[
  {"text":"🍽️ Quick Select","action":"rastar_select_all"},
  {"text":"🤔 Choose for Me","action":"send_message","message":"select all unselected foods based on light appetite"}
]</buttons>
`;
```

**User clicks "🤔 Choose for Me":**
```typescript
// Handler sends message to AI as if user typed it
await handleSendMessage(ctx, "select all unselected foods based on light appetite", t);
// Result: AI processes request with full context, analyzes menu, selects appropriately
```

### Example 3: Mixed Approach

```typescript
// Combine predefined and custom actions
const aiResponse = `
Here are your options:

<buttons>[
  {"text":"📋 View Menu","action":"rastar_view_today"},
  {"text":"🎲 Surprise Me","action":"send_message","message":"choose random foods for all unselected days"}
]</buttons>
`;
```

## Key Benefits

### Predefined Actions
✅ **Fast** - No AI roundtrip, executes immediately  
✅ **Reliable** - Guaranteed behavior, no interpretation needed  
✅ **Efficient** - Direct tool calls, minimal overhead

### Custom Message Actions
✅ **Flexible** - Handle any request the AI can understand  
✅ **Context-aware** - AI has full conversation context  
✅ **Easy to add** - No code changes needed for new buttons  
✅ **Handles complexity** - Works for not-yet-implemented features

## Related Files

- [`apps/telegram-bot/src/utils/ai-buttons.ts`](apps/telegram-bot/src/utils/ai-buttons.ts) - Core utilities
- [`apps/telegram-bot/src/handlers/ai-button-callback.ts`](apps/telegram-bot/src/handlers/ai-button-callback.ts) - Action handlers
- [`apps/telegram-bot/src/handlers/button-callback.ts`](apps/telegram-bot/src/handlers/button-callback.ts) - Router
- [`apps/telegram-bot/src/handlers/ai-message.ts`](apps/telegram-bot/src/handlers/ai-message.ts) - Integration
- [`apps/telegram-bot/src/config/system-prompt.ts`](apps/telegram-bot/src/config/system-prompt.ts) - AI instructions
