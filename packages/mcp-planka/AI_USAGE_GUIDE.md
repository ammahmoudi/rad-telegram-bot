# Planka MCP AI Usage Guide

This guide helps AI assistants understand how to best use Planka MCP tools for common user scenarios.

## 🎯 Common User Scenarios and Tool Selection

### 1. **Asking About a Person/User**

**User Query Examples:**
- "Tell me about Sarah"
- "What is John's status?"
- "Show me Ahmad's recent work"
- "What has Mohammad been doing?"

**AI Strategy:**
1. **First, search for the user** using `planka_search_users_advanced` or `planka_global_search_advanced`
2. **Get their activity** using `planka_get_user_activity_summary` (provides actions + notifications)
3. **Get their daily reports** using `planka_get_user_daily_reports` (shows what they've reported)
4. **Get their assigned tasks** using `planka_filter_cards` with `assignedToUserId`
5. **Analyze and synthesize** the information to provide a comprehensive status

**Example Tool Flow:**
```
1. planka_search_users_advanced(query: "Sarah")
2. planka_get_user_activity_summary(userId: "sarah_id", startDate: "7 days ago")
3. planka_get_user_daily_reports(userId: "sarah_id", startDate: "7 days ago")
4. planka_filter_cards(assignedToUserId: "sarah_id", status: "open")
```

---

### 2. **Asking About a Project**

**User Query Examples:**
- "What's the status of Project X?"
- "Show me the Mobile App project"
- "How is the Backend project going?"

**AI Strategy:**
1. **Search for the project** using `planka_search_projects_advanced`
2. **Get project status** using `planka_get_project_status` (provides boards, cards, completion rates)
3. **Optionally check specific boards** using `planka_get_board_status` for detailed list breakdowns
4. **Present organized summary** with progress, team members, and key metrics

**Example Tool Flow:**
```
1. planka_search_projects_advanced(query: "Mobile App")
2. planka_get_project_status(projectId: "project_id")
```

---

### 3. **Asking About a Card/Task**

**User Query Examples:**
- "Show me card #123"
- "Find the login bug card"
- "What's the status of the authentication task?"

**AI Strategy:**
1. **Search for the card** using `planka_search_cards_advanced` or `planka_global_search_advanced`
2. **If you have the card ID**, you can use board/list tools to get full details
3. **Present card details** including status, assignees, comments, tasks, deadline

**Example Tool Flow:**
```
1. planka_search_cards_advanced(query: "login bug")
   OR
   planka_global_search_advanced(query: "authentication task", types: ["card"])
```

---

### 4. **"What Did I Do Today?" - Viewing Past Work**

**User Query Examples:**
- "What did I do today?"
- "Show me my work this week"
- "What have I accomplished?"
- "My activity yesterday"

**AI Strategy:**
1. **Use `planka_get_user_activity_summary`** with appropriate date range
   - This provides BOTH actions (what they did) AND notifications (what happened to them)
2. **Optionally get daily reports** using `planka_get_user_daily_reports` to see what they formally reported
3. **Present organized summary** categorized by type (created cards, completed tasks, comments posted, etc.)

**Example Tool Flow:**
```
planka_get_user_activity_summary(startDate: "today", includeActivity: true, includeNotifications: true)
```

**Important Notes:**
- For "today", use `startDate: "today"`
- For "this week", use `startDate: "monday this week"`
- For "last 7 days", use `startDate: "7 days ago"`

---

### 5. **"Write My Daily Report" - Creating New Report**

**User Query Examples:**
- "Create my daily report"
- "Write today's report for me"
- "I want to submit my daily report"
- "Help me write what I did today"

**AI Strategy:**
1. **Get user's actions for today** using `planka_get_user_activity_summary(startDate: "today")`
2. **Find tasks with upcoming/today deadlines** using `planka_filter_cards` with deadline filters
3. **Find incomplete tasks** assigned to user
4. **Generate suggested report content** based on:
   - Cards they worked on
   - Tasks they completed
   - Comments they made
   - Tasks nearing deadline
5. **Present suggestions to user** and ask for confirmation or modifications
6. **Create the report** using `planka_create_daily_report_card` with proper format

**Example Tool Flow:**
```
1. planka_get_user_activity_summary(startDate: "today")
2. planka_filter_cards(assignedToUserId: "me", dueDateTo: "today", status: "open")
3. planka_filter_cards(assignedToUserId: "me", status: "open", sortBy: "dueDate")
4. [Generate suggestions based on data]
5. planka_create_daily_report_card(content: "Generated content", date: "today")
```

**Daily Report Format:**
```
Title: [User Name] - [Date in Persian/English]
Example: "امیرحسین محمودی - ۱۴۰۳/۱۰/۱۷" or "Amirhossein Mahmoudi - 2025-01-07"

Description:
# گزارش روزانه [Title based on work done]

## فعالیت‌های انجام شده
- [List completed tasks]
- [List work done]

## کارهای در دست انجام
- [Ongoing work]

## مسائل و چالش‌ها
- [Any blockers or issues]

Deadline: Same day (mark as done)
Status: Move to "Done" or completed list
```

---

### 6. **Finding Not-Done Tasks**

**User Query Examples:**
- "What tasks are not done?"
- "Show me incomplete work"
- "What's still pending?"
- "Find tasks I haven't finished"

**AI Strategy:**
1. **Use `planka_filter_cards`** with multiple criteria:
   - `status: "open"` for open cards
   - `assignedToUserId: "me"` or specific user
   - Sort by `dueDate` to show urgent items first
2. **Look for cards in specific lists** (if you know the board structure):
   - Lists named "Todo", "Not Done", "Doing", "In Progress", etc.
   - Use `planka_get_board_status` to see list structure
3. **Check deadlines**:
   - Overdue: `dueDateTo: "today"`
   - Due soon: `dueDateFrom: "today", dueDateTo: "3 days from now"`
4. **Present organized by priority**: Overdue first, then due soon, then others

**Example Tool Flow:**
```
1. planka_filter_cards(assignedToUserId: "me", status: "open", sortBy: "dueDate")
2. planka_get_project_status(projectId: "project_id", includeCompleted: false)
```

---

### 7. **Checking User Notifications**

**User Query Examples:**
- "What are my notifications?"
- "What's happening in my projects?"
- "Any updates for me?"
- "What do I need to know?"

**AI Strategy:**
1. **Use `planka_get_user_notifications`** or `planka_get_user_activity_summary` with `includeNotifications: true`
2. **Notifications show**:
   - Card assignments
   - Mentions in comments
   - Card updates on subscribed cards
   - Due date changes
3. **Present organized by**: Unread first, then by date

**Example Tool Flow:**
```
planka_get_user_notifications(unreadOnly: true)
   OR
planka_get_user_activity_summary(includeActivity: false, includeNotifications: true, unreadNotificationsOnly: true)
```

---

### 8. **Checking Team Status**

**User Query Examples:**
- "How is the team doing?"
- "Show me everyone's status"
- "Who is working on what?"

**AI Strategy:**
1. **Get all users** (if needed) using available user listing
2. **For each key team member**, use `planka_get_user_activity_summary` or `planka_get_user_daily_reports`
3. **Get project status** to see overall team progress
4. **Present organized summary** by person or by project

---

## 🔧 Tool Selection Quick Reference

| User Intent | Primary Tool | Secondary Tools |
|------------|--------------|-----------------|
| Find person | `planka_search_users_advanced` | `planka_global_search_advanced` |
| Person's status | `planka_get_user_activity_summary` | `planka_get_user_daily_reports`, `planka_filter_cards` |
| Find project | `planka_search_projects_advanced` | `planka_global_search_advanced` |
| Project status | `planka_get_project_status` | `planka_get_board_status` |
| Find card | `planka_search_cards_advanced` | `planka_global_search_advanced` |
| My work today | `planka_get_user_activity_summary` | `planka_get_user_daily_reports` |
| Write daily report | `planka_get_user_activity_summary` + `planka_filter_cards` | `planka_create_daily_report_card` |
| Not done tasks | `planka_filter_cards` | `planka_get_board_status` |
| My notifications | `planka_get_user_notifications` | `planka_get_user_activity_summary` |
| Check missing reports | `planka_get_missing_daily_reports` | - |

---

## 🎨 Daily Report Best Practices

### When Creating Daily Reports:

1. **Always use consistent format**:
   - Title: `[User Name] - [Date]`
   - Include both Persian and English if applicable
   - Example: "امیرحسین محمودی - ۱۴۰۳/۱۰/۱۷"

2. **Description structure**:
   - Start with a meaningful title (not generic)
   - Use bullet points for clarity
   - Group by activity type
   - Be specific and action-oriented

3. **Set proper deadline**:
   - Usually the same day as the report date
   - Mark as completed/done

4. **Auto-complete the card**:
   - Daily reports should be marked as done immediately
   - Move to appropriate "Done" list if available

### When Suggesting Report Content:

1. **Analyze user's actual actions** (from `planka_get_user_activity_summary`)
2. **Check tasks with today's deadline**
3. **Check incomplete assigned tasks** (might have worked on them)
4. **Present suggestions** before creating:
   - "Based on your activity, I suggest including..."
   - "You worked on these cards today: ..."
   - "These tasks have deadlines today: ..."
5. **Get user confirmation** or modifications
6. **Then create** the final report

---

## 📊 Determining Task Completion Status

A task is considered "not done" if:

1. **Status indicators**:
   - Card status is "open" (not "closed")
   - Card is not in a "Done" or "Completed" list

2. **List name patterns** (check board structure):
   - Not in lists named: "Done", "Completed", "Finished", "Closed"
   - Still in lists named: "Todo", "To Do", "Doing", "In Progress", "Not Done", "Pending"

3. **Deadline status**:
   - Has a deadline but not completed
   - Overdue (deadline < today)
   - Due soon (deadline <= 3 days)

4. **Task checklist** (if card has tasks):
   - Not all tasks are checked
   - Progress < 100%

### To find not-done tasks:

```javascript
// Get open cards sorted by deadline
planka_filter_cards({
  assignedToUserId: "me",
  status: "open",
  sortBy: "dueDate",
  sortOrder: "asc"
})

// Get board status to see list structure
planka_get_board_status({
  boardId: "board_id",
  includeCompleted: false
})
```

---

## 🎯 Tips for AI Assistants

1. **Be proactive**: When user asks vague questions, gather comprehensive data
2. **Combine tools**: Don't rely on single tool - combine activity, reports, and cards
3. **Use date filters**: Always use appropriate date ranges (today, this week, etc.)
4. **Present organized data**: Group by type, priority, date
5. **Suggest actions**: "Would you like me to create a daily report based on this activity?"
6. **Handle multiple scenarios**: "what did I do today" can mean view OR create report
7. **Use search first**: When user mentions names (person, project, card), search first to get IDs
8. **Check context**: For daily reports, check board name/user name to find correct board

---

## 🔄 Common Workflows

### Workflow 1: Complete User Status Check
```
1. Search user → Get user ID
2. Get activity summary (past week)
3. Get daily reports (past week)  
4. Get assigned open cards
5. Synthesize and present comprehensive status
```

### Workflow 2: Project Health Check
```
1. Search project → Get project ID
2. Get project status (all boards, cards)
3. For each board, check completion rates
4. Identify bottlenecks (many cards in one list)
5. Present organized status report
```

### Workflow 3: Assisted Daily Report Creation
```
1. Get user's today actions
2. Find cards with today deadline
3. Find open assigned cards (sorted by priority)
4. Generate suggestions
5. Ask user for confirmation/edits
6. Create report card with proper format
7. Confirm creation
```

### Workflow 4: Find Urgent Work
```
1. Get overdue cards (deadline < today)
2. Get due today cards
3. Get due this week cards (sorted by date)
4. Present prioritized list
5. Suggest adding to daily report if applicable
```

---

## 🌐 Multi-language Support

The system supports both **Persian (Farsi)** and **English**:

- **Daily report titles**: Can be in Persian or English
- **User names**: Can contain Persian or English characters
- **Search**: Works with both Persian and English queries
- **Date formatting**: Support both Persian calendar (۱۴۰۳/۱۰/۱۷) and Gregorian (2025-01-07)

When creating content, **match the user's language preference** based on their query or profile.

---

## ✅ Quality Checklist

Before responding to user:

- [ ] Did I search for entities (users/projects/cards) before using their IDs?
- [ ] Did I use appropriate date ranges when user mentioned time periods?
- [ ] Did I combine multiple data sources (actions + reports + cards)?
- [ ] Did I organize the data in a clear, actionable format?
- [ ] Did I suggest next actions when applicable?
- [ ] Did I use proper daily report format if creating one?
- [ ] Did I handle both Persian and English content appropriately?
- [ ] Did I check for incomplete/urgent tasks when relevant?

---

*This guide should be used by AI assistants to provide the best possible experience when working with Planka through the MCP interface.*
