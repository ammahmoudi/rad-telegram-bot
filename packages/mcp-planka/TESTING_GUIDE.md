# Testing Guide

## Two Types of Tests

### 1. Unit Tests (Fast, Mocked)
**Location**: `src/api/__tests__/*.test.ts`

**What they test**: Function logic, parameter handling, error handling

**Characteristics**:
- ❌ No real API calls
- ❌ No authentication needed
- ✅ Fast (milliseconds)
- ✅ Safe (can't affect real data)
- ✅ Run on every change

**Run them**:
```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Visual UI
```

### 2. Integration Tests (Real API)
**Location**: `src/api/__tests__/integration.test.ts`

**What they test**: Real API behavior, authentication, full lifecycle

**Characteristics**:
- ✅ Real API calls
- ✅ Real authentication
- ✅ Creates real resources
- ✅ Cleans up after itself
- ⚠️ Slower (seconds)
- ⚠️ Requires valid credentials

**Run them**:
```powershell
# Windows PowerShell
$env:INTEGRATION_TEST="true"
npm run test:integration

# Linux/Mac
export INTEGRATION_TEST=true
npm run test:integration
```

## Integration Test Flow

Each test follows: **CREATE → UPDATE → DELETE**

```
📦 CREATE
  └─ Creates test resources (lists, cards, labels)
  └─ Tracks IDs for cleanup

✏️  UPDATE  
  └─ Modifies the created resources
  └─ Tests operations like move, assign, etc.

🗑️  DELETE
  └─ Removes all test resources
  └─ Runs in afterAll() even if tests fail
```

## Test Resource Naming

All integration test resources use `[INTEGRATION_TEST]` prefix:
- `[INTEGRATION_TEST] List`
- `[INTEGRATION_TEST] Card`
- `[INTEGRATION_TEST] Label`

This makes them easy to identify and manually clean up if needed.

## Configuration

### Option 1: Environment Variables
```powershell
# Windows PowerShell
$env:INTEGRATION_TEST="true"
$env:PLANKA_BASE_URL="https://pm-dev.rastar.dev"
$env:PLANKA_USERNAME="your_username"
$env:PLANKA_PASSWORD="your_password"
npm run test:integration

# Linux/Mac
export INTEGRATION_TEST=true
export PLANKA_BASE_URL=https://pm-dev.rastar.dev
export PLANKA_USERNAME=your_username
export PLANKA_PASSWORD=your_password
npm run test:integration
```

### Option 2: .env.test File
```powershell
# Copy and edit .env.test with your credentials
Copy-Item .env.test.example .env.test
# Edit .env.test, then:
$env:INTEGRATION_TEST="true"
npm run test:integration
```

## What Gets Tested

### Integration Tests Cover:
- ✅ Lists (create, update, delete)
- ✅ Cards (create, update, move, delete)
- ✅ Labels (create, update, assign, remove, delete)
- ✅ Projects (list, get)
- ✅ Boards (get)

### Cleanup Guarantees:
- Runs in `afterAll()` hook
- Runs even if tests fail
- Deletes in correct order (cards → labels → lists)
- Logs all cleanup operations
- Handles network timeouts gracefully

## Example Output

```
Integration Tests
  Using board: Planka (1651431235039266571)

  ✓ Lists API (Full Lifecycle) > should create, update, and delete a list (1250ms)
  ✓ Cards API (Full Lifecycle) > should create, update, move, and delete a card (2340ms)
  ✓ Labels API (Full Lifecycle) > should create, update, assign, remove, and delete a label (1890ms)
  ✓ Read Operations > should list all projects (450ms)
  ✓ Read Operations > should get project details (380ms)
  ✓ Read Operations > should get board details (320ms)

🧹 Cleaning up test resources...
   ✓ Deleted card: 1671020261706565313
   ✓ Deleted label: 1671020268476834354
   ✓ Deleted list: 1671020254231289265
✅ Cleanup completed

Test Files  1 passed (1)
     Tests  6 passed (6)
  Duration  8.12s
```

## Troubleshooting

### "No writable board found"
- Check you have editor permissions on at least one board
- Update the board name filter in `integration.test.ts`

### Network timeouts
- Server might be slow
- Increase timeout in test (default: 30000ms)

### Resources not cleaned up
- Check cleanup logs in terminal
- Manually delete resources with `[INTEGRATION_TEST]` prefix
- May happen if test process is killed

## Best Practices

1. **Always use prefixes** for test data
2. **Don't run against production** - use dev/test instance
3. **Check cleanup logs** after each run
4. **Increase timeouts** if server is slow
5. **Use separate test board** if possible
