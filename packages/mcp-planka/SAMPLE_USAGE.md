# MCP Planka - Sample Usage Examples

## 🚀 Quick Start

### 1. Setup Your Credentials

```bash
export PLANKA_URL="https://your-planka-server.com"
export PLANKA_TOKEN="your-access-token-here"
```

---

## 📖 How to Access Documentation

The MCP server includes built-in documentation accessible via the resource:

```
planka://docs/examples
```

### From MCP Inspector

1. Start the MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector npx tsx packages/mcp-planka/src/index.ts
   ```

2. Open the URL shown in your browser

3. Navigate to **Resources** tab

4. Click on **"MCP Usage Examples & Documentation"**

5. You'll see the complete guide with all tools, resources, and examples!

### From Claude Desktop

Simply ask:
```
Show me the Planka MCP documentation
```

Or:
```
Read the resource planka://docs/examples
```

---

## 🎯 Common Usage Examples

### Example 1: Create a New Project with Complete Setup

```json
// Step 1: Create Project
Tool: projects.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "name": "Q1 2025 Sprint"
}

// Step 2: Create Board
Tool: boards.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "projectId": "proj-abc123",
  "name": "Development Board",
  "position": 1
}

// Step 3: Create Lists
Tool: lists.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "name": "Backlog",
  "position": 1
}

// Repeat for: To Do, In Progress, Review, Done
```

### Example 2: Create a Card with Full Details

```json
// Create the card
Tool: cards.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "listId": "list-123",
  "name": "Implement User Authentication",
  "description": "Add OAuth 2.0 authentication flow",
  "position": 1
}

// Add a label
Tool: labels.addToCard
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "labelId": "label-789"
}

// Assign a team member
Tool: members.addToCard
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "userId": "user-321"
}

// Add tasks/checklist
Tool: tasks.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "name": "Setup OAuth provider",
  "position": 1
}

Tool: tasks.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "name": "Implement login flow",
  "position": 2
}

Tool: tasks.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "name": "Add unit tests",
  "position": 3
}
```

### Example 3: Move Card Through Workflow

```json
// Move to In Progress
Tool: cards.move
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "listId": "list-in-progress",
  "position": 0
}

// Add progress comment
Tool: comments.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "text": "Started working on OAuth integration. Setup complete."
}

// Mark task as complete
Tool: tasks.update
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "taskId": "task-111",
  "isCompleted": true
}

// Move to Done
Tool: cards.move
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "listId": "list-done",
  "position": 0
}

// Add completion comment
Tool: comments.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "cardId": "card-456",
  "text": "✅ Authentication implemented and tested. Ready for review."
}
```

### Example 4: Create Labels for Organization

```json
// Bug label
Tool: labels.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "name": "Bug",
  "color": "berry-red",
  "position": 1
}

// Feature label
Tool: labels.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "name": "Feature",
  "color": "ocean-blue",
  "position": 2
}

// Priority label
Tool: labels.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "name": "High Priority",
  "color": "warm-orange",
  "position": 3
}

// Documentation label
Tool: labels.create
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token",
  "boardId": "board-xyz789",
  "name": "Documentation",
  "color": "green-grass",
  "position": 4
}
```

### Example 5: Use Resources to Read Data

```javascript
// Get all projects
Resource: planka://projects?plankaBaseUrl=https://planka.example.com&plankaToken=your-token

// Get specific project details
Resource: planka://projects/proj-abc123?plankaBaseUrl=https://planka.example.com&plankaToken=your-token

// Get board with all lists and cards
Resource: planka://boards/board-xyz789?plankaBaseUrl=https://planka.example.com&plankaToken=your-token

// Get all cards assigned to a user
Resource: planka://users/user-321/assigned-cards?plankaBaseUrl=https://planka.example.com&plankaToken=your-token

// Get all cards in a project
Resource: planka://projects/proj-abc123/cards?plankaBaseUrl=https://planka.example.com&plankaToken=your-token
```

### Example 6: Use Workflow Prompts

```json
// Generate daily standup report
Prompt: daily-standup
{
  "telegramUserId": "12345",
  "userName": "John Doe"
}

// Create a well-structured sprint card
Prompt: create-sprint-card
{
  "telegramUserId": "12345",
  "cardTitle": "Implement payment gateway",
  "cardType": "feature"
}

// Generate weekly status report
Prompt: weekly-report
{
  "telegramUserId": "12345",
  "userName": "John Doe",
  "projectId": "proj-abc123"
}

// Get project overview
Prompt: project-overview
{
  "telegramUserId": "12345",
  "projectId": "proj-abc123"
}

// Check board health
Prompt: board-health-check
{
  "telegramUserId": "12345",
  "boardId": "board-xyz789"
}
```

---

## 🔄 Real-World Workflow Examples

### Workflow 1: Sprint Planning

```json
// 1. Create sprint board
Tool: boards.create
Args: { name: "Sprint 24", projectId: "..." }

// 2. Create standard lists
Tool: lists.create (×5)
Args: { name: "Backlog|To Do|In Progress|Review|Done" }

// 3. Create priority labels
Tool: labels.create (×3)
Args: { name: "P1|P2|P3", color: "..." }

// 4. Import user stories as cards
Tool: cards.create (×N)
Args: { name: "User story title", description: "..." }

// 5. Assign story points via card description
Tool: cards.update
Args: { description: "Story Points: 5\n\n..." }

// 6. Assign team members
Tool: members.addToCard (×N)
Args: { cardId: "...", userId: "..." }
```

### Workflow 2: Bug Tracking

```json
// 1. Create bug card
Tool: cards.create
{
  "boardId": "board-xyz789",
  "listId": "list-backlog",
  "name": "🐛 Login fails on mobile Safari",
  "description": "**Steps to reproduce:**\n1. Open on iOS Safari\n2. Enter credentials\n3. Click login\n\n**Expected:** Success\n**Actual:** Error 500"
}

// 2. Add bug label
Tool: labels.addToCard
{ "cardId": "...", "labelId": "label-bug" }

// 3. Add priority label
Tool: labels.addToCard
{ "cardId": "...", "labelId": "label-urgent" }

// 4. Assign to developer
Tool: members.addToCard
{ "cardId": "...", "userId": "dev-user-id" }

// 5. Add investigation tasks
Tool: tasks.create (×3)
Args: { name: "Reproduce locally|Check logs|Test fix" }

// 6. Move to in-progress
Tool: cards.move
{ "cardId": "...", "listId": "list-in-progress" }
```

### Workflow 3: Team Collaboration

```json
// 1. Get current user info
Tool: users.getCurrent
{ "plankaBaseUrl": "...", "plankaToken": "..." }

// 2. Check my assigned cards
Resource: planka://users/{myUserId}/assigned-cards?...

// 3. Add comment for team
Tool: comments.create
{
  "cardId": "card-456",
  "text": "@john Need your input on the API design. Check the attachment."
}

// 4. Upload design document
Tool: attachments.upload
{
  "cardId": "card-456",
  "file": "base64-encoded-file",
  "filename": "api-design.pdf"
}

// 5. Update due date
Tool: cards.update
{
  "cardId": "card-456",
  "dueDate": "2025-12-31T23:59:59Z"
}

// 6. Check board health
Prompt: board-health-check
{ "boardId": "board-xyz789" }
```

---

## 💡 Pro Tips

### Tip 1: Batch Operations
When creating multiple items, structure your calls efficiently:

```json
// Instead of creating cards one by one, prepare all data first
const cards = [
  { name: "Card 1", position: 1 },
  { name: "Card 2", position: 2 },
  { name: "Card 3", position: 3 }
];

// Then create them with proper positioning
```

### Tip 2: Use Resources for Queries
Resources are optimized for reading data:

```javascript
// ✅ Good: Use resource for reading
planka://boards/{boardId}?...

// ❌ Less optimal: Call multiple tools
boards.get + lists.list + cards.listByBoard
```

### Tip 3: Check Authentication First
Before bulk operations:

```json
Tool: auth.status
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token"
}
```

### Tip 4: Use Positions Strategically
Control ordering explicitly:

```json
// Top of list
{ "position": 0 }

// Bottom of list
{ "position": 999999 }

// Between items
{ "position": 1.5 }
```

### Tip 5: Leverage Prompts for Complex Tasks
Instead of manually orchestrating multiple tool calls:

```json
// ✅ Use prompt
Prompt: project-overview
{ "projectId": "..." }

// Instead of:
// projects.get + boards.list + cards.listByBoard + members.list + ...
```

---

## 🎓 Learning Path

### Beginner
1. ✅ Read `planka://docs/examples` resource
2. ✅ Test `auth.status` tool
3. ✅ List projects with `projects.list`
4. ✅ Read project data with `planka://projects/{id}` resource
5. ✅ Create a test card with `cards.create`

### Intermediate
1. ✅ Create a complete board with lists
2. ✅ Manage labels and assignments
3. ✅ Use task checklists
4. ✅ Add comments and attachments
5. ✅ Move cards through workflow

### Advanced
1. ✅ Use prompts for complex workflows
2. ✅ Build automated workflows
3. ✅ Integrate with external systems
4. ✅ Create custom reports from resources
5. ✅ Handle errors gracefully

---

## 📞 Quick Reference

| Need | Use | Example |
|------|-----|---------|
| See all capabilities | `planka://docs/examples` | Read resource |
| Check connection | `auth.status` | Tool |
| Read data | Resources | `planka://projects?...` |
| Modify data | Tools | `cards.create`, `cards.update` |
| Complex workflows | Prompts | `daily-standup`, `project-overview` |

---

## 🐛 Troubleshooting

### Issue: "Not authenticated"
**Solution:** Ensure you're passing both `plankaBaseUrl` and `plankaToken` in every tool call.

### Issue: "Resource not found"
**Solution:** Verify the ID exists and you have permission to access it.

### Issue: Can't see the documentation
**Solution:** Read the resource `planka://docs/examples` - it requires no authentication!

### Issue: Tools not working in Telegram bot
**Solution:** The bot should handle authentication automatically. Contact admin if you haven't linked your Planka account with `/link_planka`.

---

## 🚀 Next Steps

1. **Read the built-in docs**: `planka://docs/examples`
2. **Test with MCP Inspector**: See all tools, resources, and prompts visually
3. **Try the examples**: Start with simple operations and build up
4. **Explore prompts**: Let AI assistants help with complex workflows
5. **Build automation**: Integrate with your existing tools

Happy Planka-ing! 🎉
