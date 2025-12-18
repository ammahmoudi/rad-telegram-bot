# Planka MCP - Complete Usage Examples

## Example 1: Creating a Complete Project Workflow

```typescript
import {
  listProjects,
  createBoard,
  createList,
  createCard,
  createLabel,
  assignLabelToCard,
  getMembers,
  assignMemberToCard,
  createComment,
  createTaskList,
  createTask,
  moveCard,
} from './planka.js';

async function setupNewSprint(auth) {
  // 1. Get projects
  const projects = await listProjects(auth);
  const projectId = projects[0].id;

  // 2. Create a new board for the sprint
  const board = await createBoard(auth, projectId, 'Sprint 23 - Q1 2025', 1);

  // 3. Create standard lists
  const backlog = await createList(auth, board.id, 'Backlog', 1, 'light-gray');
  const todo = await createList(auth, board.id, 'To Do', 2, 'sky-blue');
  const inProgress = await createList(auth, board.id, 'In Progress', 3, 'warm-orange');
  const review = await createList(auth, board.id, 'Review', 4, 'sunny-yellow');
  const done = await createList(auth, board.id, 'Done', 5, 'green-grass');

  // 4. Create labels for categorization
  const bugLabel = await createLabel(auth, board.id, 'Bug', 'berry-red', 1);
  const featureLabel = await createLabel(auth, board.id, 'Feature', 'ocean-blue', 2);
  const urgentLabel = await createLabel(auth, board.id, 'Urgent', 'warm-orange', 3);
  const techDebtLabel = await createLabel(auth, board.id, 'Tech Debt', 'dark-purple', 4);

  // 5. Get team members
  const members = await getMembers(auth, projectId);

  return {
    board,
    lists: { backlog, todo, inProgress, review, done },
    labels: { bugLabel, featureLabel, urgentLabel, techDebtLabel },
    members,
  };
}
```

## Example 2: Creating and Managing a Feature Card

```typescript
async function createFeatureCard(auth, listId, members, labels) {
  // Create the main card
  const card = await createCard(
    auth,
    listId,
    'Implement user authentication',
    'Add OAuth2 support for Google and GitHub login',
    65535, // position
    '2025-01-31T23:59:59Z' // due date
  );

  // Assign labels
  await assignLabelToCard(auth, card.id, labels.featureLabel.id);
  await assignLabelToCard(auth, card.id, labels.urgentLabel.id);

  // Assign team members
  await assignMemberToCard(auth, card.id, members[0].id);
  await assignMemberToCard(auth, card.id, members[1].id);

  // Add initial comment
  await createComment(
    auth,
    card.id,
    'Starting work on this feature. Will begin with OAuth2 setup.'
  );

  // Create implementation checklist
  const taskList = await createTaskList(auth, card.id, 'Implementation Steps', 1);

  await createTask(auth, taskList.id, 'Setup OAuth2 client configuration', 1);
  await createTask(auth, taskList.id, 'Implement Google OAuth flow', 2);
  await createTask(auth, taskList.id, 'Implement GitHub OAuth flow', 3);
  await createTask(auth, taskList.id, 'Add user session management', 4);
  await createTask(auth, taskList.id, 'Write unit tests', 5);
  await createTask(auth, taskList.id, 'Update documentation', 6);

  return card;
}
```

## Example 3: Managing Card Workflow

```typescript
async function progressCard(auth, cardId, lists) {
  // Move from To Do to In Progress
  await moveCard(auth, cardId, lists.inProgress.id);
  await createComment(auth, cardId, 'Moving to in progress. Starting development.');

  // ... development happens ...

  // Complete some tasks
  await updateTask(auth, taskId1, { isCompleted: true });
  await updateTask(auth, taskId2, { isCompleted: true });

  // Add progress comment
  await createComment(auth, cardId, 'Completed OAuth setup for Google and GitHub.');

  // Move to Review
  await moveCard(auth, cardId, lists.review.id);
  await createComment(auth, cardId, 'Ready for code review. PR #123 created.');

  // ... review happens ...

  // Move to Done
  await moveCard(auth, cardId, lists.done.id);
  await createComment(auth, cardId, '✅ Reviewed and merged. Feature complete!');
}
```

## Example 4: Searching and Filtering Cards

```typescript
async function findBlockedCards(auth, boardId) {
  const board = await getBoard(auth, boardId);
  const cards = board.included?.cards ?? [];

  // Find all cards with "blocked" in name or description
  const blockedCards = cards.filter((card) => {
    const name = (card.name ?? '').toLowerCase();
    const desc = (card.description ?? '').toLowerCase();
    return name.includes('blocked') || desc.includes('blocked');
  });

  return blockedCards;
}

async function getOverdueCards(auth, boardId) {
  const board = await getBoard(auth, boardId);
  const cards = board.included?.cards ?? [];
  const now = new Date();

  const overdueCards = cards.filter((card) => {
    if (!card.dueDate) return false;
    const dueDate = new Date(card.dueDate);
    return dueDate < now;
  });

  return overdueCards;
}
```

## Example 5: Bulk Operations

```typescript
async function createBulkCards(auth, listId, cardNames) {
  const cards = [];

  for (let i = 0; i < cardNames.length; i++) {
    const card = await createCard(
      auth,
      listId,
      cardNames[i],
      `Auto-generated card ${i + 1}`,
      (i + 1) * 1000 // position
    );
    cards.push(card);
  }

  return cards;
}

async function archiveCompletedLists(auth, boardId) {
  const board = await getBoard(auth, boardId);
  const lists = board.included?.lists ?? [];

  for (const list of lists) {
    if (list.name.toLowerCase().includes('done') || 
        list.name.toLowerCase().includes('archived')) {
      await archiveList(auth, list.id);
    }
  }
}
```

## Example 6: Label Management

```typescript
async function updateProjectLabels(auth, boardId) {
  const labels = await getLabels(auth, boardId);

  // Update existing labels
  for (const label of labels) {
    if (label.name === 'Old Name') {
      await updateLabel(auth, label.id, {
        name: 'New Name',
        color: 'ocean-blue',
      });
    }
  }

  // Create new priority labels
  const priorities = [
    { name: 'P0 - Critical', color: 'berry-red', position: 1 },
    { name: 'P1 - High', color: 'warm-orange', position: 2 },
    { name: 'P2 - Medium', color: 'sunny-yellow', position: 3 },
    { name: 'P3 - Low', color: 'sky-blue', position: 4 },
  ];

  for (const priority of priorities) {
    await createLabel(auth, boardId, priority.name, priority.color, priority.position);
  }
}
```

## Example 7: Comment Thread Management

```typescript
async function discussCard(auth, cardId) {
  // Get existing comments
  const comments = await getComments(auth, cardId);
  console.log(`Found ${comments.length} existing comments`);

  // Add a new comment
  await createComment(
    auth,
    cardId,
    '@team Please review the implementation approach before I proceed.'
  );

  // Update a previous comment
  if (comments.length > 0) {
    await updateComment(
      auth,
      comments[0].id,
      'Updated: The approach has been approved. Proceeding with implementation.'
    );
  }
}
```

## Example 8: Task List Progress Tracking

```typescript
async function getTaskProgress(auth, cardId) {
  const card = await plankaFetch(auth, `/api/cards/${cardId}`, { method: 'GET' });
  const taskLists = card.included?.taskLists ?? [];
  const tasks = card.included?.tasks ?? [];

  let totalTasks = 0;
  let completedTasks = 0;

  for (const task of tasks) {
    totalTasks++;
    if (task.isCompleted) completedTasks++;
  }

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return {
    totalTasks,
    completedTasks,
    progress: progress.toFixed(2) + '%',
    taskLists: taskLists.length,
  };
}

async function completeAllTasks(auth, taskListId) {
  // Get all tasks in the list
  const card = await plankaFetch(auth, `/api/task-lists/${taskListId}`, { method: 'GET' });
  const tasks = card.included?.tasks ?? [];

  // Mark all as completed
  for (const task of tasks) {
    if (!task.isCompleted) {
      await updateTask(auth, task.id, { isCompleted: true });
    }
  }
}
```

## Example 9: Board Cleanup

```typescript
async function cleanupBoard(auth, boardId) {
  const board = await getBoard(auth, boardId);

  // Archive all 'Done' lists older than 30 days
  const lists = board.included?.lists ?? [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const list of lists) {
    if (list.name.toLowerCase().includes('done')) {
      const listDate = new Date(list.updatedAt || list.createdAt);
      if (listDate < thirtyDaysAgo) {
        await archiveList(auth, list.id);
      }
    }
  }

  // Remove unused labels
  const labels = await getLabels(auth, boardId);
  const cards = board.included?.cards ?? [];

  for (const label of labels) {
    const isUsed = cards.some((card) =>
      card.cardLabels?.some((cl) => cl.labelId === label.id)
    );

    if (!isUsed) {
      await deleteLabel(auth, label.id);
    }
  }
}
```

## Example 10: Reporting and Analytics

```typescript
async function generateBoardReport(auth, boardId) {
  const board = await getBoard(auth, boardId);
  const lists = board.included?.lists ?? [];
  const cards = board.included?.cards ?? [];
  const labels = board.included?.labels ?? [];

  const report = {
    boardName: board.item.name,
    totalLists: lists.length,
    totalCards: cards.length,
    totalLabels: labels.length,
    cardsByList: {},
    cardsByLabel: {},
    overdueCards: 0,
    cardsWithComments: 0,
    cardsWithTasks: 0,
  };

  // Count cards by list
  for (const list of lists) {
    report.cardsByList[list.name] = cards.filter((c) => c.listId === list.id).length;
  }

  // Count cards by label
  for (const label of labels) {
    const count = cards.filter((card) =>
      card.cardLabels?.some((cl) => cl.labelId === label.id)
    ).length;
    report.cardsByLabel[label.name] = count;
  }

  // Count overdue cards
  const now = new Date();
  report.overdueCards = cards.filter((card) => {
    if (!card.dueDate) return false;
    return new Date(card.dueDate) < now;
  }).length;

  return report;
}
```

## MCP Tool Usage via Claude

When using with Claude or other MCP clients:

```
User: "Create a new sprint board for Q1 2025"

Claude uses:
1. planka.projects.list
2. planka.boards.create
3. planka.lists.create (multiple)
4. planka.labels.create (multiple)

User: "Add a bug card for the login issue and assign it to John"

Claude uses:
1. planka.cards.create
2. planka.labels.assignToCard
3. planka.members.list
4. planka.members.assignToCard

User: "Show me all overdue cards"

Claude uses:
1. planka.boards.list
2. planka.cards.search
3. Filter by dueDate
```

## Best Practices

1. **Always check authentication** before operations
2. **Use position numbers** strategically (multiples of 1000 for easy reordering)
3. **Add comments** for important state changes
4. **Use labels consistently** across the organization
5. **Archive instead of delete** when possible
6. **Set due dates** on time-sensitive cards
7. **Use task lists** for complex cards
8. **Regular cleanup** of old boards and archived items

## Error Handling

```typescript
try {
  const card = await createCard(auth, listId, 'New Card');
  console.log('Card created:', card.id);
} catch (error) {
  if (error.message.includes('404')) {
    console.error('List not found');
  } else if (error.message.includes('401')) {
    console.error('Authentication failed');
  } else {
    console.error('Operation failed:', error.message);
  }
}
```

This comprehensive set of examples demonstrates the full power of the expanded Planka MCP server!
