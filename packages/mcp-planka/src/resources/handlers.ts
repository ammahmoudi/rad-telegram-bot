import type { ReadResourceRequest } from '@modelcontextprotocol/sdk/types.js';
import { listProjects, getProject, getBoard } from '../api/index.js';

export async function handleReadResource(request: ReadResourceRequest) {
  const uri = request.params.uri;

  // Handle documentation resource (no auth required)
  if (uri === 'planka://docs/examples') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: generateDocumentation(),
        },
      ],
    };
  }

  // Parse URI and extract path and query parameters
  const match = uri.match(/^planka:\/\/([^?]+)(?:\?(.+))?$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const [, path, queryString] = match;
  const params = new URLSearchParams(queryString || '');
  const plankaBaseUrl = params.get('plankaBaseUrl');
  const plankaToken = params.get('plankaToken');

  if (!plankaBaseUrl || !plankaToken) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Authentication required',
            usage: 'Add ?plankaBaseUrl=URL&plankaToken=TOKEN to the URI',
            example: 'planka://projects?plankaBaseUrl=https://planka.example.com&plankaToken=YOUR_TOKEN',
          }),
        },
      ],
    };
  }

  const auth = {
    plankaBaseUrl,
    accessToken: plankaToken,
  };

  try {
    // Route based on path
    if (path === 'projects') {
      const projects = await listProjects(auth);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    }

    const projectMatch = path.match(/^projects\/([^/]+)$/);
    if (projectMatch) {
      const projectId = projectMatch[1];
      const project = await getProject(auth, projectId);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(project, null, 2),
          },
        ],
      };
    }

    const boardMatch = path.match(/^boards\/([^/]+)$/);
    if (boardMatch) {
      const boardId = boardMatch[1];
      const board = await getBoard(auth, boardId);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(board, null, 2),
          },
        ],
      };
    }

    const assignedCardsMatch = path.match(/^users\/([^/]+)\/assigned-cards$/);
    if (assignedCardsMatch) {
      // Search for cards assigned to this user
      const projects = await listProjects(auth);
      const allCards: any[] = [];

      for (const project of projects) {
        try {
          const boards = (project as any)?.included?.boards ?? [];
          for (const board of boards) {
            try {
              const boardData = await getBoard(auth, board.id);
              const cards = (boardData as any)?.included?.cards ?? [];
              const users = (boardData as any)?.included?.users ?? [];

              // Find the target user by userId from path
              const targetUserId = assignedCardsMatch[1];
              const targetUser = users.find((u: any) => u.id === targetUserId || u.username === targetUserId);
              if (!targetUser) continue;

              // Find cards assigned to this user
              const assignedCards = cards.filter((c: any) => c.memberIds?.includes(targetUser.id));
              
              assignedCards.forEach((card: any) => {
                const lists = (boardData as any)?.included?.lists ?? [];
                const cardList = lists.find((l: any) => l.id === card.listId);
                
                allCards.push({
                  ...card,
                  projectName: project.name,
                  projectId: project.id,
                  boardName: board.name,
                  boardId: board.id,
                  listName: cardList?.name || 'Unknown',
                });
              });
            } catch (err) {
              continue;
            }
          }
        } catch (err) {
          continue;
        }
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ totalCards: allCards.length, cards: allCards }, null, 2),
          },
        ],
      };
    }

    const projectCardsMatch = path.match(/^projects\/([^/]+)\/cards$/);
    if (projectCardsMatch) {
      const projectId = projectCardsMatch[1];
      const project = await getProject(auth, projectId);
      const boards = (project as any)?.included?.boards ?? [];
      const allCards: any[] = [];

      for (const board of boards) {
        try {
          const boardData = await getBoard(auth, board.id);
          const cards = (boardData as any)?.included?.cards ?? [];
          const lists = (boardData as any)?.included?.lists ?? [];
          
          cards.forEach((card: any) => {
            const cardList = lists.find((l: any) => l.id === card.listId);
            allCards.push({
              ...card,
              boardName: board.name,
              boardId: board.id,
              listName: cardList?.name || 'Unknown',
            });
          });
        } catch (err) {
          continue;
        }
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ totalCards: allCards.length, cards: allCards }, null, 2),
          },
        ],
      };
    }

    // Unknown resource path
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Unknown resource path',
            path,
            availableResources: [
              'planka://projects?plankaBaseUrl=URL&plankaToken=TOKEN',
              'planka://projects/{projectId}?plankaBaseUrl=URL&plankaToken=TOKEN',
              'planka://boards/{boardId}?plankaBaseUrl=URL&plankaToken=TOKEN',
              'planka://users/{userId}/assigned-cards?plankaBaseUrl=URL&plankaToken=TOKEN',
              'planka://projects/{projectId}/cards?plankaBaseUrl=URL&plankaToken=TOKEN',
            ],
          }),
        },
      ],
    };
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: error?.message ?? String(error) }, null, 2),
        },
      ],
    };
  }
}

function generateDocumentation(): string {
  return `# MCP Planka Server - Complete Usage Guide

## 🔐 Authentication

All tools and resources require Planka credentials:
- **plankaBaseUrl**: Your Planka server URL (e.g., \`https://planka.example.com\`)
- **plankaToken**: Your Planka access token

### Getting Your Access Token

Use the \`auth.status\` tool to verify your connection:

\`\`\`json
{
  "plankaBaseUrl": "https://planka.example.com",
  "plankaToken": "your-token-here"
}
\`\`\`

---

## 📚 Resources (Read-Only Data Access)

Resources provide optimized read-only access via URI patterns.

### Available Resources

| Resource | URI Pattern | Description |
|----------|-------------|-------------|
| **All Projects** | \`planka://projects?plankaBaseUrl={url}&plankaToken={token}\` | List all accessible projects |
| **Project Details** | \`planka://projects/{projectId}?plankaBaseUrl={url}&plankaToken={token}\` | Get project with boards |
| **Board Details** | \`planka://boards/{boardId}?plankaBaseUrl={url}&plankaToken={token}\` | Get board with lists and cards |
| **User Cards** | \`planka://users/{userId}/assigned-cards?plankaBaseUrl={url}&plankaToken={token}\` | All cards assigned to user |
| **Project Cards** | \`planka://projects/{projectId}/cards?plankaBaseUrl={url}&plankaToken={token}\` | All cards in project |

---

## 🛠️ Tools (40+ Available)

### Authentication Tools

- **auth.status** - Check Planka connection status

### Project Tools (5 tools)

- **projects.list** - List all projects
- **projects.create** - Create new project
- **projects.update** - Update project details
- **projects.delete** - Delete project
- **projects.getManagers** - Get project managers

### Board Tools (4 tools)

- **boards.list** - List boards in project
- **boards.create** - Create new board
- **boards.update** - Update board
- **boards.delete** - Delete board

### List Tools (4 tools)

- **lists.create** - Create list in board
- **lists.update** - Update list
- **lists.sort** - Reorder lists
- **lists.delete** - Delete list

### Card Tools (7 tools)

- **cards.create** - Create new card
- **cards.get** - Get card details
- **cards.update** - Update card
- **cards.move** - Move card to different list
- **cards.duplicate** - Duplicate card
- **cards.delete** - Delete card
- **cards.listByBoard** - List all cards in board

### Task Tools (4 tools)

- **tasks.create** - Create task (checklist item)
- **tasks.update** - Update task
- **tasks.toggle** - Toggle task completion
- **tasks.delete** - Delete task

### Label Tools (4 tools)

- **labels.create** - Create label
- **labels.update** - Update label
- **labels.addToCard** - Add label to card
- **labels.removeFromCard** - Remove label from card

### Member Tools (4 tools)

- **members.add** - Add member to board
- **members.remove** - Remove member from board
- **members.addToCard** - Assign member to card
- **members.removeFromCard** - Unassign member from card

### Comment Tools (3 tools)

- **comments.create** - Add comment to card
- **comments.update** - Update comment
- **comments.delete** - Delete comment

### User Tools (2 tools)

- **users.getCurrent** - Get current user info
- **users.listAll** - List all users in Planka

### Attachment Tools (3 tools)

- **attachments.upload** - Upload file to card
- **attachments.update** - Update attachment
- **attachments.delete** - Delete attachment

---

## 📋 Example Usage

### Creating a Sprint Board

\`\`\`json
// 1. Create project
{
  "tool": "projects.create",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "name": "Sprint 2025-Q1"
  }
}

// 2. Create board
{
  "tool": "boards.create",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "projectId": "proj-123",
    "name": "Sprint Board",
    "position": 1
  }
}

// 3. Create lists
{
  "tool": "lists.create",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "boardId": "board-123",
    "name": "To Do",
    "position": 1
  }
}
\`\`\`

### Managing Cards

\`\`\`json
// Create card
{
  "tool": "cards.create",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "boardId": "board-123",
    "listId": "list-123",
    "name": "Implement feature X",
    "description": "Add new feature with tests",
    "position": 1
  }
}

// Assign member
{
  "tool": "members.addToCard",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "cardId": "card-123",
    "userId": "user-123"
  }
}

// Add tasks
{
  "tool": "tasks.create",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "cardId": "card-123",
    "name": "Write unit tests",
    "position": 1
  }
}

// Move to in-progress
{
  "tool": "cards.move",
  "args": {
    "plankaBaseUrl": "https://planka.example.com",
    "plankaToken": "your-token",
    "cardId": "card-123",
    "listId": "list-in-progress",
    "position": 0
  }
}
\`\`\`

---

## 🔄 Prompts (Workflow Templates)

### Available Prompts

1. **daily-standup** - Generate standup report (completed/in-progress/blockers)
2. **create-sprint-card** - Template for well-structured sprint cards
3. **weekly-report** - Generate weekly status report
4. **project-overview** - Comprehensive project status overview
5. **board-health-check** - Analyze board health (overdue, unassigned, blocked)

### Prompt Usage

\`\`\`json
{
  "prompt": "daily-standup",
  "args": {
    "telegramUserId": "12345",
    "userName": "John Doe"
  }
}
\`\`\`

---

## 🚀 Common Workflows

### Complete Card Lifecycle

1. **Create** → Use \`cards.create\`
2. **Add Details** → Use \`cards.update\` with description & due date
3. **Assign** → Use \`members.addToCard\`
4. **Add Labels** → Use \`labels.addToCard\`
5. **Create Tasks** → Use \`tasks.create\` for checklist items
6. **Track Progress** → Use \`tasks.update\` to mark complete
7. **Add Comments** → Use \`comments.create\` for updates
8. **Move to Done** → Use \`cards.move\`

### Project Setup

1. Create project with \`projects.create\`
2. Create board with \`boards.create\`
3. Create lists (Backlog, To Do, In Progress, Review, Done)
4. Create labels (Bug, Feature, Priority, etc.)
5. Add team members with \`members.add\`

---

## ⚠️ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Not authenticated" | Missing credentials | Provide plankaBaseUrl and plankaToken |
| "Invalid token" | Token expired/invalid | Get new token from Planka |
| "Resource not found" | Invalid ID | Verify ID exists and you have access |
| "Missing required parameter" | Incomplete args | Check tool documentation |

---

## 💡 Tips & Best Practices

1. ✅ **Use Resources for Reading** - Optimized for data retrieval
2. ✅ **Use Tools for Mutations** - Create/update/delete operations
3. ✅ **Leverage Prompts** - Complex multi-step workflows
4. ✅ **Check Connection First** - Use \`auth.status\` before bulk ops
5. ✅ **Specify Positions** - Control ordering of lists/cards
6. ✅ **Add Delays** - For bulk operations to avoid rate limits
7. ✅ **Check Responses** - Always verify tool results for errors

---

## 📦 Integration Examples

### Claude Desktop

\`\`\`json
{
  "mcpServers": {
    "planka": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/mcp-planka/src/index.ts"]
    }
  }
}
\`\`\`

### Telegram Bot

The bot automatically handles authentication - just call tools with their parameters (no credentials needed from user side).

---

## 📖 Quick Reference

**Total Tools**: 40+
**Total Resources**: 5
**Total Prompts**: 5

For detailed parameter documentation, check each tool's schema. All tools require \`plankaBaseUrl\` and \`plankaToken\` parameters.
`;
}
