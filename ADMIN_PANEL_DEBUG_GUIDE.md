# Admin Panel Usage Guide - MCP Tool Logging & Reasoning Control

## Quick Start

### 1. Access Admin Panel
Navigate to your admin panel URL (e.g., `http://localhost:3001` or your production domain).

### 2. Go to Settings Page
The Settings page is the main dashboard where you'll find all configuration options.

### 3. Find the New "Debug & Monitoring" Section

Look for this new section with a purple/pink icon:

```
┌─────────────────────────────────────────────────────┐
│  🎨 Debug & Monitoring                              │
│  Tools for debugging and monitoring AI behavior     │
└─────────────────────────────────────────────────────┘
```

## New Settings

### 🔍 Enable MCP Tool Call Logging

**Purpose**: Track every MCP tool call for debugging

**When to Enable**:
- ✅ Debugging tool failures
- ✅ Monitoring performance
- ✅ Analyzing user behavior
- ✅ Troubleshooting integrations
- ❌ Production (unless needed) - uses storage

**What Gets Logged**:
```json
{
  "telegramUserId": "123456789",
  "mcpServer": "planka",
  "toolName": "planka.list_projects",
  "inputArgs": "{\"userId\":\"abc123\"}",
  "outputContent": "[Project 1, Project 2]",
  "success": true,
  "executionTimeMs": 245,
  "createdAt": 1704567890000
}
```

**UI Element**:
```
┌─────────────────────────────────────────────────┐
│ ☑ 🔍 Enable MCP Tool Call Logging              │
│                                                 │
│ Logs all MCP tool calls (inputs/outputs) to    │
│ database for debugging. Includes execution time │
│ and error tracking.                             │
└─────────────────────────────────────────────────┘
```

---

### 🧠 Show AI Reasoning to Users

**Purpose**: Control what users see during AI processing

**When Enabled** (Default):
Users see full transparency:
```
┌─────────────────────────────────────────────────┐
│ 🧠 Reasoning...                                 │
│                                                 │
│ ┃ I need to check the user's projects first    │
│ ┃ to understand their current workload...       │
│                                                 │
│ 🛠️ Tools in use:                               │
│   🔧 planka.list_projects                      │
│   📊 planka.get_task_stats                     │
│                                                 │
│ [Final AI Response Here]                        │
└─────────────────────────────────────────────────┘
```

**When Disabled**:
Users see cleaner output:
```
┌─────────────────────────────────────────────────┐
│ 🤔 Thinking...                                  │
│                                                 │
│ [Final AI Response Here]                        │
└─────────────────────────────────────────────────┘
```

**UI Element**:
```
┌─────────────────────────────────────────────────┐
│ ☑ 🧠 Show AI Reasoning to Users                │
│                                                 │
│ When enabled, users see the AI's internal      │
│ reasoning process and tool usage. When disabled,│
│ users only see a "🤔 Thinking..." indicator and │
│ the final response.                             │
└─────────────────────────────────────────────────┘
```

---

## Step-by-Step: Enable Logging

1. ✅ **Check the box**: Click "🔍 Enable MCP Tool Call Logging"
2. 💾 **Save**: Click the "Save Settings" button at bottom
3. ✓ **Confirmation**: You'll see "✓ Settings saved successfully!"
4. 🔄 **Immediate Effect**: All new tool calls are now logged

## Step-by-Step: Hide Reasoning from Users

1. ✅ **Uncheck the box**: Click "🧠 Show AI Reasoning to Users" to disable
2. 💾 **Save**: Click the "Save Settings" button at bottom
3. ✓ **Confirmation**: You'll see "✓ Settings saved successfully!"
4. 🔄 **Immediate Effect**: Users immediately see cleaner messages

---

## Recommended Settings

### 🧪 Development/Testing
```
✅ Enable MCP Tool Call Logging
✅ Show AI Reasoning to Users
```
**Why**: Full transparency helps debug issues

### 🚀 Production
```
❌ Enable MCP Tool Call Logging (unless debugging)
☑️ Show AI Reasoning to Users (optional - your choice)
```
**Why**: 
- Logging uses database storage
- Reasoning display is preference (transparency vs. simplicity)

### 🐛 Troubleshooting Issues
```
✅ Enable MCP Tool Call Logging
✅ Show AI Reasoning to Users
```
**Why**: Maximum visibility into what's happening

---

## Accessing Tool Logs (Developers)

Currently tool logs are stored in database. Future admin UI can display them.

**Query via code**:
```typescript
import { getMcpToolLogs } from '@rad/shared';

// Get last 50 logs for user
const logs = await getMcpToolLogs('123456789', 50);

// Display
logs.forEach(log => {
  console.log(`[${log.mcpServer}] ${log.toolName}`);
  console.log(`Success: ${log.success}`);
  console.log(`Time: ${log.executionTimeMs}ms`);
  console.log(`Input: ${log.inputArgs}`);
  console.log(`Output: ${log.outputContent}`);
});
```

---

## Visual Comparison

### With Reasoning Enabled
```
User: "What are my delayed tasks?"
Bot: 
  🧠 Reasoning...
  ┃ I'll check your Planka account for 
  ┃ tasks that are past their due date...
  
  🛠️ Tools in use:
    🔧 planka.list_tasks
    📊 planka.filter_delayed
  
  You have 3 delayed tasks:
  • Task A (overdue by 2 days)
  • Task B (overdue by 5 days)  
  • Task C (overdue by 1 day)
```

### With Reasoning Disabled
```
User: "What are my delayed tasks?"
Bot:
  🤔 Thinking...
  
  You have 3 delayed tasks:
  • Task A (overdue by 2 days)
  • Task B (overdue by 5 days)
  • Task C (overdue by 1 day)
```

---

## Troubleshooting

### Setting Not Taking Effect?
1. ✅ Verify you clicked "Save Settings"
2. 🔄 Refresh the admin panel page
3. 🔍 Check browser console for errors
4. 📝 Check database: `SELECT * FROM SystemConfig WHERE key = 'MCP_TOOL_LOGGING_ENABLED'`

### Tool Logs Not Appearing?
1. ✅ Ensure "MCP Tool Call Logging" is enabled
2. ✅ Make a test tool call (e.g., "/status" in Telegram)
3. 🔍 Query database: `SELECT * FROM McpToolLog ORDER BY createdAt DESC LIMIT 10`
4. 📝 Check logs for errors: `grep -r "Failed to log tool call" logs/`

### Reasoning Still Showing When Disabled?
1. 🔄 Hard refresh Telegram (close and reopen)
2. 🔍 Check setting: `SELECT * FROM SystemConfig WHERE key = 'SHOW_REASONING_TO_USERS'`
3. 📝 Verify value is exactly `'false'` (not `'0'` or empty)

---

## Performance Impact

### MCP Tool Logging
- **Database Write**: ~5-10ms per log entry
- **Storage**: ~1-5KB per log entry
- **Queries**: Indexed for fast retrieval
- **Cleanup**: Run `deleteOldMcpToolLogs(30)` periodically

### Reasoning Display
- **No Performance Impact**: Only affects UI rendering
- **Bandwidth**: Slightly less data sent when disabled
- **User Experience**: Cleaner interface when disabled

---

## Security Notes

⚠️ **Important**: Tool logs may contain sensitive data:
- User tokens/credentials (sanitized in code)
- Personal information
- Business data

**Best Practices**:
- 🔒 Limit access to tool logs to admins only
- 🗑️ Delete old logs regularly (30-day retention recommended)
- 🚫 Never expose logs in public APIs
- 📝 Audit log access periodically
