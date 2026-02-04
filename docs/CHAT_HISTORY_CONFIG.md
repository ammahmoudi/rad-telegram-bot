# Chat History Configuration

## Overview
The bot now supports flexible conversation history management with configurable limits and modes.

## System Configuration Options

Configure these in the admin panel under Settings → System Config:

### 1. `CHAT_HISTORY_MODE` (Default: `message_count`)
Controls how conversation history is trimmed.

**Options:**
- `message_count` - Keep last N messages (simple, predictable)
- `token_size` - Keep messages up to N tokens (better for managing AI context window)

### 2. `CHAT_HISTORY_LIMIT` 
The limit value depends on the mode.

**For `message_count` mode:**
- Default: `20`
- Keeps the last 20 messages in conversation history
- Recommended: 15-30 messages

**For `token_size` mode:**
- Default: `4000`
- Keeps messages up to ~4000 tokens
- 1 token ≈ 4 characters
- 4000 tokens ≈ 16,000 characters ≈ 3,000 words
- Recommended: 4000-8000 for most use cases

### 3. `CHAT_RESTORE_TOOL_RESULTS` (Default: `false`)
Whether to restore tool results from McpToolLog when loading history.

**Options:**
- `false` - Don't restore (recommended, cleaner)
- `true` - Restore tool outputs into conversation (uses more context)

## How It Works

### Without Tool Result Restoration (Default)
```
Database (Message table):
- User: "Show my tasks"
- Assistant: [tool_call: planka_filter_cards]
- Assistant: "Here are your 5 tasks..."

In Memory (sent to AI):
- User: "Show my tasks"
- Assistant: [tool_call: planka_filter_cards]
- Tool: {...huge JSON output...}  ← Added only in memory
- Assistant: "Here are your 5 tasks..."
```

### With Tool Result Restoration (Optional)
```
Database (Message table):
- User: "Show my tasks"
- Assistant: [tool_call: planka_filter_cards]
- Assistant: "Here are your 5 tasks..."

Database (McpToolLog table):
- Tool output: {...huge JSON...}

Restored History (sent to AI):
- User: "Show my tasks"
- Assistant: [tool_call: planka_filter_cards]
- Tool: {...huge JSON...}  ← Restored from McpToolLog
- Assistant: "Here are your 5 tasks..."
```

## Benefits of Current Approach (No Restoration)

✅ **Clean database** - No huge JSON blobs in Message table
✅ **Clean admin panel** - Conversation view shows only user-facing messages
✅ **Efficient** - Tool results exist only in memory during execution
✅ **Debuggable** - Tool results still logged in McpToolLog for debugging

## When to Enable Tool Result Restoration

Enable `CHAT_RESTORE_TOOL_RESULTS = true` if:
- You want the AI to reference previous tool outputs in later turns
- You're debugging why the AI "forgot" previous tool results
- Your use case requires multi-turn reasoning over tool data

**Note:** This uses more tokens/context, so reduce `CHAT_HISTORY_LIMIT` accordingly.

## Recommended Settings

### For General Use
```
CHAT_HISTORY_MODE = message_count
CHAT_HISTORY_LIMIT = 20
CHAT_RESTORE_TOOL_RESULTS = false
```

### For Long Conversations with Complex Tool Use
```
CHAT_HISTORY_MODE = token_size
CHAT_HISTORY_LIMIT = 8000
CHAT_RESTORE_TOOL_RESULTS = false
```

### For Debugging/Analysis
```
CHAT_HISTORY_MODE = message_count
CHAT_HISTORY_LIMIT = 50
CHAT_RESTORE_TOOL_RESULTS = true
```

## Token Estimation

The token-based trimming uses a rough approximation:
- 1 token ≈ 4 characters
- Includes message content + tool arguments + overhead

For exact token counting, you'd need to use the model's tokenizer, but this approximation works well in practice.

## Admin Panel Integration

These settings can be configured in:
**Admin Panel → Settings → System Config**

Add these three settings with their values.
