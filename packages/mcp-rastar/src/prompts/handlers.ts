import type { GetPromptRequest } from '@modelcontextprotocol/sdk/types.js';

/**
 * Handle prompt template requests
 */
export function handleGetPrompt(request: GetPromptRequest) {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'weekly-menu-planner':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me plan my food selections for the entire week.

**My preferences:** ${args?.preferences || 'No specific preferences'}

Please:
1. Fetch this week's menu (rastar://menu/this-week)
2. Check my current selections and stats
3. Suggest food selections that:
   - Provide variety (avoid repeating same food)
   - Match my preferences
   - Fill in any unselected days
4. Use bulk_select_foods to apply the selections

Present the plan before applying it.`,
            },
          },
        ],
      };

    case 'today-menu-selector':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me select food for today.

**My preferences:** ${args?.preferences || 'No specific preferences'}

Please:
1. Fetch today's menu (rastar://menu/today)
2. Show me all available options
3. Recommend the best choice based on:
   - My preferences
   - Variety (check what I selected recently)
   - Nutritional balance
4. Ask for confirmation before selecting

Make it conversational and friendly!`,
            },
          },
        ],
      };

    case 'selection-reminder':
      const daysAhead = args?.daysAhead || 7;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a friendly reminder about unselected days.

Check the next ${daysAhead} days and:
1. Fetch unselected days (rastar://menu/unselected-days with filter)
2. Fetch selection stats for context
3. Create a friendly reminder message that includes:
   - Number of days needing selection
   - Specific dates
   - Deadline urgency (if within 2 days)
   - Quick action suggestion

Format it in a natural, helpful tone.`,
            },
          },
        ],
      };

    case 'menu-report':
      const period = args?.period || 'week';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a comprehensive menu report for ${period}.

Please create a report with:

**📊 Statistics**
- Fetch selection stats (rastar://menu/selection-stats)
- Selection completion rate
- Days selected vs available

**🍽️ Upcoming Meals**
- Fetch ${period === 'week' ? 'this week' : 'upcoming'} menu
- Show selected foods with dates
- Highlight any gaps

**⚠️ Action Items**
- Unselected days that need attention
- Deadline warnings

**📈 Insights**
- Food variety analysis
- Patterns or suggestions

Format it professionally with emojis and clear sections.`,
            },
          },
        ],
      };

    case 'auto-select-week':
      const avoidDuplicates = args?.avoidDuplicates !== 'false';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Automatically select meals for this week with smart variety.

**Preferences:** ${args?.preferences || 'None specified'}
**Avoid duplicates:** ${avoidDuplicates ? 'Yes' : 'No'}

Algorithm:
1. Fetch this week's menu (rastar://menu/this-week)
2. Get current selections
3. For each unselected day:
   - Filter options by preferences
   - ${avoidDuplicates ? 'Avoid foods already selected this week' : 'Any available food is fine'}
   - Prefer variety and balance
4. Use bulk_select_foods to apply all at once
5. Show summary of selections

**Important:** Ask for confirmation before applying!`,
            },
          },
        ],
      };

    case 'change-tomorrow':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Help me change tomorrow's food selection.

**Reason:** ${args?.reason || 'Just want something different'}

Please:
1. Fetch tomorrow's menu (rastar://menu/tomorrow)
2. Show current selection
3. Suggest alternatives based on:
   - My stated reason
   - What I've eaten recently (check this week)
   - Variety and balance
4. Use change_selection tool after I confirm

Keep it conversational - ask questions if needed!`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
