# Planka MCP Usage Improvements

This document describes the recent improvements made to the Planka MCP to provide better AI assistance for common use cases.

## 🎯 Overview

The Planka MCP has been enhanced with:
1. **Comprehensive AI guidance** document
2. **New specialized prompts** for common scenarios
3. **New tool** for finding incomplete tasks
4. **Enhanced prompt handlers** with detailed workflows

---

## 📚 New Documentation

### AI_USAGE_GUIDE.md

A comprehensive guide for AI assistants on how to handle common user scenarios:

- **User/Person queries**: How to check someone's status, activity, and work
- **Project queries**: How to get project status and health
- **Card/Task queries**: How to search and analyze cards
- **"What did I do today?"**: Viewing past work and activity
- **"Write my daily report"**: Assisted report creation with suggestions
- **Finding incomplete tasks**: Identifying and prioritizing not-done work
- **Notifications**: Checking what's happening in the company
- **Team status**: Getting overview of team activity and compliance

**Key Features:**
- Tool selection quick reference table
- Common workflow examples
- Daily report best practices
- Multi-language support guidelines
- Quality checklist for AI responses

---

## 🔧 New Tools

### `planka_get_incomplete_tasks`

A specialized tool that finds and categorizes incomplete tasks by urgency.

**Use Cases:**
- "What tasks are not done?"
- "Show me incomplete work"
- "What's still pending?"
- "Find tasks I haven't finished"

**Features:**
- Categorizes tasks into: OVERDUE, DUE TODAY, DUE THIS WEEK, DUE LATER, NO DEADLINE
- Includes full card context (board, project, list, labels)
- Sorts by deadline automatically
- Provides summary counts for each category

**Example Response Structure:**
```json
{
  "summary": {
    "overdue": 3,
    "dueToday": 2,
    "dueThisWeek": 5,
    "dueLater": 10,
    "noDeadline": 8,
    "total": 28
  },
  "categories": {
    "overdue": [...],
    "dueToday": [...],
    "dueThisWeek": [...],
    "dueLater": [...],
    "noDeadline": [...]
  },
  "metadata": {
    "projects": [...],
    "boards": [...],
    "lists": [...],
    "users": [...]
  }
}
```

---

## 🎨 New Prompts

### 1. `write-daily-report`

Assists users in writing their daily report by analyzing actual activity.

**Workflow:**
1. Get user's actions for the specified date
2. Find tasks with deadlines today or overdue
3. Generate suggestions based on actual work done
4. Present suggestions to user for confirmation
5. Create the report with proper format

**Format:**
- Title: `[User Name] - [Date]`
- Description: Organized sections for completed, in-progress, and planned work
- Automatically marked as done
- Proper deadline set

### 2. `check-person-status`

Get comprehensive status of a team member.

**Workflow:**
1. Search for the user
2. Get their activity summary (past week)
3. Get their daily reports
4. Get their assigned tasks
5. Synthesize into organized status report

### 3. `find-incomplete-tasks`

Find and organize not-done tasks by urgency.

**Workflow:**
1. Get all open cards for user
2. Categorize by deadline urgency
3. Optionally check board structure for list names
4. Present prioritized list with actionable information

### 4. `my-work-today`

Show comprehensive summary of what the user did today.

**Workflow:**
1. Use `planka_get_user_activity_summary` with date range
2. Organize by action type
3. Include notifications if requested
4. Present clear, organized summary

### 5. `team-status-overview`

Get overview of entire team status.

**Workflow:**
1. Check daily reports compliance
2. Get team member activities
3. Analyze project progress (if specified)
4. Identify attention items (missing reports, overdue tasks, blockers)

---

## 📝 Enhanced Prompt Handlers

All prompt handlers now include:
- **Detailed step-by-step workflows**
- **Specific tool recommendations**
- **Data organization guidelines**
- **Response formatting templates**
- **Multi-language support**

Each handler guides the AI through:
1. What data to gather (specific tools to use)
2. How to analyze the data
3. How to organize the response
4. What format to present
5. Important considerations

---

## 🔍 Common Scenarios Guide

### Scenario: "What did I do today?"

**Two possible intents:**
1. **View past work** → Use `planka_get_user_activity_summary`
2. **Write report** → Use `write-daily-report` prompt

**AI should determine intent** based on context:
- If user says "show me" or "what did I do" → View scenario
- If user says "create" or "write" → Report creation scenario

### Scenario: "Tell me about Sarah"

**Workflow:**
1. Search user: `planka_search_users_advanced(query: "Sarah")`
2. Get activity: `planka_get_user_activity_summary(userId, startDate: "7 days ago")`
3. Get reports: `planka_get_user_daily_reports(userId, startDate: "7 days ago")`
4. Get tasks: `planka_filter_cards(assignedToUserId: userId, status: "open")`
5. Synthesize and present organized status

### Scenario: "Show me incomplete tasks"

**Workflow:**
1. Use: `planka_get_incomplete_tasks()`
2. Present organized by urgency
3. Optionally suggest adding to daily report if applicable

### Scenario: "What's the status of Mobile App project?"

**Workflow:**
1. Search project: `planka_search_projects_advanced(query: "Mobile App")`
2. Get status: `planka_get_project_status(projectId)`
3. Present organized summary with boards, completion rates, key metrics

---

## 🌐 Multi-Language Support

The system supports both **Persian (Farsi)** and **English**:

- Daily report titles can be in either language
- User names support both character sets
- Search works with both languages
- Date formatting supports both calendars (Persian ۱۴۰۳/۱۰/۱۷ and Gregorian 2025-01-07)

**AI should:**
- Match user's language preference
- Support Persian dates and names
- Handle mixed-language content gracefully

---

## 🎯 Daily Report Best Practices

### Format Standards

**Title:**
```
[User Name] - [Date]
Example: "امیرحسین محمودی - ۱۴۰۳/۱۰/۱۷"
Example: "Amirhossein Mahmoudi - 2025-01-07"
```

**Description Structure:**
```markdown
# گزارش روزانه [Meaningful Title Based on Work]

## فعالیت‌های انجام شده
- [Specific completed tasks]
- [Work done with card references]

## کارهای در دست انجام
- [Ongoing work]

## مسائل و چالش‌ها
- [Blockers or issues if any]
```

**Metadata:**
- Deadline: Same day as report date
- Status: Marked as done immediately
- List: Move to "Done" or completed list

### When Suggesting Report Content

AI should:
1. **Analyze actual actions** from `planka_get_user_activity_summary`
2. **Check tasks with today's deadline**
3. **Check incomplete assigned tasks** (might have worked on them)
4. **Present suggestions** before creating
5. **Get user confirmation** or modifications
6. **Then create** the final report

**DO NOT:**
- Make up activities
- Include generic statements
- Create reports without data analysis
- Skip user confirmation

---

## 🔄 Tool Selection Strategy

### Quick Decision Tree

**User asks about a person?**
→ Search user → Get activity/reports/tasks → Synthesize

**User asks about a project?**
→ Search project → Get project status → Present organized

**User asks "what did I do"?**
→ Get activity summary with date range → Present organized

**User asks to "write report"?**
→ Get activity + tasks → Generate suggestions → Confirm → Create

**User asks "what's not done"?**
→ Use incomplete tasks tool → Categorize by urgency → Present

**User asks "my notifications"?**
→ Get notifications (or activity summary with notifications) → Present organized

---

## ✅ Quality Checklist

Before AI responds to user:

- [ ] Did I search for entities before using their IDs?
- [ ] Did I use appropriate date ranges for time-based queries?
- [ ] Did I combine multiple data sources (actions + reports + cards)?
- [ ] Did I organize data clearly and actionably?
- [ ] Did I suggest next actions when applicable?
- [ ] Did I use proper format for daily reports?
- [ ] Did I handle both Persian and English appropriately?
- [ ] Did I check for incomplete/urgent tasks when relevant?

---

## 🚀 Benefits

### For Users
- **More natural interactions**: Ask questions in plain language
- **Better assistance**: AI understands context and provides comprehensive answers
- **Guided workflows**: AI helps with complex tasks like writing reports
- **Multi-language**: Support for Persian and English
- **Time-saving**: Quick access to status, tasks, and activity

### For AI Assistants
- **Clear guidance**: Know exactly which tools to use for each scenario
- **Structured workflows**: Step-by-step instructions for complex tasks
- **Better responses**: Templates and examples for consistent, high-quality output
- **Error reduction**: Checklists and validation guidelines

---

## 📊 Example Interactions

### Example 1: View Today's Work
```
User: "What did I do today?"
AI: Uses planka_get_user_activity_summary(startDate: "today")
     Presents organized summary of actions, cards worked on, comments posted
```

### Example 2: Write Daily Report
```
User: "Create my daily report"
AI: 1. Gets today's activity
    2. Finds tasks due today
    3. Suggests: "You worked on cards X, Y, Z. Would you like to include..."
    4. User confirms/modifies
    5. Creates report with proper format
```

### Example 3: Check Team Member
```
User: "Tell me about Ahmad's work this week"
AI: 1. Searches for Ahmad
    2. Gets his activity (past week)
    3. Gets his daily reports
    4. Gets his assigned tasks
    5. Presents: "Ahmad has completed 5 cards, is working on 3, has 2 overdue..."
```

### Example 4: Find Urgent Work
```
User: "What tasks are overdue?"
AI: Uses planka_get_incomplete_tasks()
    Presents: "🔴 OVERDUE (3 tasks): [list with deadlines]
               🟡 DUE TODAY (2 tasks): [list]
               ..."
```

---

## 🔧 Implementation Details

### Files Changed

1. **AI_USAGE_GUIDE.md** (new)
   - Comprehensive guidance document
   - Common scenarios and workflows
   - Tool selection strategies
   - Best practices and checklists

2. **src/prompts/prompts.ts**
   - Added 5 new prompts
   - Enhanced descriptions for better AI understanding

3. **src/prompts/handlers.ts**
   - Enhanced all handlers with detailed workflows
   - Added step-by-step instructions
   - Added formatting templates
   - Added important considerations

4. **src/tools/user-activity.tools.ts**
   - Added `planka_get_incomplete_tasks` tool
   - Enhanced with categorization logic
   - Integrated with existing `filterCards` API

5. **USAGE_IMPROVEMENTS.md** (this file)
   - Documents all improvements
   - Provides examples and guidelines

---

## 📖 How to Use

### For AI Developers

1. **Read AI_USAGE_GUIDE.md** first to understand common scenarios
2. **Use the quick reference table** to select appropriate tools
3. **Follow the workflows** in prompt handlers for complex tasks
4. **Refer to the quality checklist** before responding

### For Users

Simply ask questions naturally:
- "What did I do today?"
- "Create my daily report"
- "Tell me about Sarah"
- "What tasks are overdue?"
- "Show me the Mobile App project status"

The AI will understand and provide comprehensive, well-organized responses.

---

## 🎓 Training the AI

When training or prompting the AI to use this MCP:

1. **Point to AI_USAGE_GUIDE.md** as the primary reference
2. **Emphasize the importance** of combining multiple tools
3. **Encourage proactive behavior** - gather comprehensive data
4. **Stress proper formatting** especially for daily reports
5. **Highlight multi-language support** for Persian/English

---

## 🔮 Future Enhancements

Potential future improvements:

1. **Analytics dashboard**: Aggregate team statistics over time
2. **Smart suggestions**: ML-based task prioritization
3. **Automated report generation**: Fully automated daily reports
4. **Integration with calendars**: Sync deadlines with external calendars
5. **Custom workflows**: User-defined workflows for specific scenarios

---

*This document reflects the state of the Planka MCP as of the latest improvements. For the most up-to-date information, refer to the actual source code and AI_USAGE_GUIDE.md.*
