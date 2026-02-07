# Rastar MCP Testing Guide

This guide explains how to test the Rastar MCP package.

## Test Types

### 1. Unit Tests

Unit tests mock external dependencies and test individual functions in isolation.

**Run unit tests:**
```bash
npm test
```

**Run with UI:**
```bash
npm run test:ui
```

**Run once (CI mode):**
```bash
npm run test:run
```

### 2. Integration Tests

Integration tests make REAL API calls to a live Rastar instance. They are more comprehensive but require valid credentials.

**Setup:**

1. Copy the example environment file:
   ```bash
   cp .env.test.example .env.test
   ```

2. Fill in your test credentials in `.env.test`:
   ```env
  RASTAR_BASE_URL=https://my-api.rastar.company
   TEST_EMAIL=your-email@example.com
   TEST_PASSWORD=your-password
   ```

**Run integration tests:**
```bash
INTEGRATION_TEST=1 npm test integration
```

Or on Windows (PowerShell):
```powershell
$env:INTEGRATION_TEST=1; npm test integration
```

**What integration tests do:**
- ✅ Authenticate with real credentials
- ✅ Fetch menu schedule (read-only)
- ✅ Fetch user menu selections (read-only)
- ✅ Create menu selection → verify → delete (creates and cleans up)
- ✅ Test error handling

## Test Structure

```
src/api/__tests__/
├── client.test.ts          # Tests for rastarFetch HTTP client
├── auth.test.ts            # Tests for login and token refresh
├── menu.test.ts            # Tests for menu operations
└── integration.test.ts     # End-to-end integration tests
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMenuSchedule } from '../menu.js';
import * as client from '../client.js';

vi.mock('../client.js', () => ({
  rastarFetch: vi.fn(),
}));

describe('Menu API', () => {
  it('should fetch menu schedule', async () => {
    const mockSchedule = [{ id: '1', date: '2024-01-15' }];
    vi.mocked(client.rastarFetch).mockResolvedValueOnce(mockSchedule);
    
    const result = await getMenuSchedule(auth);
    
    expect(result).toEqual(mockSchedule);
  });
});
```

### Integration Test Example

```typescript
describe.skipIf(!process.env.INTEGRATION_TEST)('Integration Tests', () => {
  it('should create and delete a menu selection', async () => {
    const selection = await createMenuSelection(auth, userId, scheduleId);
    expect(selection).toHaveProperty('id');
    
    await deleteMenuSelection(auth, selection.id);
  });
});
```

## Coverage

Generate coverage reports:
```bash
npm test -- --coverage
```

View coverage HTML report:
```bash
open coverage/index.html
```

## Best Practices

1. **Mock External Dependencies**: Unit tests should mock `rastarFetch` to avoid real API calls
2. **Clean Up Resources**: Integration tests should delete any created resources in `afterAll` hooks
3. **Use Descriptive Names**: Test names should clearly describe what is being tested
4. **Test Error Cases**: Include tests for error handling and edge cases
5. **Skip Integration Tests**: Integration tests are skipped by default unless `INTEGRATION_TEST=1` is set

## Continuous Integration

In CI environments, only run unit tests by default:
```bash
npm run test:run
```

Run integration tests only when needed:
```bash
INTEGRATION_TEST=1 npm run test:integration
```

## Troubleshooting

**"Missing TEST_EMAIL or TEST_PASSWORD"**
- Make sure you've created `.env.test` and filled in your credentials

**"Authentication failed"**
- Check your credentials in `.env.test`
- Verify the Rastar instance is accessible
- Ensure your account is active

**"No menu schedule available"**
- The database might be empty
- Some tests will skip if no test data is available

**Tests timeout**
- Increase timeout in test file: `it('test', async () => {...}, 30000)`
- Check network connectivity to Rastar instance
