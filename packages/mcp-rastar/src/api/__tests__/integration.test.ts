/**
 * Integration Tests for Rastar API
 * 
 * These tests use REAL authentication and make REAL API calls.
 * They follow the pattern:
 * 1. Authenticate
 * 2. Test read operations (non-destructive)
 * 3. Test create/delete operations (with cleanup)
 * 
 * To run: INTEGRATION_TEST=1 npm test integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RastarAuth } from '../../types/index.js';
import { login } from '../auth.js';
import {
  getMenuSchedule,
  getUserMenuSelections,
  createMenuSelection,
  deleteMenuSelection,
} from '../menu.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env.test') });

// Helper: Retry function for network issues
async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      console.log(`   ⚠ Retry ${i + 1}/${maxRetries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Should not reach here');
}

// Helper: Add delay between operations
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Skip these tests unless INTEGRATION_TEST env var is set
describe.skipIf(!process.env.INTEGRATION_TEST)('Rastar Integration Tests', () => {
  let auth: RastarAuth;
  let userId: string;
  
  // Resources to clean up
  const cleanup: {
    selections: string[];
  } = {
    selections: [],
  };

  beforeAll(async () => {
    // Get credentials from environment
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    const baseUrl = process.env.RASTAR_BASE_URL || 'https://my-api.rastar.company';

    if (!email || !password) {
      throw new Error(
        'Missing TEST_EMAIL or TEST_PASSWORD in .env.test file. ' +
        'Copy .env.test.example to .env.test and fill in your credentials.'
      );
    }

    console.log(`\n🔐 Authenticating with ${email}...`);

    // Authenticate
    const tokenResponse = await retry(() => login(email, password));
    
    auth = {
      accessToken: tokenResponse.access_token,
    };
    
    userId = tokenResponse.user.id;
    
    console.log(`✅ Authenticated as user: ${userId}\n`);
  }, 30000); // 30 second timeout for auth

  afterAll(async () => {
    if (cleanup.selections.length > 0) {
      console.log('\n🧹 Cleaning up test resources...');
      
      for (const selectionId of cleanup.selections) {
        try {
          await deleteMenuSelection(auth, selectionId);
          console.log(`   ✓ Deleted selection: ${selectionId}`);
        } catch (error: any) {
          console.log(`   ⚠ Failed to delete selection ${selectionId}: ${error.message}`);
        }
      }
      
      console.log('✅ Cleanup completed\n');
    }
  }, 15000); // 15 second timeout for cleanup

  // ==================== READ OPERATIONS ====================
  describe('Menu Schedule API (Read)', () => {
    it('should fetch the menu schedule', async () => {
      const schedule = await retry(() => getMenuSchedule(auth));
      
      expect(Array.isArray(schedule)).toBe(true);
      
      if (schedule.length > 0) {
        const item = schedule[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('menu_item_id');
        
        // Check nested menu_item if present
        if (item.menu_item) {
          expect(item.menu_item).toHaveProperty('id');
          expect(item.menu_item).toHaveProperty('name');
        }
        
        console.log(`   ✓ Found ${schedule.length} menu items in schedule`);
      } else {
        console.log('   ℹ No menu schedule found (empty database)');
      }
    });
  });

  describe('User Menu Selections API (Read)', () => {
    it('should fetch user menu selections', async () => {
      const selections = await retry(() => getUserMenuSelections(auth, userId));
      
      expect(Array.isArray(selections)).toBe(true);
      
      if (selections.length > 0) {
        const selection = selections[0];
        expect(selection).toHaveProperty('id');
        expect(selection).toHaveProperty('user_id');
        expect(selection).toHaveProperty('menu_schedule_id');
        expect(selection).toHaveProperty('created_at');
        
        console.log(`   ✓ Found ${selections.length} menu selection(s)`);
      } else {
        console.log('   ℹ No menu selections found for this user');
      }
    });
  });

  // ==================== CREATE & DELETE OPERATIONS ====================
  describe('Menu Selection API (Create & Delete)', () => {
    let testScheduleId: string | null = null;

    beforeAll(async () => {
      // Get a menu schedule item to use for testing
      const schedule = await getMenuSchedule(auth);
      if (schedule.length > 0) {
        testScheduleId = schedule[0].id;
        console.log(`   Using schedule ID for testing: ${testScheduleId}`);
      }
    });

    it('should create and delete a menu selection', async () => {
      if (!testScheduleId) {
        console.log('   ⚠ Skipping: No menu schedule available for testing');
        return;
      }

      // CREATE
      console.log('   Creating menu selection...');
      const newSelection = await retry(() => 
        createMenuSelection(auth, userId, testScheduleId!)
      );
      
      expect(newSelection).toHaveProperty('id');
      expect(newSelection.user_id).toBe(userId);
      expect(newSelection.menu_schedule_id).toBe(testScheduleId);
      
      const selectionId = newSelection.id;
      cleanup.selections.push(selectionId);
      
      console.log(`   ✓ Created selection: ${selectionId}`);
      
      await delay(500);
      
      // VERIFY it was created
      const allSelections = await getUserMenuSelections(auth, userId);
      const foundSelection = allSelections.find(s => s.id === selectionId);
      expect(foundSelection).toBeDefined();
      
      await delay(500);
      
      // DELETE
      console.log('   Deleting menu selection...');
      await retry(() => deleteMenuSelection(auth, selectionId));
      
      // Remove from cleanup since we already deleted it
      cleanup.selections = cleanup.selections.filter(id => id !== selectionId);
      
      console.log(`   ✓ Deleted selection: ${selectionId}`);
      
      await delay(500);
      
      // VERIFY it was deleted
      const selectionsAfterDelete = await getUserMenuSelections(auth, userId);
      const deletedSelection = selectionsAfterDelete.find(s => s.id === selectionId);
      expect(deletedSelection).toBeUndefined();
    });

    it('should handle duplicate selection creation', async () => {
      if (!testScheduleId) {
        console.log('   ⚠ Skipping: No menu schedule available for testing');
        return;
      }

      // Create first selection
      const selection1 = await createMenuSelection(auth, userId, testScheduleId);
      cleanup.selections.push(selection1.id);
      
      await delay(500);
      
      // Try to create duplicate (might fail or succeed depending on DB constraints)
      try {
        const selection2 = await createMenuSelection(auth, userId, testScheduleId);
        cleanup.selections.push(selection2.id);
        
        // If it succeeds, we should have two different IDs
        expect(selection2.id).toBeDefined();
        console.log('   ℹ Duplicate selections are allowed');
      } catch (error: any) {
        // If it fails, that's also valid behavior
        console.log('   ℹ Duplicate selections are prevented by database');
        expect(error.message).toBeTruthy();
      }
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should handle invalid menu schedule ID', async () => {
      await expect(
        createMenuSelection(auth, userId, 'invalid-schedule-id')
      ).rejects.toThrow();
    });

    it('should handle deletion of non-existent selection', async () => {
      // Deleting non-existent resource should either succeed (no-op) or fail gracefully
      try {
        await deleteMenuSelection(auth, '00000000-0000-0000-0000-000000000000');
        console.log('   ℹ Deletion of non-existent resource succeeded (no-op)');
      } catch (error: any) {
        console.log('   ℹ Deletion of non-existent resource failed as expected');
        expect(error.message).toBeTruthy();
      }
    });

    it('should handle invalid access token', async () => {
      const badAuth: RastarAuth = {
        accessToken: 'invalid-token-12345',
      };

      await expect(getMenuSchedule(badAuth)).rejects.toThrow();
    });
  });
});
