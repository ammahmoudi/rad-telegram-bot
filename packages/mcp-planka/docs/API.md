# 🔧 Planka Raw API Functions Reference

Complete reference for raw Planka REST API functions. These provide direct, type-safe access to Planka API endpoints.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Entities](#core-entities)
  - [Projects](#projects)
  - [Boards](#boards)
  - [Lists](#lists)
  - [Cards](#cards)
  - [Labels](#labels)
  - [Tasks & Task Lists](#tasks--task-lists)
- [Users & Members](#users--members)
- [Comments & Attachments](#comments--attachments)
- [Activity & Notifications](#activity--notifications)
- [Advanced Features](#advanced-features)
- [API Client](#api-client)

---

## Overview

Raw API functions are located in `src/api/` and provide:
- **Direct REST API access** - Minimal abstraction over HTTP endpoints
- **Type safety** - Full TypeScript interfaces
- **Automatic authentication** - Uses `PlankaAuth` object
- **Error handling** - Throws descriptive errors

### Import

```typescript
// Import specific functions
import { 
  listProjects, 
  getProject,
  createCard,
  updateCard 
} from '@rastar/mcp-planka/api';

// Or import all
import * as api from '@rastar/mcp-planka/api';
```

### Authentication

All functions require `PlankaAuth`:
```typescript
const auth = {
  plankaUrl: 'https://planka.yourdomain.com',
  accessToken: 'your-access-token'
};
```

---

## Core Entities

### Projects

**Import:** `import { listProjects, getProject, createProject, ... } from '@rastar/mcp-planka/api'`

#### `listProjects()`
```typescript
async function listProjects(auth: PlankaAuth): Promise<PlankaProject[]>
```
Get all projects accessible to the user.

**Example:**
```typescript
const projects = await listProjects(auth);
projects.forEach(p => console.log(p.name));
```

---

#### `getProject()`
```typescript
async function getProject(
  auth: PlankaAuth, 
  projectId: string
): Promise<PlankaProject>
```
Get project details with included boards and users.

**Returns:**
```typescript
{
  item: { id, name, description, ... },
  included: {
    boards: [...],
    users: [...],
    boardMemberships: [...]
  }
}
```

---

#### `createProject()`
```typescript
async function createProject(
  auth: PlankaAuth,
  name: string,
  description?: string,
  type?: 'private' | 'shared'
): Promise<PlankaProject>
```

**Example:**
```typescript
const project = await createProject(auth, 'Q1 2025 Sprint', 'Quarterly goals', 'shared');
```

---

#### `updateProject()`
```typescript
async function updateProject(
  auth: PlankaAuth,
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    backgroundImageId?: string;
  }
): Promise<PlankaProject>
```

---

#### `deleteProject()`
```typescript
async function deleteProject(
  auth: PlankaAuth, 
  projectId: string
): Promise<PlankaProject>
```

---

#### `duplicateProject()`
```typescript
async function duplicateProject(
  auth: PlankaAuth,
  projectId: string,
  name?: string
): Promise<PlankaProject>
```

---

### Boards

**Import:** `import { listBoards, getBoard, createBoard, ... } from '@rastar/mcp-planka/api'`

#### `listBoards()`
```typescript
async function listBoards(
  auth: PlankaAuth, 
  projectId: string
): Promise<PlankaBoard[]>
```

---

#### `getBoard()`
```typescript
async function getBoard(
  auth: PlankaAuth, 
  boardId: string
): Promise<PlankaBoard>
```
Get board with included lists, cards, labels, members, tasks, etc.

**Returns:**
```typescript
{
  item: { id, name, projectId, ... },
  included: {
    lists: [...],
    cards: [...],
    labels: [...],
    cardMemberships: [...],
    tasks: [...],
    taskLists: [...],
    attachments: [...]
  }
}
```

---

#### `createBoard()`
```typescript
async function createBoard(
  auth: PlankaAuth,
  projectId: string,
  name: string,
  position?: number
): Promise<PlankaBoard>
```

---

#### `updateBoard()`
```typescript
async function updateBoard(
  auth: PlankaAuth,
  boardId: string,
  updates: {
    name?: string;
    position?: number;
  }
): Promise<PlankaBoard>
```

---

#### `deleteBoard()`
```typescript
async function deleteBoard(
  auth: PlankaAuth, 
  boardId: string
): Promise<PlankaBoard>
```

---

#### `duplicateBoard()`
```typescript
async function duplicateBoard(
  auth: PlankaAuth,
  boardId: string,
  projectId?: string,
  name?: string
): Promise<PlankaBoard>
```

---

### Lists

**Import:** `import { createList, updateList, ... } from '@rastar/mcp-planka/api'`

#### `createList()`
```typescript
async function createList(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  position?: number
): Promise<PlankaList>
```

---

#### `updateList()`
```typescript
async function updateList(
  auth: PlankaAuth,
  listId: string,
  updates: {
    name?: string;
    position?: number;
  }
): Promise<PlankaList>
```

---

#### `sortList()`
```typescript
async function sortList(
  auth: PlankaAuth,
  listId: string,
  type: 'createdAt' | 'name'
): Promise<PlankaList>
```
Sort cards in a list by creation date or name.

---

#### `deleteList()`
```typescript
async function deleteList(
  auth: PlankaAuth, 
  listId: string
): Promise<PlankaList>
```

---

### Cards

**Import:** `import { createCard, updateCard, moveCard, ... } from '@rastar/mcp-planka/api'`

#### `createCard()`
```typescript
async function createCard(
  auth: PlankaAuth,
  listId: string,
  name: string,
  description?: string,
  position?: number,
  dueDate?: string  // ISO string
): Promise<PlankaCard>
```

**Example:**
```typescript
const card = await createCard(
  auth,
  'list-123',
  'Fix login bug',
  'Users cannot login with special characters',
  0,  // Top of list
  '2025-12-31'
);
```

---

#### `getCard()`
```typescript
async function getCard(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaCard>
```

---

#### `updateCard()`
```typescript
async function updateCard(
  auth: PlankaAuth,
  cardId: string,
  updates: {
    name?: string;
    description?: string;
    dueDate?: string;  // ISO string or null
    position?: number;
  }
): Promise<PlankaCard>
```

---

#### `moveCard()`
```typescript
async function moveCard(
  auth: PlankaAuth,
  cardId: string,
  listId: string,
  position?: number
): Promise<PlankaCard>
```

**Example:**
```typescript
// Move card to "Done" list at top position
await moveCard(auth, 'card-123', 'list-done', 0);
```

---

#### `deleteCard()`
```typescript
async function deleteCard(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaCard>
```

---

#### `duplicateCard()`
```typescript
async function duplicateCard(
  auth: PlankaAuth,
  cardId: string,
  position?: number
): Promise<PlankaCard>
```

---

#### `getCardChildren()`
```typescript
async function getCardChildren(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaCard[]>
```
Get child cards (sub-cards/dependencies).

---

### Labels

**Import:** `import { createLabel, assignLabelToCard, ... } from '@rastar/mcp-planka/api'`

#### `createLabel()`
```typescript
async function createLabel(
  auth: PlankaAuth,
  boardId: string,
  name: string,
  color: string  // e.g., '#FF5733'
): Promise<PlankaLabel>
```

---

#### `updateLabel()`
```typescript
async function updateLabel(
  auth: PlankaAuth,
  labelId: string,
  updates: {
    name?: string;
    color?: string;
  }
): Promise<PlankaLabel>
```

---

#### `deleteLabel()`
```typescript
async function deleteLabel(
  auth: PlankaAuth, 
  labelId: string
): Promise<PlankaLabel>
```

---

#### `assignLabelToCard()`
```typescript
async function assignLabelToCard(
  auth: PlankaAuth,
  cardId: string,
  labelId: string
): Promise<any>
```

---

#### `removeLabelFromCard()`
```typescript
async function removeLabelFromCard(
  auth: PlankaAuth,
  cardId: string,
  labelId: string
): Promise<void>
```

---

### Tasks & Task Lists

**Import:** `import { createTaskList, createTask, updateTask, ... } from '@rastar/mcp-planka/api'`

#### `createTaskList()`
```typescript
async function createTaskList(
  auth: PlankaAuth,
  cardId: string,
  name: string,
  position?: number
): Promise<PlankaTaskList>
```

**Example:**
```typescript
const taskList = await createTaskList(auth, 'card-123', 'Checklist', 0);
```

---

#### `updateTaskList()`
```typescript
async function updateTaskList(
  auth: PlankaAuth,
  taskListId: string,
  updates: {
    name?: string;
    position?: number;
  }
): Promise<PlankaTaskList>
```

---

#### `deleteTaskList()`
```typescript
async function deleteTaskList(
  auth: PlankaAuth, 
  taskListId: string
): Promise<PlankaTaskList>
```

---

#### `createTask()`
```typescript
async function createTask(
  auth: PlankaAuth,
  taskListId: string,
  name: string,
  isCompleted?: boolean,
  position?: number
): Promise<PlankaTask>
```

**Example:**
```typescript
const task = await createTask(auth, 'tasklist-456', 'Review code', false, 0);
```

---

#### `updateTask()`
```typescript
async function updateTask(
  auth: PlankaAuth,
  taskId: string,
  updates: {
    name?: string;
    isCompleted?: boolean;
    position?: number;
  }
): Promise<PlankaTask>
```

**Example:**
```typescript
// Mark task as completed
await updateTask(auth, 'task-789', { isCompleted: true });
```

---

#### `deleteTask()`
```typescript
async function deleteTask(
  auth: PlankaAuth, 
  taskId: string
): Promise<PlankaTask>
```

---

## Users & Members

### Users

**Import:** `import { getCurrentUser, getUser, listUsers, ... } from '@rastar/mcp-planka/api'`

#### `getCurrentUser()`
```typescript
async function getCurrentUser(auth: PlankaAuth): Promise<PlankaUser>
```
Get the currently authenticated user.

---

#### `getUser()`
```typescript
async function getUser(
  auth: PlankaAuth, 
  userId: string
): Promise<PlankaUser>
```

---

#### `listUsers()`
```typescript
async function listUsers(auth: PlankaAuth): Promise<PlankaUser[]>
```

---

#### `createUser()`
```typescript
async function createUser(
  auth: PlankaAuth,
  email: string,
  password: string,
  name: string,
  username?: string
): Promise<PlankaUser>
```

---

#### `updateUser()`
```typescript
async function updateUser(
  auth: PlankaAuth,
  userId: string,
  updates: {
    email?: string;
    name?: string;
    username?: string;
    password?: string;
  }
): Promise<PlankaUser>
```

---

#### `deleteUser()`
```typescript
async function deleteUser(
  auth: PlankaAuth, 
  userId: string
): Promise<PlankaUser>
```

---

### Card Members

**Import:** `import { assignMemberToCard, removeMemberFromCard } from '@rastar/mcp-planka/api'`

#### `assignMemberToCard()`
```typescript
async function assignMemberToCard(
  auth: PlankaAuth,
  cardId: string,
  userId: string
): Promise<any>
```

---

#### `removeMemberFromCard()`
```typescript
async function removeMemberFromCard(
  auth: PlankaAuth,
  cardId: string,
  userId: string
): Promise<void>
```

---

## Comments & Attachments

### Comments

**Import:** `import { createComment, updateComment, deleteComment, ... } from '@rastar/mcp-planka/api'`

#### `getComments()`
```typescript
async function getComments(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaComment[]>
```

---

#### `createComment()`
```typescript
async function createComment(
  auth: PlankaAuth,
  cardId: string,
  text: string
): Promise<PlankaComment>
```

**Example:**
```typescript
await createComment(auth, 'card-123', 'This looks good to me! ✅');
```

---

#### `updateComment()`
```typescript
async function updateComment(
  auth: PlankaAuth,
  commentId: string,
  text: string
): Promise<PlankaComment>
```

---

#### `deleteComment()`
```typescript
async function deleteComment(
  auth: PlankaAuth, 
  commentId: string
): Promise<PlankaComment>
```

---

### Attachments

**Import:** `import { listAttachments, uploadAttachment, deleteAttachment, ... } from '@rastar/mcp-planka/api'`

#### `listAttachments()`
```typescript
async function listAttachments(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaAttachment[]>
```

---

#### `uploadAttachment()`
```typescript
async function uploadAttachment(
  auth: PlankaAuth,
  cardId: string,
  file: File | Blob,
  filename: string
): Promise<PlankaAttachment>
```

**Example (Node.js):**
```typescript
import fs from 'fs';

const fileBuffer = fs.readFileSync('report.pdf');
const file = new Blob([fileBuffer]);

await uploadAttachment(auth, 'card-123', file, 'report.pdf');
```

---

#### `deleteAttachment()`
```typescript
async function deleteAttachment(
  auth: PlankaAuth, 
  attachmentId: string
): Promise<PlankaAttachment>
```

---

## Activity & Notifications

### Actions (Activity)

**Import:** `import { getCardActions, getUserActions } from '@rastar/mcp-planka/api'`

#### `getCardActions()`
```typescript
async function getCardActions(
  auth: PlankaAuth, 
  cardId: string
): Promise<PlankaAction[]>
```
Get complete action history for a card.

**Example:**
```typescript
const actions = await getCardActions(auth, 'card-123');
actions.forEach(a => {
  console.log(`${a.type} at ${a.createdAt} by ${a.userId}`);
});
```

---

### Notifications

**Import:** `import { listNotifications, markNotificationAsRead, ... } from '@rastar/mcp-planka/api'`

#### `listNotifications()`
```typescript
async function listNotifications(
  auth: PlankaAuth
): Promise<PlankaNotification[]>
```

---

#### `markNotificationAsRead()`
```typescript
async function markNotificationAsRead(
  auth: PlankaAuth,
  notificationId: string
): Promise<PlankaNotification>
```

---

#### `deleteNotification()`
```typescript
async function deleteNotification(
  auth: PlankaAuth,
  notificationId: string
): Promise<PlankaNotification>
```

---

## Advanced Features

### Board Memberships

**Import:** `import { addBoardMember, removeBoardMember, ... } from '@rastar/mcp-planka/api'`

#### `addBoardMember()`
```typescript
async function addBoardMember(
  auth: PlankaAuth,
  boardId: string,
  userId: string,
  role?: 'editor' | 'viewer'
): Promise<any>
```

---

#### `removeBoardMember()`
```typescript
async function removeBoardMember(
  auth: PlankaAuth,
  boardId: string,
  userId: string
): Promise<void>
```

---

### Permissions & Config

**Import:** `import { getConfig, getPermissions } from '@rastar/mcp-planka/api'`

#### `getConfig()`
```typescript
async function getConfig(auth: PlankaAuth): Promise<any>
```
Get Planka server configuration.

---

#### `getPermissions()`
```typescript
async function getPermissions(
  auth: PlankaAuth
): Promise<any>
```
Get user permissions.

---

### Background Images

**Import:** `import { uploadBackgroundImage, deleteBackgroundImage } from '@rastar/mcp-planka/api'`

#### `uploadBackgroundImage()`
```typescript
async function uploadBackgroundImage(
  auth: PlankaAuth,
  projectId: string,
  file: File | Blob,
  filename: string
): Promise<any>
```

---

#### `deleteBackgroundImage()`
```typescript
async function deleteBackgroundImage(
  auth: PlankaAuth,
  backgroundImageId: string
): Promise<void>
```

---

## API Client

### `plankaFetch()`

The core HTTP client used by all API functions.

```typescript
async function plankaFetch<T = any>(
  auth: PlankaAuth,
  endpoint: string,
  options?: RequestInit
): Promise<T>
```

**Usage:**
```typescript
import { plankaFetch } from '@rastar/mcp-planka/api';

// Custom API call
const data = await plankaFetch(auth, '/api/custom-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ foo: 'bar' })
});
```

**Features:**
- Automatic authentication header injection
- JSON parsing
- Error handling with descriptive messages
- TypeScript generics for return type

---

## Error Handling

All API functions throw errors with descriptive messages:

```typescript
try {
  const card = await getCard(auth, 'invalid-id');
} catch (error) {
  console.error(error.message);
  // e.g., "Card not found", "Authentication failed", etc.
}
```

**Common Errors:**
- `Authentication failed` - Invalid or expired token
- `{Entity} not found` - Resource doesn't exist
- `Permission denied` - Insufficient permissions
- `Network error` - Connection issues

---

## Best Practices

### 1. **Use Helper Functions When Possible**

```typescript
// ❌ Avoid: Multiple raw API calls for common tasks
const projects = await listProjects(auth);
for (const project of projects) {
  const details = await getProject(auth, project.id);
  // ...process boards, cards manually
}

// ✅ Better: Use helper functions
import { getUserCards } from '@rastar/mcp-planka/helpers';
const cards = await getUserCards(auth);
```

### 2. **Handle Included Data**

Many endpoints return data in JSON:API format:
```typescript
const boardDetails = await getBoard(auth, 'board-123');

// Access main data
const board = boardDetails.item;

// Access included entities
const lists = boardDetails.included.lists;
const cards = boardDetails.included.cards;
const labels = boardDetails.included.labels;
```

### 3. **Type Your Responses**

```typescript
import type { PlankaCard, PlankaProject } from '@rastar/mcp-planka/types';

const card: PlankaCard = await getCard(auth, 'card-123');
const projects: PlankaProject[] = await listProjects(auth);
```

### 4. **Batch Operations**

```typescript
// Create multiple cards efficiently
const cardPromises = cardNames.map(name => 
  createCard(auth, listId, name)
);
const cards = await Promise.all(cardPromises);
```

### 5. **Use ISO Dates**

```typescript
// Always use ISO format for dates
await createCard(
  auth,
  'list-123',
  'Task',
  undefined,
  undefined,
  new Date('2025-12-31').toISOString()
);
```

---

## Complete Function List

### Projects (6)
- `listProjects()`, `getProject()`, `createProject()`, `updateProject()`, `deleteProject()`, `duplicateProject()`

### Boards (6)
- `listBoards()`, `getBoard()`, `createBoard()`, `updateBoard()`, `deleteBoard()`, `duplicateBoard()`

### Lists (4)
- `createList()`, `updateList()`, `sortList()`, `deleteList()`

### Cards (7)
- `createCard()`, `getCard()`, `updateCard()`, `moveCard()`, `deleteCard()`, `duplicateCard()`, `getCardChildren()`

### Labels (5)
- `createLabel()`, `updateLabel()`, `deleteLabel()`, `assignLabelToCard()`, `removeLabelFromCard()`

### Tasks (7)
- `createTaskList()`, `updateTaskList()`, `deleteTaskList()`, `createTask()`, `updateTask()`, `deleteTask()`, `sortTaskList()`

### Users (6)
- `getCurrentUser()`, `getUser()`, `listUsers()`, `createUser()`, `updateUser()`, `deleteUser()`

### Members (2)
- `assignMemberToCard()`, `removeMemberFromCard()`

### Comments (4)
- `getComments()`, `createComment()`, `updateComment()`, `deleteComment()`

### Attachments (3)
- `listAttachments()`, `uploadAttachment()`, `deleteAttachment()`

### Activity (2)
- `getCardActions()`, `getUserActions()`

### Notifications (3)
- `listNotifications()`, `markNotificationAsRead()`, `deleteNotification()`

### Advanced (10+)
- Board memberships, permissions, config, background images, webhooks, teams, etc.

**Total:** 50+ raw API functions

---

## Related Documentation

- **[HELPERS.md](HELPERS.md)** - High-level helper functions (recommended)
- **[TOOLS.md](TOOLS.md)** - MCP tools for AI assistants
- **[README.md](../README.md)** - Overview and quick start

---

**Last Updated:** December 30, 2025  
**Version:** 1.0.0
