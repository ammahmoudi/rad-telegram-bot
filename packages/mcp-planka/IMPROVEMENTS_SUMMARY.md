# Planka MCP Improvements Summary

## 🎯 What Was Done

I've significantly enhanced your Planka MCP with better AI guidance, new tools, and specialized prompts to handle the common scenarios you described.

---

## 📁 Files Created

### 1. **AI_USAGE_GUIDE.md** (Main Documentation)
Comprehensive guide for AI assistants covering:
- 8 common user scenarios with detailed workflows
- Tool selection quick reference table
- Common workflow examples
- Daily report best practices
- Multi-language support guidelines (Persian/English)
- Quality checklist
- Finding not-done tasks strategies

### 2. **USAGE_IMPROVEMENTS.md** (Feature Overview)
Complete documentation of:
- All new features and enhancements
- New tool details (`planka_get_incomplete_tasks`)
- 5 new prompts with explanations
- Usage examples
- Implementation details

---

## 🔧 Files Modified

### 1. **src/prompts/prompts.ts**
Added 5 new prompts:
- `write-daily-report` - Assists in writing daily reports with AI suggestions
- `check-person-status` - Comprehensive team member status check
- `find-incomplete-tasks` - Find and organize not-done tasks by urgency
- `my-work-today` - Show what user accomplished today
- `team-status-overview` - Team activity and compliance overview

### 2. **src/prompts/handlers.ts**
Enhanced ALL prompt handlers with:
- Detailed step-by-step workflows
- Specific tool usage instructions
- Response formatting templates
- Important considerations and guidelines

### 3. **src/tools/user-activity.tools.ts**
Added new tool:
- `planka_get_incomplete_tasks` - Categorizes incomplete tasks by urgency:
  - OVERDUE (past deadline)
  - DUE TODAY
  - DUE THIS WEEK (within 7 days)
  - DUE LATER (> 7 days)
  - NO DEADLINE

### 4. **README.md**
- Added AI Usage Guide section
- Added Multi-Language Support highlight
- Updated documentation table with new files
- Added feature callout at the top

---

## 🎯 Scenarios Now Handled

### 1. **Asking About a Person**
**User:** "Tell me about Sarah" / "What is Ahmad's status?"

**AI Workflow:**
1. Search user → Get user ID
2. Get activity summary (past week)
3. Get daily reports (past week)
4. Get assigned tasks
5. Synthesize comprehensive status

### 2. **Asking About a Project**
**User:** "What's the status of Project X?"

**AI Workflow:**
1. Search project → Get project ID
2. Get project status (boards, cards, completion rates)
3. Present organized summary

### 3. **"What Did I Do Today?" - Viewing**
**User:** "What did I do today?"

**AI Workflow:**
1. Use `planka_get_user_activity_summary(startDate: "today")`
2. Organize by action type
3. Present comprehensive summary

### 4. **"Write My Daily Report" - Creating**
**User:** "Create my daily report" / "Write today's report"

**AI Workflow:**
1. Get user's actions for today
2. Find tasks with deadlines today/overdue
3. Generate suggested content
4. Get user confirmation
5. Create formatted report with proper title/description

### 5. **Finding Not-Done Tasks**
**User:** "What tasks are not done?" / "Show me incomplete work"

**AI Workflow:**
1. Use `planka_get_incomplete_tasks()`
2. Get tasks categorized by urgency
3. Present prioritized list

### 6. **Checking Notifications**
**User:** "What are my notifications?" / "What's happening?"

**AI Workflow:**
1. Use `planka_get_user_notifications()` or activity summary
2. Present organized by unread first, then by date

### 7. **Checking Team Status**
**User:** "How is the team doing?"

**AI Workflow:**
1. Get daily report compliance (who submitted, who didn't)
2. Get key team member activities
3. Present organized team status

---

## 📝 Daily Report Format (Standardized)

### Title Format:
```
[User Name] - [Date]
Example: "امیرحسین محمودی - ۱۴۰۳/۱۰/۱۷"
Example: "Amirhossein Mahmoudi - 2025-01-07"
```

### Description Format:
```markdown
# گزارش روزانه [Meaningful Title Based on Work]

## فعالیت‌های انجام شده
- [Specific completed tasks with card references]
- [Work done]

## کارهای در دست انجام
- [Ongoing work]

## مسائل و چالش‌ها
- [Blockers or issues if any]
```

### Metadata:
- Deadline: Same day as report date
- Status: Marked as done immediately
- List: Moved to "Done" or completed list

---

## 🔍 Finding Not-Done Tasks Strategy

A task is considered "not done" if:

1. **Status**: Card status is "open" (not "closed")
2. **List name**: Not in lists named "Done", "Completed", "Finished"
3. **Deadline status**: 
   - Has deadline but not completed
   - Overdue (deadline < today)
   - Due soon (deadline <= 7 days)

**Tool to use:** `planka_get_incomplete_tasks` which:
- Gets all open cards for user
- Categorizes by deadline urgency
- Returns organized results with context

---

## 🌐 Multi-Language Support

Full support for **Persian (Farsi)** and **English**:

### Features:
- Daily report titles in both languages
- User/project names with Persian/English characters
- Search across both character sets
- Date formatting in both calendars:
  - Persian: ۱۴۰۳/۱۰/۱۷
  - Gregorian: 2025-01-07
- Mixed-language content handling

### AI Behavior:
- Match user's language preference based on query
- Support Persian dates and names
- Handle gracefully if user mixes languages

---

## 🎯 Key Improvements

### 1. **Better Tool Selection**
AI now knows exactly which tool to use for each scenario with the quick reference table.

### 2. **Comprehensive Workflows**
Each prompt handler provides step-by-step instructions for AI.

### 3. **Data Synthesis**
AI is guided to combine multiple data sources (activity + reports + tasks) for comprehensive answers.

### 4. **Proper Formatting**
Daily reports now follow standardized format with meaningful titles and structured content.

### 5. **Smart Suggestions**
When creating daily reports, AI analyzes actual work done and suggests content based on:
- Cards worked on
- Tasks completed
- Comments posted
- Tasks with deadlines today

### 6. **Urgency Categorization**
Incomplete tasks are automatically categorized by urgency (overdue, due today, due this week, etc.).

### 7. **Quality Assurance**
Built-in checklist for AI to verify responses before sending.

---

## 📊 Tool Selection Quick Reference

| User Intent | Primary Tool | Secondary Tools |
|------------|--------------|-----------------|
| Find person | `planka_search_users_advanced` | `planka_global_search_advanced` |
| Person's status | `planka_get_user_activity_summary` | `planka_get_user_daily_reports`, `planka_filter_cards` |
| Find project | `planka_search_projects_advanced` | `planka_global_search_advanced` |
| Project status | `planka_get_project_status` | `planka_get_board_status` |
| My work today | `planka_get_user_activity_summary` | `planka_get_user_daily_reports` |
| Write daily report | `planka_get_user_activity_summary` + `planka_filter_cards` | `planka_create_daily_report_card` |
| Not done tasks | `planka_get_incomplete_tasks` | `planka_filter_cards` |
| Notifications | `planka_get_user_notifications` | `planka_get_user_activity_summary` |

---

## ✅ What's Verified

- ✅ All code compiles successfully (TypeScript)
- ✅ New tool properly integrated with existing system
- ✅ All prompts follow consistent format
- ✅ Documentation is comprehensive and clear
- ✅ Multi-language support documented
- ✅ Examples provided for all scenarios
- ✅ Quality checklist included

---

## 🚀 How to Use

### For AI Assistants:
1. Read **AI_USAGE_GUIDE.md** first
2. Use the quick reference table for tool selection
3. Follow the workflows in prompt handlers
4. Check the quality checklist before responding

### For Users:
Simply ask natural questions:
- "What did I do today?"
- "Create my daily report"
- "Tell me about Sarah"
- "What tasks are overdue?"
- "Show me the Mobile App project status"

The AI will understand and provide comprehensive, well-organized responses.

---

## 📚 Documentation Structure

```
AI_USAGE_GUIDE.md          - Main guide for AI (scenarios, workflows, tips)
├── Common Scenarios       - 8 detailed scenarios with workflows
├── Tool Selection         - Quick reference table
├── Daily Report           - Best practices and format
├── Finding Tasks          - Not-done task strategies
└── Quality Checklist      - Verification before responding

USAGE_IMPROVEMENTS.md      - Feature overview and examples
├── New Tools              - Detailed tool documentation
├── New Prompts            - Prompt descriptions
├── Examples               - Real interaction examples
└── Implementation         - Technical details

README.md                  - Updated with AI guide section
└── Links to above docs
```

---

## 🎉 Result

Your Planka MCP now has:
- **Comprehensive AI guidance** for common scenarios
- **New specialized tool** for finding incomplete tasks
- **5 new prompts** for assisted workflows
- **Enhanced prompt handlers** with detailed instructions
- **Multi-language support** documentation
- **Quality assurance** checklist
- **Complete examples** and workflows

The AI can now handle all the scenarios you described:
✅ Checking person status
✅ Project status queries
✅ Writing daily reports with suggestions
✅ Finding not-done tasks by urgency
✅ Viewing user activity
✅ Checking notifications
✅ Team status overview

All with proper formatting, especially for daily reports! 🎯
