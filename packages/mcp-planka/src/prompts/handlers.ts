import type { GetPromptRequest } from '@modelcontextprotocol/sdk/types.js';

export function handleGetPrompt(request: GetPromptRequest) {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'daily-standup':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a daily standup report for ${args?.userName}. Include:
1. ✅ Completed tasks (yesterday)
2. 🔄 In-progress tasks (today)
3. 🚧 Blockers or issues

Search for all cards assigned to "${args?.userName}" and organize by status.`,
            },
          },
        ],
      };

    case 'write-daily-report':
      const reportDate = args?.date || 'today';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help ${args?.userName} write their daily report for ${reportDate}. Follow this workflow:

**Step 1: Gather Data**
- Use planka_get_user_activity_summary(startDate: "${reportDate}") to see what they did
- Use planka_filter_cards(assignedToUserId: "me", dueDateTo: "${reportDate}", status: "open") to find tasks due today
- Use planka_filter_cards(assignedToUserId: "me", status: "open", sortBy: "dueDate") to see all pending tasks

**Step 2: Analyze & Suggest**
Based on the data, create suggestions:
- Which cards did they create/update/complete?
- Which tasks have deadlines today or are overdue?
- What comments or discussions did they participate in?
- Any significant actions taken?

**Step 3: Format Suggestions**
Present in this format:
"Based on your activity today, here's what I suggest for your daily report:

**Completed:**
- [List completed tasks]

**In Progress:**
- [List work done on ongoing tasks]

**Planned/Upcoming:**
- [Mention tasks with deadlines]

Would you like me to create this report, or would you like to modify it?"

**Step 4: Create Report**
After user confirmation, use planka_create_daily_report_card with:
- content: [Generated content]
- date: "${reportDate}"

**Important:** 
- Be specific about what was actually done
- Include card names/numbers when relevant
- Don't make up activities - only use actual data
- Match the language (Persian/English) based on user's activity`,
            },
          },
        ],
      };

    case 'check-person-status':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get comprehensive status for ${args?.targetUserName}. Follow this workflow:

**Step 1: Find the User**
- Use planka_search_users_advanced(query: "${args?.targetUserName}") to get user ID

**Step 2: Get Activity Data**
- Use planka_get_user_activity_summary(userId: [found_id], startDate: "7 days ago")
  This shows: actions performed, notifications received
- Use planka_get_user_daily_reports(userId: [found_id], startDate: "7 days ago")
  This shows: what they formally reported

**Step 3: Get Task Status**
- Use planka_filter_cards(assignedToUserId: [found_id], status: "open", sortBy: "dueDate")
  This shows: current assignments and priorities

**Step 4: Synthesize & Present**
Organize the response:

📊 **${args?.targetUserName}'s Status**

**Recent Activity (Past Week):**
- [Number] cards created
- [Number] comments posted
- [Number] tasks completed
- [Key activities]

**Daily Reports:**
- [List dates with reports]
- [Highlight key work mentioned]

**Current Assignments:**
- [Number] open tasks
- [Number] overdue (if any)
- [Next urgent items with deadlines]

**Work Focus:**
- [Main projects/areas]
- [Recent achievements]

**Important:** Present factual data only - don't speculate beyond what the data shows.`,
            },
          },
        ],
      };

    case 'find-incomplete-tasks':
      const targetUser = args?.userName || 'current user';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Find all incomplete tasks for ${targetUser}. Follow this workflow:

**Step 1: Get User ID (if needed)**
${args?.userName ? `- Use planka_search_users_advanced(query: "${args?.userName}") to get user ID` : '- Use current user (omit userId parameter)'}

**Step 2: Get Open Cards**
- Use planka_filter_cards(assignedToUserId: [user_id or "me"], status: "open", sortBy: "dueDate", sortOrder: "asc")

**Step 3: Categorize by Urgency**
Organize cards into categories:

🔴 **Overdue** (deadline < today)
🟡 **Due Today** (deadline = today)
🟠 **Due This Week** (deadline within 7 days)
🔵 **Due Later** (deadline > 7 days)
⚪ **No Deadline** (no due date set)

**Step 4: Present Organized List**
For each category, show:
- Card name and ID
- Board/Project name
- Due date
- Card type/labels (if relevant)
- Brief description

**Optional Step 5: Additional Context**
If helpful, also check:
- planka_get_board_status to see list structure (identify "Todo" vs "In Progress" lists)
- Highlight cards in "Todo" or "Not Started" lists

**Important:** 
- Sort by deadline urgency
- Highlight overdue items prominently
- Include actionable information (deadlines, priorities)`,
            },
          },
        ],
      };

    case 'my-work-today':
      // Arguments come as strings, handle accordingly
      const includeNotifs = args?.includeNotifications !== 'false';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Show comprehensive summary of what the user did today.

**Use This Tool:**
planka_get_user_activity_summary({
  startDate: "today",
  includeActivity: true,
  includeNotifications: ${includeNotifs}
})

This single call provides everything needed:
- Actions performed (cards created, comments posted, tasks completed)
- Notifications received (mentions, assignments, updates)
- Statistics and summary

**Present the data organized by type:**

📋 **Your Work Today**

**Actions You Performed:**
- Created [N] cards
- Posted [N] comments  
- Completed [N] tasks
- Updated [N] cards
- [Other actions]

**Key Activities:**
[List significant actions with card names/details]

${includeNotifs ? `**Notifications & Updates:**
- [N] new assignments
- [N] mentions/comments on your cards
- [Recent important updates]` : ''}

**Cards You Worked On:**
[List cards with what was done]

**Time Period:** Today (${new Date().toLocaleDateString()})

**Important:** 
- Be specific with card names and actions
- Group similar activities
- Highlight significant achievements
- Keep it concise but informative`,
            },
          },
        ],
      };

    case 'team-status-overview':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get overview of team status${args?.projectId ? ` for project ${args?.projectId}` : ''}:

**Step 1: Get Project/Team Context**
${args?.projectId ? `- Use planka_get_project_status(projectId: "${args?.projectId}")` : '- Use planka_get_daily_report_projects() to see team structure'}

**Step 2: Check Daily Reports Compliance**
- Use planka_get_missing_daily_reports(startDate: "monday this week", endDate: "today")
  This shows who submitted reports and who didn't

**Step 3: Get Team Activity**
For key team members:
- Use planka_get_user_activity_summary(userId: [member_id], startDate: "today" or "monday this week")

**Step 4: Present Organized Overview**

👥 **Team Status Overview**

**Daily Reports:**
- ✅ Submitted: [Names who submitted]
- ⚠️ Missing: [Names missing reports]
- 📊 Compliance Rate: [Percentage]

**Team Activity (This Week):**
[For each active team member:]
- **[Name]:**
  - [Key activities]
  - [Cards worked on]
  - Status: [Active/Blocked/etc.]

**Project Progress:**
${args?.projectId ? `- [Board-by-board status]
- [Completion rates]
- [Bottlenecks identified]` : ''}

**Attention Needed:**
- [People with missing reports]
- [Overdue tasks]
- [Blocked work]

**Important:** Focus on team coordination and collaboration, not individual performance evaluation.`,
            },
          },
        ],
      };

    case 'create-sprint-card':
      const cardType = args?.cardType || 'task';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a new ${cardType} card titled "${args?.cardTitle}" with:

**Description Template:**
## Objective
[What needs to be accomplished]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Any technical details or considerations]

## Dependencies
[Related cards or blockers]

Please help me fill this out for: ${args?.cardTitle}`,
            },
          },
        ],
      };

    case 'weekly-report':
      if (args?.userName) {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Generate a weekly status report for ${args?.userName}:

📊 **Weekly Summary**
- Total cards worked on
- Completed cards
- In-progress cards
- Overdue cards

📈 **Progress Highlights**
- Key accomplishments
- Major milestones reached

⚠️ **Attention Needed**
- Blocked or at-risk items
- Upcoming deadlines

Search for all cards assigned to "${args?.userName}" and analyze by date and status.`,
              },
            },
          ],
        };
      } else if (args?.projectId) {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Generate a weekly project status report for project ${args?.projectId}:

📊 **Project Overview**
- Total boards and cards
- Overall progress percentage
- Team members active

📈 **This Week's Progress**
- Cards completed
- New cards added
- Cards moved between lists

⚠️ **Risks & Issues**
- Overdue cards
- Blocked items
- Resource concerns

Get project details and analyze all boards and cards.`,
              },
            },
          ],
        };
      }
      break;

    case 'project-overview':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a comprehensive overview of project ${args?.projectId}:

🎯 **Project Structure**
- All boards and their purposes
- Lists/columns organization
- Total cards count

👥 **Team**
- Project members
- Card assignments distribution

📊 **Status Breakdown**
- Cards by list/status
- Completion trends
- Due dates overview

🏷️ **Labels & Categories**
- Active labels
- Common themes

Get full project data and analyze comprehensively.`,
            },
          },
        ],
      };

    case 'board-health-check':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Perform a health check on board ${args?.boardId}:

⚠️ **Issues Detected**
- Overdue cards (past due date)
- Unassigned cards (no members)
- Stale cards (no updates in 7+ days)
- Blocked cards (check descriptions/labels)

✅ **Health Indicators**
- Cards with clear assignees
- Cards with due dates
- Recent activity level

📋 **Recommendations**
- Cards needing attention
- Process improvements
- Assignment suggestions

Analyze all cards on this board and provide actionable insights.`,
            },
          },
        ],
      };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
