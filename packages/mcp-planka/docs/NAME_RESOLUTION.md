# Name/Email Resolution - User Guide

The Planka MCP helpers now support using human-readable names and emails instead of IDs in most places!

## 🎯 What's New

Instead of needing to know cryptic IDs like `user-abc-123`, you can now use:
- **User emails** - `john@company.com`
- **User names** - `John Doe`
- **Project names** - `Marketing Campaign`
- **Board names** - `Sprint 24`
- **List names** - `In Progress`

## 📝 Examples

### Working with Users

```typescript
// OLD WAY - Need to find user ID first
const users = await listUsers(auth);
const user = users.find(u => u.email === 'john@company.com');
await addUserToBoard(auth, 'board-123', user.id);

// NEW WAY - Use email directly
await addUserToBoard(auth, 'board-123', 'john@company.com');

// Also works with names
await addUserToBoard(auth, 'board-123', 'John Doe');

// Or still use ID if you have it
await addUserToBoard(auth, 'board-123', 'user-abc-123');
```

### Working with Projects & Boards

```typescript
// OLD WAY - Multiple API calls to get IDs
const projects = await listProjects(auth);
const project = projects.find(p => p.name === 'Marketing');
const projectDetails = await getProject(auth, project.id);
const board = projectDetails.boards.find(b => b.name === 'Q1 Campaign');
await createBoardList(auth, board.id, 'To Do');

// NEW WAY - Use names directly
await createBoardList(
  auth,
  'Marketing',           // Project name
  'Q1 Campaign',         // Board name
  'To Do'                // New list name
);
```

### Working with Lists

```typescript
// Create cards using list name instead of ID
await createNewCard(
  auth,
  'board-123',
  'In Progress',  // List name instead of list-abc-123
  'Fix login bug'
);

// Move cards between lists by name
await moveAllCards(
  auth,
  'board-123',
  'To Do',      // Source list name
  'Done'        // Target list name
);

// Update list by name
await updateBoardList(
  auth,
  'board-123',
  'In Progress',  // List name
  { color: 'green' }
);
```

### Assigning Users to Cards

```typescript
// Assign by email
await assignUserToCard(auth, 'card-123', 'sarah@company.com');

// Assign by name
await assignUserToCard(auth, 'card-123', 'Sarah Smith');

// Remove by email
await unassignUserFromCard(auth, 'card-123', 'sarah@company.com');
```

### Batch Operations

```typescript
// Add multiple users to board by email
await addMultipleUsersToBoard(
  auth,
  'board-123',
  [
    'john@company.com',
    'sarah@company.com',
    'mike@company.com'
  ],
  'editor'
);

// Create multiple lists in a board
await createMultipleLists(
  auth,
  'Engineering',      // Project name
  'Sprint 25',        // Board name
  ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
);

// Create multiple cards in a list
await createMultipleCards(
  auth,
  'board-123',
  'To Do',           // List name
  ['Task 1', 'Task 2', 'Task 3']
);
```

## 🔍 Resolution Logic

The resolvers use smart matching:

1. **Try exact ID match first** - If it looks like an ID, check if it exists
2. **Try email match** - For users, if contains `@`, match by email (case-insensitive)
3. **Try name match** - Match by name (case-insensitive)
4. **Throw error** - If nothing matches, you get a clear error message

### Examples of Resolution

```typescript
// User resolution
resolveUser(auth, 'user-abc-123')        // ✅ Matches by ID
resolveUser(auth, 'john@company.com')    // ✅ Matches by email
resolveUser(auth, 'John Doe')            // ✅ Matches by name
resolveUser(auth, 'JOHN DOE')            // ✅ Case-insensitive
resolveUser(auth, 'nobody@email.com')    // ❌ Error: User not found

// Project resolution
resolveProject(auth, 'proj-123')         // ✅ Matches by ID
resolveProject(auth, 'Marketing')        // ✅ Matches by name
resolveProject(auth, 'marketing')        // ✅ Case-insensitive

// Board resolution (within project)
resolveBoard(auth, 'Marketing', 'Sprint 24')    // ✅ Both by name
resolveBoard(auth, 'proj-123', 'board-456')     // ✅ Both by ID
resolveBoard(auth, 'Marketing', 'board-456')    // ✅ Mixed
```

## ⚡ Performance Note

Name/email resolution requires additional API calls to fetch entity lists. For better performance in loops:

```typescript
// ❌ SLOW - Resolves on each iteration
for (const email of emails) {
  await addUserToBoard(auth, 'board-123', email);
}

// ✅ FAST - Batch operation
await addMultipleUsersToBoard(auth, 'board-123', emails, 'editor');
```

## 🎓 Migration Guide

### Before (ID-only)

```typescript
// Step 1: Find project ID
const projects = await listProjects(auth);
const project = projects.find(p => p.name === 'Engineering');

// Step 2: Find board ID
const projectDetails = await getProject(auth, project.id);
const board = projectDetails.boards.find(b => b.name === 'Sprint');

// Step 3: Find list ID
const boardDetails = await getBoard(auth, board.id);
const list = boardDetails.lists.find(l => l.name === 'To Do');

// Step 4: Create card
await createCard(auth, list.id, 'Fix bug');

// Step 5: Find user ID
const users = await listUsers(auth);
const user = users.find(u => u.email === 'dev@company.com');

// Step 6: Assign user
await assignMemberToCard(auth, cardId, user.id);
```

### After (Name/Email)

```typescript
// All in one!
const card = await createNewCard(
  auth,
  boardId,        // Still need board ID for context
  'To Do',        // List name
  'Fix bug',
  { assignToMe: false }
);

await assignUserToCard(auth, card.id, 'dev@company.com');
```

## 📚 Function Reference

### Functions with Name/Email Support

**Board Membership:**
- `addUserToBoard(auth, boardId, userIdentifier, role?)` - userIdentifier can be ID/email/name
- `getUserBoardMembership(auth, boardId, userIdentifier)` - userIdentifier can be ID/email/name

**Card Management:**
- `createNewCard(auth, boardId, listIdentifier, name, options?)` - listIdentifier can be ID/name
- `assignUserToCard(auth, cardId, userIdentifier)` - userIdentifier can be ID/email/name
- `unassignUserFromCard(auth, cardId, userIdentifier)` - userIdentifier can be ID/email/name
- `createMultipleCards(auth, boardId, listIdentifier, names)` - listIdentifier can be ID/name
- `getCardsInList(auth, boardId, listIdentifier)` - listIdentifier can be ID/name

**List Management:**
- `createBoardList(auth, projectIdentifier, boardIdentifier, name, options?)` - Both can be ID/name
- `updateBoardList(auth, boardId, listIdentifier, updates)` - listIdentifier can be ID/name
- `archiveBoardList(auth, boardId, listIdentifier)` - listIdentifier can be ID/name
- `deleteBoardList(auth, boardId, listIdentifier)` - listIdentifier can be ID/name
- `moveAllCards(auth, boardId, sourceListIdentifier, targetListIdentifier)` - Both can be ID/name
- `clearListCards(auth, boardId, listIdentifier)` - listIdentifier can be ID/name
- `sortListCards(auth, boardId, listIdentifier)` - listIdentifier can be ID/name
- `createMultipleLists(auth, projectIdentifier, boardIdentifier, names)` - Both can be ID/name

### Direct Resolver Functions

For advanced use cases, you can use resolvers directly:

```typescript
import { resolveUser, resolveProject, resolveBoard, resolveList, resolveCard } from '@rastar/mcp-planka/helpers';

// Get user details by email/name
const user = await resolveUser(auth, 'john@company.com');
console.log(user.id, user.name, user.email);

// Get project details by name
const project = await resolveProject(auth, 'Marketing');
console.log(project.id, project.name);

// Get board details by name (within project)
const board = await resolveBoard(auth, 'Marketing', 'Sprint 24');
console.log(board.id, board.name, board.projectId, board.projectName);

// Get list details by name (within board)
const list = await resolveList(auth, 'board-123', 'To Do');
console.log(list.id, list.name, list.boardId);

// Get card details by name (within list)
const card = await resolveCard(auth, 'board-123', 'To Do', 'My Task');
console.log(card.id, card.name, card.listId);
```

---

**Last Updated:** December 30, 2025  
**Version:** 1.1.0
