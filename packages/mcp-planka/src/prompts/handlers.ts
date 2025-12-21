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
