# Integration Testing Guide

This guide shows how to run integration tests against a real Planka instance.

## Setup

1. Ensure you have a running Planka instance
2. Create a `.env.test` file in the `mcp-planka` directory:

```env
PLANKA_BASE_URL=https://your-planka-instance.com
PLANKA_ACCESS_TOKEN=your-access-token-here
```

## Running Integration Tests

Integration tests are in the `__tests__/integration` folder and use the `INTEGRATION_TEST` environment variable to determine if they should run.

```bash
# Run only integration tests
INTEGRATION_TEST=true npm test -- integration

# Run all tests including integration
INTEGRATION_TEST=true npm test
```

## Example Integration Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { listProjects, getProject } from '../projects.js';
import type { PlankaAuth } from '../../types/index.js';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

describe.skipIf(!process.env.INTEGRATION_TEST)('Projects Integration Tests', () => {
  let auth: PlankaAuth;

  beforeAll(() => {
    auth = {
      plankaBaseUrl: process.env.PLANKA_BASE_URL!,
      accessToken: process.env.PLANKA_ACCESS_TOKEN!,
    };

    if (!auth.plankaBaseUrl || !auth.accessToken) {
      throw new Error(
        'PLANKA_BASE_URL and PLANKA_ACCESS_TOKEN must be set in .env.test'
      );
    }
  });

  it('should list projects from real Planka instance', async () => {
    const projects = await listProjects(auth);
    
    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
    
    if (projects.length > 0) {
      expect(projects[0]).toHaveProperty('id');
      expect(projects[0]).toHaveProperty('name');
      expect(projects[0]).toHaveProperty('createdAt');
    }
  });

  it('should get a specific project', async () => {
    // First get list of projects
    const projects = await listProjects(auth);
    
    if (projects.length === 0) {
      console.log('No projects found, skipping test');
      return;
    }

    // Get first project
    const project = await getProject(auth, projects[0].id);
    
    expect(project).toBeDefined();
    expect(project.id).toBe(projects[0].id);
  });
});
```

## Safety Tips

- Always use a **test instance** of Planka, not production
- Integration tests may create, modify, or delete data
- Use descriptive names for test data (e.g., "[TEST] Board Name")
- Clean up test data after tests complete
- Consider using a separate test project in Planka

## Clean Up Example

```typescript
describe('Board Integration Tests', () => {
  const createdBoards: string[] = [];

  afterAll(async () => {
    // Clean up created boards
    for (const boardId of createdBoards) {
      try {
        await deleteBoard(auth, boardId);
      } catch (error) {
        console.error(`Failed to delete board ${boardId}:`, error);
      }
    }
  });

  it('should create a board', async () => {
    const board = await createBoard(auth, projectId, '[TEST] Integration Board');
    createdBoards.push(board.id);
    
    expect(board.name).toBe('[TEST] Integration Board');
  });
});
```
