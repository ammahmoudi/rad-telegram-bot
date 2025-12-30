# Planka MCP Server

A comprehensive Model Context Protocol (MCP) server for [Planka](https://planka.app/) kanban boards, providing **Tools**, **Prompts**, and **Resources** for complete project management automation.

## 🚀 Features

- **40+ Tools** - Complete CRUD operations for all Planka entities
- **5 Prompts** - Pre-built templates for common workflows
- **5 Resources** - URI-based access to Planka data
- **Project Management** - List and view projects
- **Board Management** - Create, update, delete, and list boards
- **List Management** - Create, update, archive, delete lists (columns)
- **Card Management** - Full card lifecycle with search, create, update, move, delete
- **Label Management** - Create, update, delete labels and assign to cards
- **Member Management** - Assign and remove members from cards
- **Comments** - Add, update, delete comments on cards
- **Task Lists & Tasks** - Manage checklists within cards
- **Attachments** - List and delete attachments
- **User Authentication** - Link Telegram users to Planka accounts

## 🎯 MCP Capabilities

### Tools (40+)
Direct function calls to interact with Planka

### Prompts (5)
Pre-built workflow templates:
- `daily-standup` - Generate standup reports
- `create-sprint-card` - Structured card creation template
- `weekly-report` - User or project status reports
- `project-overview` - Comprehensive project analysis
- `board-health-check` - Identify issues and risks

### Resources (5)
URI-based data access:
- `planka://projects` - All projects
- `planka://projects/{projectId}` - Project details
- `planka://boards/{boardId}` - Board with cards
- `planka://users/{telegramUserId}/assigned-cards` - User's tasks
- `planka://projects/{projectId}/cards` - All project cards

## 📋 Available Tools

### Authentication
- `planka.auth.status` - Check Planka link status for a user

### Projects
- `planka.projects.list` - List all projects

### Boards
- `planka.boards.list` - List boards in a project
- `planka.boards.create` - Create a new board
- `planka.boards.update` - Update board details
- `planka.boards.delete` - Delete a board

### Lists (Columns)
- `planka.lists.list` - List all lists in a board
- `planka.lists.create` - Create a new list
- `planka.lists.update` - Update list properties
- `planka.lists.archive` - Archive a list
- `planka.lists.delete` - Delete a list

### Cards
- `planka.cards.search` - Search cards by name/description
- `planka.cards.create` - Create a new card
- `planka.cards.update` - Update card details
- `planka.cards.move` - Move card to another list
- `planka.cards.delete` - Delete a card

### Labels
- `planka.labels.list` - List labels in a board
- `planka.labels.create` - Create a new label
- `planka.labels.update` - Update label properties
- `planka.labels.delete` - Delete a label
- `planka.labels.assignToCard` - Assign label to card
- `planka.labels.removeFromCard` - Remove label from card

### Members
- `planka.members.list` - List members in a project
- `planka.members.assignToCard` - Assign member to card
- `planka.members.removeFromCard` - Remove member from card

### Comments
- `planka.comments.list` - List comments on a card
- `planka.comments.create` - Add a comment
- `planka.comments.update` - Update a comment
- `planka.comments.delete` - Delete a comment

### Task Lists
- `planka.taskLists.create` - Create a task list (checklist)
- `planka.taskLists.update` - Update task list
- `planka.taskLists.delete` - Delete task list

### Tasks
- `planka.tasks.create` - Create a task in a task list
- `planka.tasks.update` - Update task (name, completion status)
- `planka.tasks.delete` - Delete a task

### Attachments
- `planka.attachments.list` - List attachments on a card
- `planka.attachments.delete` - Delete an attachment

## 🔧 API Methods

All API methods are available in `planka.ts`:

### Board Operations
```typescript
createBoard(auth, projectId, name, position?)
updateBoard(auth, boardId, updates)
deleteBoard(auth, boardId)
```

### List Operations
```typescript
createList(auth, boardId, name, position?, color?)
updateList(auth, listId, updates)
archiveList(auth, listId)
deleteList(auth, listId)
```

### Card Operations
```typescript
createCard(auth, listId, name, description?, position?, dueDate?)
updateCard(auth, cardId, updates)
deleteCard(auth, cardId)
```

### Label Operations
```typescript
getLabels(auth, boardId)
createLabel(auth, boardId, name, color, position?)
updateLabel(auth, labelId, updates)
deleteLabel(auth, labelId)
assignLabelToCard(auth, cardId, labelId)
removeLabelFromCard(auth, cardId, labelId)
```

### Member Operations
```typescript
getMembers(auth, projectId)
assignMemberToCard(auth, cardId, userId)
removeMemberFromCard(auth, cardId, userId)
```

### Comment Operations
```typescript
getComments(auth, cardId)
createComment(auth, cardId, text)
updateComment(auth, commentId, text)
deleteComment(auth, commentId)
```

### Task Operations
```typescript
createTaskList(auth, cardId, name, position?)
updateTaskList(auth, taskListId, updates)
deleteTaskList(auth, taskListId)
createTask(auth, taskListId, name, position?)
updateTask(auth, taskId, updates)
deleteTask(auth, taskId)
```

### Attachment Operations
```typescript
getAttachments(auth, cardId)
deleteAttachment(auth, attachmentId)
```

## 📚 Type Definitions

All types are defined in `planka.d.ts`:

```typescript
interface PlankaProject { id, name, description?, createdAt, updatedAt? }
interface PlankaBoard { id, name, position, projectId, createdAt, updatedAt? }
interface PlankaList { id, name, position, boardId, type?, color?, createdAt, updatedAt? }
interface PlankaCard { id, name, description?, position, listId, boardId, dueDate?, createdAt, updatedAt? }
interface PlankaLabel { id, name, color, position, boardId, createdAt, updatedAt? }
interface PlankaUser { id, name, email, username?, role?, createdAt, updatedAt? }
interface PlankaComment { id, type, data: { text }, cardId, userId, createdAt, updatedAt? }
interface PlankaTaskList { id, name, position, cardId, showOnFrontOfCard, createdAt, updatedAt? }
interface PlankaTask { id, name, position, taskListId, isCompleted, createdAt, updatedAt? }
interface PlankaAttachment { id, name, cardId, creatorUserId, createdAt, updatedAt? }
```

## 🎯 Usage Examples

### Creating a Complete Workflow

```typescript
// 1. List projects
const projects = await listProjects(auth);

// 2. Create a board
const board = await createBoard(auth, projectId, "Sprint 1");

// 3. Create lists
const todoList = await createList(auth, board.id, "To Do", 1);
const inProgressList = await createList(auth, board.id, "In Progress", 2);
const doneList = await createList(auth, board.id, "Done", 3, "green-grass");

// 4. Create a card
const card = await createCard(auth, todoList.id, "Implement feature", "Full description here");

// 5. Add labels
const bugLabel = await createLabel(auth, board.id, "Bug", "berry-red");
await assignLabelToCard(auth, card.id, bugLabel.id);

// 6. Assign members
const members = await getMembers(auth, projectId);
await assignMemberToCard(auth, card.id, members[0].id);

// 7. Add a comment
await createComment(auth, card.id, "Starting work on this");

// 8. Create a task list
const taskList = await createTaskList(auth, card.id, "Implementation Steps");

// 9. Add tasks
await createTask(auth, taskList.id, "Step 1: Setup");
await createTask(auth, taskList.id, "Step 2: Code");
await createTask(auth, taskList.id, "Step 3: Test");

// 10. Move card when done
await moveCard(auth, card.id, doneList.id);
```

## � Debugging with MCP Inspector

The MCP Inspector provides a web UI for testing and debugging MCP tools:

### Setup
```bash
# Set required environment variable
$env:ENCRYPTION_KEY = 'your_key_from_.env'

# Start Inspector
npx @modelcontextprotocol/inspector npx tsx packages/mcp-planka/src/index.ts
```

### Access
Open the URL shown in terminal (includes auth token):
```
http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=...
```

### Testing Tools
1. **Connect** - Auto-connects to your MCP server
2. **Browse Tools** - View all 39 available Planka tools
3. **Test Calls** - Execute tools with test data
4. **View Responses** - See raw JSON responses

Example test for global search:
```json
{
  "telegramUserId": "263324534",
  "query": "card name or user name"
}
```

The Inspector shows exact MCP communication, perfect for debugging tool responses and testing queries before deploying.

## �🔗 Integration

This MCP server integrates with:
- **Telegram Bot** - Link Planka accounts to Telegram users
- **AI Assistants** - Use via Model Context Protocol
- **Automation Tools** - Programmatic board management

## 🛡️ Security

- Uses encrypted access tokens
- Never stores passwords
- Secure token storage in database
- Per-user authentication

## 📝 Development

Built with:
- TypeScript
- Node.js
- MCP SDK
- Planka REST API

## 🚧 Future Enhancements

Potential additions:
- Board templates
- Custom fields support
- Bulk operations
- Webhooks
- Advanced search filters
- Export/import functionality

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! This MCP server provides comprehensive Planka integration based on the official API.

## 🔗 References

- [Planka Official Docs](https://docs.planka.cloud/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [HexiDev/planka-mcp-kanban](https://github.com/HexiDev/planka-mcp-kanban)
- [AcceleratedIndustries/planka-mcp](https://github.com/AcceleratedIndustries/planka-mcp)
