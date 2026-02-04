# MCP Tools & Helpers Improvements Summary

## Overview

This document summarizes the improvements made to MCP tools and helper functions to address issues with:
1. "What have I done" queries not working well
2. Daily report generation not working properly
3. Daily report checking/finding not working correctly

## Changes Made

### 1. User Activity Tools Improvements

#### File: `packages/mcp-planka/src/helpers/user-activity.ts`

**Changes:**
- Increased `getUserActions()` default limit from 50 → 100
- Increased `maxBoardsToFetch` from 10 → 20
- Added `limit` parameter to `getUserActivitySummary()`
- Added `actionsByType` statistics to activity summary for better insights

**Impact:**
- Captures more comprehensive user activity
- Provides better statistics for understanding what user has done
- Reduces need for multiple API calls

#### File: `packages/mcp-planka/src/tools/user-activity.tools.ts`

**Changes:**
- Enhanced tool descriptions with clearer guidance
- Emphasized `planka_get_user_activity_summary` as PREFERRED tool for "what did I do" queries
- Added explicit instructions to ALWAYS provide startDate for time-based queries
- Added `limit` parameter support (default: 100)

**Impact:**
- LLM will choose the right tool more often
- Better parameter usage (especially dates)
- More comprehensive results

### 2. Daily Reports Tools Improvements

#### File: `packages/mcp-planka/src/tools/daily-reports.tools.ts`

**Changes:**
- Enhanced `planka_get_user_daily_reports` tool description
- Clarified difference between "daily reports" (written reports) vs "user activity" (actual work)
- Added new tool: `planka_generate_daily_report` for creating reports from activity
- Improved date parameter descriptions with examples

**New Tool:**
```typescript
planka_create_daily_report_card
```
- Creates a daily report card with provided content
- **Important:** Does NOT fetch activity data itself
- **Workflow:** 
  1. LLM first calls `planka_get_user_activity_summary` to get user's activity
  2. LLM formats the activity into a nice report (markdown)
  3. LLM calls `planka_create_daily_report_card` with name + formatted content
- Automatically places card in correct project/board/list
- Enriches with dual calendar dates

**Impact:**
- Separation of concerns: data fetching vs card creation
- LLM has full control over report formatting
- More flexible - can create reports from any source, not just activity data

### 3. Daily Report Generation Improvements

#### File: `packages/mcp-planka/src/helpers/daily-reports.ts` - `generateDailyReportFromTasks()`

**Major Rewrite:**

**Before:**
- Basic report with limited organization
- Fetched 50 actions maximum
- Simple text formatting
- No activity summary

**After:**
- Comprehensive structured report with:
  - Summary section with activity counts
  - Tasks grouped by card/project
  - Cards organized by type (created/updated/moved)
  - Comments grouped by card with excerpts
  - Better date formatting (e.g., "Monday, January 15, 2024")
  - Project/Board/List hierarchy shown
  - Deduplication of card updates
  - Optional detail level (includeDetails parameter)
  
**Specific Improvements:**
- Increased activity fetch limit to 200 (from default)
- Added `includeDetails` option to control verbosity
- Separate sections for:
  - ✅ Completed Tasks (grouped by card)
  - 🆕 Created Cards (with full hierarchy)
  - 📝 Updated Cards (deduplicated)
  - 🔄 Moved Cards
  - 💬 Comments & Discussions (grouped by card with preview)
- Better formatting with Markdown structure
- Generation timestamp at bottom

**Example Output Structure:**
```markdown
# Daily Report - Monday, January 15, 2024

## Summary
- **Total Activities:** 45
- **Tasks Completed:** 12
- **Cards Created:** 3
- **Cards Updated:** 8
- **Cards Moved:** 2
- **Comments Added:** 20

## ✅ Completed Tasks (12)
### Feature Implementation (Project A)
- ✅ Add user authentication
- ✅ Create login page
- ✅ Implement JWT tokens

## 🆕 Created Cards (3)
- **New Feature Request**
  - Project: Customer Portal > Development > Backlog
  - Initial requirements gathered...

## 💬 Comments & Discussions (20)
### Bug Fix PR (Project A) - 5 comment(s)
- "Reviewed the changes, looks good..."
- "Added suggestions for error handling..."
```

### 4. Daily Report Retrieval Improvements

#### File: `packages/mcp-planka/src/helpers/daily-reports.ts` - `getUserDailyReports()`

**Changes:**
- Enhanced board matching logic with multiple strategies:
  1. Name contains username (case-insensitive)
  2. Exact username match
  3. Username as part of board name
  4. Try with user.username field as fallback
- Added console logging for debugging:
  - Log when user not found in project
  - Log when board not found (shows available boards)
  - Log number of cards found
- Better error handling with context

**Impact:**
- More likely to find user's board even with name variations
- Easier debugging when reports aren't found
- Better visibility into what's happening

### 5. Date Parsing Improvements

#### File: `packages/mcp-planka/src/helpers/daily-reports.ts` - `extractDateFromCard()`

**Changes:**
- Added support for MM/DD/YYYY (US format)
- Smart detection of day/month ambiguity
- Falls back to multiple parsing strategies

**Supported Formats:**
1. `YYYY-MM-DD` (ISO format)
2. `YYYY/MM/DD`
3. `DD/MM/YYYY` or `DD-MM-YYYY`
4. `MM/DD/YYYY` (with smart ambiguity resolution)
5. Natural language parsed by Date constructor
6. Fallback to card creation date

**Impact:**
- More flexible date handling
- Works with various regional date formats
- Fewer failures when extracting dates from card names

## How to Use

### For "What Have I Done" Queries

**Best Practice:**
Use `planka_get_user_activity_summary` with date range:

```typescript
{
  name: 'planka_get_user_activity_summary',
  arguments: {
    startDate: 'today',  // or '2 days ago', 'monday this week'
    endDate: 'now',
    limit: 100
  }
}
```

**This returns:**
- List of all actions (creates, updates, moves, comments, tasks)
- actionsByType statistics
- Full context (project, board, list, card names)

### For Checking Existing Daily Reports

**Use:** `planka_get_user_daily_reports`

```typescript
{
  name: 'planka_get_user_daily_reports',
  arguments: {
    startDate: 'today',  // REQUIRED for time-based queries
    endDate: 'now',
    includeSummary: true
  }
}
```

**This returns:**
- Existing daily report cards
- Content from card descriptions + comments
- Summary of reported vs missing dates (if includeSummary=true)

### For Generating Daily Reports

**Use:** `planka_create_daily_report_card` (NEW)

**Workflow:**
```typescript
// Step 1: Get user's activity
{
  name: 'planka_get_user_activity_summary',
  arguments: {
    startDate: 'today',
    endDate: 'now',
    limit: 100
  }
}

// Step 2: Format the activity data into a nice report (LLM does this)

// Step 3: Create the daily report card with formatted content
{
  name: 'planka_create_daily_report_card',
  arguments: {
    name: 'Daily Report',
    description: '## Summary\n- Completed 5 tasks\n- Created 2 cards\n\n## Details\n...',
    date: 'today'
  }
}
```

**This will:**
1. Create a new daily report card in the appropriate project/board/list
2. Add dual calendar dates automatically
3. Place in correct location based on user's board

**Note:** The tool does NOT fetch activity - you must gather and format data first using other tools.

## Key Improvements Summary

| Issue | Solution | Impact |
|-------|----------|--------|
| "What I have done" not working | Increased limits (50→100 actions, 10→20 boards), added statistics | More comprehensive activity capture |
| LLM choosing wrong tool | Enhanced tool descriptions, clear guidance | Better tool selection |
| Daily report generation poor quality | Complete rewrite with structured output, grouping, deduplication | Professional, organized reports |
| Daily reports not found | Multiple board matching strategies, better logging | Higher success rate |
| Date parsing failures | Support more formats, smart ambiguity resolution | Handles various date formats |
| Missing date context | Better tool descriptions with date parameter examples | LLM provides dates more often |

## Testing Recommendations

1. **Test Activity Summary:**
   - Query: "What did I do today?"
   - Query: "Show my activity for last 2 days"
   - Verify: Gets 100+ actions, includes all types, has statistics

2. **Test Daily Report Generation:**
   - Query: "Generate my daily report for today"
   - Verify: Creates structured report with all sections
   - Verify: Groups by card/project appropriately
   - Verify: Includes summaries

3. **Test Daily Report Retrieval:**
   - Query: "Show my daily reports from this week"
   - Verify: Finds user's board even with name variations
   - Verify: Includes content from descriptions + comments
   - Verify: Respects date filters

4. **Test Date Parsing:**
   - Create cards with various date formats in names
   - Verify: extractDateFromCard handles all formats
   - Verify: Reports are correctly filtered by date range

## Migration Notes

**Breaking Changes:** None

**New Features:**
- `planka_create_daily_report_card` tool (NEW) - creates cards with provided content
- `limit` parameter in activity summary
- `actionsByType` statistics in activity summary
- Enhanced board matching with multiple strategies
- Better date parsing for multiple formats

**Backward Compatibility:** All existing code remains functional

## Performance Considerations

- Increased limits (100 actions, 20 boards) may cause slightly longer response times
- Daily report generation with `includeDetails=true` fetches more data
- Multiple board matching strategies add minimal overhead
- Console logging can be disabled in production if needed

## Next Steps (Optional Future Enhancements)

1. **Caching:** Cache user board lookups to reduce API calls
2. **Batch Operations:** Generate reports for multiple dates at once
3. **Templates:** Allow custom report templates
4. **Auto-generation:** Scheduled daily report generation
5. **Rich Formatting:** Add support for charts/graphs in reports
6. **Export:** PDF/email export of daily reports
