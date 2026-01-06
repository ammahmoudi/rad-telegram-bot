/**
 * Integration tests for api-optimized endpoints
 * 
 * These tests run against a live Planka instance.
 * They will SKIP if the optimized endpoints are not yet implemented on the backend.
 * 
 * Run with: INTEGRATION_TEST=1 npm run test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { filterCards } from '../cards.js';
import { getUserActions, getHistory, getFeed } from '../activity.js';
import { searchUsers, searchProjects, searchBoards, searchCards, globalSearch } from '../search.js';
import { checkOptimizedEndpointsAvailable } from '../index.js';
import type { PlankaAuth } from '../../planka.js';

const isIntegrationTest = process.env.INTEGRATION_TEST === '1';

describe.skipIf(!isIntegrationTest)('API Optimized - Integration Tests', () => {
  let auth: PlankaAuth;
  let optimizedAvailable: boolean;

  beforeAll(async () => {
    const baseUrl = process.env.PLANKA_BASE_URL || 'https://pm-dev.rastar.dev';
    let token = process.env.PLANKA_AUTH_TOKEN;

    // If no token provided, authenticate with username/password
    if (!token) {
      const username = process.env.PLANKA_USERNAME;
      const password = process.env.PLANKA_PASSWORD;

      if (!username || !password) {
        throw new Error('Either PLANKA_AUTH_TOKEN or (PLANKA_USERNAME and PLANKA_PASSWORD) must be set');
      }

      console.log(`Authenticating as ${username}...`);
      
      // Authenticate to get token
      const response = await fetch(`${baseUrl}/api/access-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      token = data.item;
      console.log('✅ Authentication successful');
    }

    auth = {
      plankaBaseUrl: baseUrl,
      accessToken: token,
    };

    // Check if optimized endpoints are available
    optimizedAvailable = await checkOptimizedEndpointsAvailable(auth);
    console.log(`\n⚠️  Optimized endpoints available: ${optimizedAvailable}\n`);
  }, 30000); // 30 second timeout for authentication

  describe('Endpoint Availability', () => {
    it('should check if optimized endpoints are implemented', async () => {
      const available = await checkOptimizedEndpointsAvailable(auth);
      console.log(`Optimized API endpoints: ${available ? '✅ Available' : '❌ Not implemented yet'}`);
      
      if (!available) {
        console.log('\n📝 Note: Optimized endpoints not implemented on backend yet.');
        console.log('   Tests will be skipped. Use helpers/ instead for now.\n');
      }
    });
  });

  describe('Cards - GET /cards/filter', () => {
    it('should filter cards with basic parameters', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await filterCards(auth, {
        status: 'open',
        page: 1,
        pageSize: 10,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('included');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it('should filter cards by assigned user', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await filterCards(auth, {
        assignedToUserId: 'me', // Assuming 'me' works, adjust if needed
        status: 'open',
      });

      expect(result.items).toBeDefined();
      // Each card should have the user in assignedUsers (if backend returns this)
    });

    it('should filter cards by date range', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await filterCards(auth, {
        dueDateFrom: '2026-01-01T00:00:00Z',
        dueDateTo: '2026-12-31T23:59:59Z',
      });

      expect(result.items).toBeDefined();
    });

    it('should sort cards by dueDate', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await filterCards(auth, {
        sortBy: 'dueDate',
        sortOrder: 'asc',
        pageSize: 5,
      });

      expect(result.items).toBeDefined();
      // Verify sorting if we have items
      if (result.items.length > 1) {
        for (let i = 1; i < result.items.length; i++) {
          const prev = result.items[i - 1].dueDate;
          const curr = result.items[i].dueDate;
          if (prev && curr) {
            expect(new Date(prev).getTime()).toBeLessThanOrEqual(new Date(curr).getTime());
          }
        }
      }
    });
  });

  describe('Activity - GET /users/{id}/actions', () => {
    it('should get user actions', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      // 'me' is automatically converted to actual user ID by the function
      const result = await getUserActions(auth, {
        userId: 'me',
        pageSize: 10,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('included');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter actions by type', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      // 'me' is automatically converted to actual user ID by the function
      const result = await getUserActions(auth, {
        userId: 'me',
        actionTypes: ['createCard', 'moveCard'],
        pageSize: 10,
      });

      expect(result.items).toBeDefined();
    });
  });

  describe('History - GET /history', () => {
    it('should get system history', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await getHistory(auth, {
        pageSize: 10,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('included');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter history by type', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await getHistory(auth, {
        types: ['action'],
        pageSize: 10,
      });

      expect(result.items).toBeDefined();
    });
  });

  describe('Feed - GET /feed', () => {
    it('should get combined feed', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await getFeed(auth, {
        pageSize: 10,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('included');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter feed by type', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await getFeed(auth, {
        types: ['action'],
        pageSize: 10,
      });

      expect(result.items).toBeDefined();
      result.items.forEach(item => {
        expect(item.type).toBe('action');
      });
    });
  });

  describe('Search Endpoints', () => {
    it('should search users', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await searchUsers(auth, 'am', 5);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should search projects', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await searchProjects(auth, 'Humaani', 5);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should search boards', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await searchBoards(auth, 'Technical', 5);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it.skip('should search cards', async () => {
      // SKIPPED: This endpoint is very slow on pm-dev
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await searchCards(auth, 'test', 5);
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should perform global search', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await globalSearch(auth, {
        query: 'test',
        limit: 5,
      });

      expect(result).toBeDefined();
      // Should have at least one of these properties
      const hasResults = 
        result.projects || 
        result.boards || 
        result.cards || 
        result.users;
      expect(hasResults).toBeDefined();
    });

    it('should filter global search by types', async () => {
      if (!optimizedAvailable) {
        console.log('⏭️  Skipping - endpoint not available');
        return;
      }
      const result = await globalSearch(auth, {
        query: 'test',
        types: ['project', 'card'],
        limit: 3,
      });

      expect(result).toBeDefined();
      // Should only have projects and cards if results exist
    });
  });
});
