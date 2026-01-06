# Search Helper Functions

Comprehensive search capabilities across all Planka entities.

## Features

### 1. **User Search** - `searchUsers()`
Search for users by name, email, or username.

```typescript
import { searchUsers } from '@rad/mcp-planka/helpers';

// Basic search (case-insensitive)
const users = await searchUsers(auth, 'john');

// Case-sensitive search
const users = await searchUsers(auth, 'John', { caseSensitive: true });

// Whole word matching
const users = await searchUsers(auth, 'admin', { wholeWord: true });

// Regex search
const users = await searchUsers(auth, 'J(ohn|ane)', { useRegex: true });
```

### 2. **Project Search** - `searchProjects()`
Search for projects by name, includes board count.

```typescript
import { searchProjects } from '@rad/mcp-planka/helpers';

const projects = await searchProjects(auth, 'development');
// Returns: { id, name, boardCount, boards: [{ id, name }] }
```

### 3. **Board Search** - `searchBoards()`
Search for boards across all projects.

```typescript
import { searchBoards } from '@rad/mcp-planka/helpers';

const boards = await searchBoards(auth, 'sprint');
// Returns: { id, name, projectId, projectName, listCount }
```

### 4. **Card Search** - `searchCards()`
Search cards by title or description.

```typescript
import { searchCards } from '@rad/mcp-planka/helpers';

const cards = await searchCards(auth, 'bug fix');
// Returns: EnrichedCard with matchedIn: ['title' | 'description']
```

### 5. **Task Search** - `searchTasks()`
Search tasks by name.

```typescript
import { searchTasks } from '@rad/mcp-planka/helpers';

const tasks = await searchTasks(auth, 'write tests');
// Returns: EnrichedTask with matchedIn: ['name']
```

### 6. **Global Search** - `globalSearch()`
Search across ALL entity types simultaneously.

```typescript
import { globalSearch } from '@rad/mcp-planka/helpers';

const results = await globalSearch(auth, 'API');
// Returns: {
//   users: UserSearchResult[],
//   projects: ProjectSearchResult[],
//   boards: BoardSearchResult[],
//   cards: CardSearchResult[],
//   tasks: TaskSearchResult[]
// }
```

## Search Options

All search functions support these options:

```typescript
interface SearchOptions {
  caseSensitive?: boolean;  // Default: false
  wholeWord?: boolean;      // Default: false
  useRegex?: boolean;       // Default: false
}
```

## Examples

### Find All Cards Mentioning "API"
```typescript
const apiCards = await searchCards(auth, 'API');
console.log(`Found ${apiCards.length} cards about API`);
apiCards.forEach(card => {
  console.log(`- ${card.name} (matched in: ${card.matchedIn.join(', ')})`);
});
```

### Find Development Boards
```typescript
const devBoards = await searchBoards(auth, 'dev');
console.log('Development boards:');
devBoards.forEach(board => {
  console.log(`- ${board.name} (${board.projectName})`);
});
```

### Global Search for "urgent"
```typescript
const urgent = await globalSearch(auth, 'urgent');

console.log(`Found ${urgent.cards.length} urgent cards`);
console.log(`Found ${urgent.tasks.length} urgent tasks`);
console.log(`Found ${urgent.boards.length} boards with "urgent"`);
```

### Regex Search
```typescript
// Find cards about bugs OR issues
const problems = await searchCards(auth, 'bug|issue', { useRegex: true });

// Find users with Gmail addresses
const gmailUsers = await searchUsers(auth, '@gmail\\.com$', { useRegex: true });
```

## Performance Notes

- **searchCards** and **searchTasks** search only the current user's assigned items
- **globalSearch** runs all searches in parallel for better performance
- Search is performed in-memory after fetching data
- For large datasets, consider filtering by project/board first using `getUserCards()` with filter options

## Error Handling

All search functions handle errors gracefully:

```typescript
const results = await globalSearch(auth, 'test');
// If users API fails, results.users will be []
// Other searches continue normally
```
