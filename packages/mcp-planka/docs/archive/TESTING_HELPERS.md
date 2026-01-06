# Planka MCP Helper Functions - Testing Guide

## Test Coverage

All helper functions have comprehensive unit tests and integration tests:

### Unit Tests (34 tests)
- ✅ `user-tasks.test.ts` - 10 tests
- ✅ `user-activity.test.ts` - 10 tests  
- ✅ `project-status.test.ts` - 5 tests
- ✅ `daily-reports.test.ts` - 9 tests

### Integration Tests (10 tests, skipped by default)
- ✅ `integration.test.ts` - Real API tests

## Running Tests

### Run All Unit Tests
```bash
cd packages/mcp-planka
npm test
```

### Run Specific Test File
```bash
npm test -- user-tasks
npm test -- user-activity
npm test -- project-status
npm test -- daily-reports
```

### Run Tests in CI Mode (no watch)
```bash
npm test -- --run
```

### Run Helper Tests Only
```bash
npm test -- src/helpers/__tests__ --run
```

### Run Integration Tests
Integration tests use REAL authentication and make REAL API calls.

```bash
# Set credentials
export PLANKA_BASE_URL="https://pm-dev.rastar.dev"
export PLANKA_USERNAME="your-username"
export PLANKA_PASSWORD="your-password"

# Run integration tests
INTEGRATION_TEST=1 npm test integration
```

## Test Structure

### Unit Tests
Unit tests mock all API calls and test the business logic of helpers:

```typescript
vi.mock('../../api/index.js');
vi.mock('../../api/actions.js');

it('should resolve "me" to current user', async () => {
  vi.mocked(api.getCurrentUser).mockResolvedValueOnce({
    item: { id: 'user-123', name: 'Test User' }
  });
  
  await getUserCards(auth, 'me');
  
  expect(api.getCurrentUser).toHaveBeenCalledWith(auth);
});
```

### Integration Tests
Integration tests use real credentials and test against actual Planka instance:

```typescript
describe.skipIf(!process.env.INTEGRATION_TEST)('Integration Tests', () => {
  it('should get user cards', async () => {
    const cards = await getUserCards(auth);
    
    expect(cards).toBeDefined();
    expect(Array.isArray(cards)).toBe(true);
  });
});
```

## Test Coverage Summary

### ✅ User Tasks (`user-tasks.test.ts`)
- Current user resolution ("me" and undefined)
- Enriched card data with project/board/list context
- Filtering by done status
- Sorting cards
- Search functionality
- Task filtering (completed/incomplete)
- Card history retrieval

### ✅ User Activity (`user-activity.test.ts`)
- Current user resolution
- Notification enrichment
- Activity history with date filters
- Today's activity shortcut
- Week's activity shortcut
- Action description formatting

### ✅ Project Status (`project-status.test.ts`)
- Project status calculation
- Board summaries
- Completion percentages
- Overdue card detection
- List summaries

### ✅ Daily Reports (`daily-reports.test.ts`)
- Daily report project detection
- User daily report retrieval
- Date parsing from card names
- Missing reports detection
- Report generation from tasks
- Summary with missing dates

### ✅ Integration Tests (`integration.test.ts`)
- Real authentication flow
- Full user workflow tests
- Project and board status
- Daily reports integration
- Notification retrieval

## CI/CD

Tests can be run in CI with:

```yaml
- name: Test Planka MCP Helpers
  run: |
    cd packages/mcp-planka
    npm test -- --run
```

## Manual Testing

Use the test helper script for quick manual testing:

```bash
cd packages/mcp-planka
export PLANKA_BASE_URL="https://pm-dev.rastar.dev"
export PLANKA_TOKEN="your-access-token"
npx tsx test-helpers.ts
```

This will:
1. Get your cards and tasks
2. Check today's activity
3. Check notifications
4. Get daily report projects
5. Get project/board status

## Test Results

Latest test run (December 29, 2025):
```
✓ src/helpers/__tests__/daily-reports.test.ts (9)
✓ src/helpers/__tests__/project-status.test.ts (5)
✓ src/helpers/__tests__/user-activity.test.ts (10)
✓ src/helpers/__tests__/user-tasks.test.ts (10)

Test Files  4 passed | 1 skipped (5)
Tests  34 passed | 10 skipped (44)
Duration  1.66s
```

## Next Steps

1. ✅ All unit tests passing
2. ✅ All helper functions tested
3. ⏳ Update MCP tools to use helpers
4. ⏳ Test MCP tools with Claude
5. ⏳ Document tool usage patterns
