/**
 * Integration Tests for Helper Functions
 * 
 * These tests use REAL authentication and make REAL API calls.
 * Run with: INTEGRATION_TEST=1 npm test integration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { PlankaAuth } from '../../types/index.js';
import {
  getUserCards,
} from '../user-tasks.js';
import {
  getUserNotifications,
  getUserActions,
  getUserActivitySummary,
} from '../user-activity.js';
import {
  getProjectStatus,
  getBoardStatus,
} from '../project-status.js';
import {
  getDailyReportProjects,
  getUserDailyReports,
  getMissingDailyReports,
  getTodayDate,
} from '../daily-reports.js';

// Skip these tests unless INTEGRATION_TEST env var is set
describe.skipIf(!process.env.INTEGRATION_TEST)('Helper Functions - Integration Tests', () => {
  let auth: PlankaAuth;

  beforeAll(async () => {
    // Real authentication
    const baseUrl = process.env.PLANKA_BASE_URL || 'https://pm-dev.rastar.dev';
    const username = 'am_mahmoudi';
    const password = 'Helia@24081379';

    // Authenticate
    const response = await fetch(`${baseUrl}/api/access-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: username, password }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: any = await response.json();
    
    auth = {
      plankaBaseUrl: baseUrl,
      accessToken: data.item,
    };
  }, 60000);

  describe('User Tasks', () => {
    it('should get current user cards', async () => {
      const cards = await getUserCards(auth);

      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
      
      if (cards.length > 0) {
        const card = cards[0];
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('name');
        expect(card).toHaveProperty('projectName');
        expect(card).toHaveProperty('boardName');
        expect(card).toHaveProperty('listName');
        expect(card).toHaveProperty('assignees');
        expect(card).toHaveProperty('tasks');
        expect(card).toHaveProperty('isDone');
        
        console.log(`   ✅ Found ${cards.length} cards`);
        console.log(`   📝 Sample: "${card.name}" in ${card.projectName}`);
      } else {
        console.log('   ℹ️  No cards found for user');
      }
    }, 30000);

    it('should filter undone cards', async () => {

      const undoneCards = await getUserCards(auth, undefined, { done: false });

      expect(undoneCards).toBeDefined();
      expect(Array.isArray(undoneCards)).toBe(true);
      
      undoneCards.forEach(card => {
        expect(card.isDone).toBe(false);
      });

      console.log(`   ✅ Found ${undoneCards.length} undone cards`);
    }, 30000);
  });

  describe('User Activity', () => {
    it('should get user notifications', async () => {
      console.log('🔍 Testing getUserNotifications...');
      const notifications = await getUserNotifications(auth, undefined, { limit: 10 });

      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);

      if (notifications.length > 0) {
        const notif = notifications[0];
        expect(notif).toHaveProperty('id');
        expect(notif).toHaveProperty('isRead');
        expect(notif).toHaveProperty('createdAt');

        console.log(`   ✅ Found ${notifications.length} notifications`);
      } else {
        console.log('   ℹ️  No notifications found');
      }
    }, 30000);

    it('should get user actions for today', async () => {
      const today = getTodayDate();
      const activities = await getUserActions(auth, undefined, {
        startDate: `${today}T00:00:00Z`,
        endDate: `${today}T23:59:59Z`,
      });

      expect(activities).toBeDefined();
      expect(Array.isArray(activities)).toBe(true);

      if (activities.length > 0) {
        const activity = activities[0];
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('timestamp');
        expect(activity).toHaveProperty('description');

        console.log(`   ✅ Found ${activities.length} actions today (${today})`);
        console.log(`   🔔 Sample: ${activity.description}`);
      } else {
        console.log(`   ℹ️  No actions today (${today})`);
      }
    }, 30000);

    it('should get activity summary for past week', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const summary = await getUserActivitySummary(auth, undefined, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('actions');
      expect(summary).toHaveProperty('notifications');
      expect(Array.isArray(summary.actions)).toBe(true);
      expect(Array.isArray(summary.notifications)).toBe(true);

      console.log(`   ✅ Found ${summary.actions.length} actions and ${summary.notifications.length} notifications this week`);
    }, 30000);
  });

  describe('Project Status', () => {
    it('should get project status when cards exist', async () => {
      console.log('🔍 Testing getProjectStatus...');
      
      // First get user cards to find a project
      const cards = await getUserCards(auth);
      
      if (cards.length === 0) {
        console.log('   ⏭️  Skipping (no cards found)');
        return;
      }

      const projectId = cards[0].projectId;
      const status = await getProjectStatus(auth, projectId);

      expect(status).toBeDefined();
      expect(status).toHaveProperty('projectName');
      expect(status).toHaveProperty('boards');
      expect(status).toHaveProperty('totalCards');
      expect(status).toHaveProperty('doneCards');
      expect(status).toHaveProperty('completionPercentage');

      console.log(`   ✅ Project: ${status.projectName}`);
      console.log(`   📊 Progress: ${status.completionPercentage.toFixed(1)}%`);
      console.log(`   📝 Cards: ${status.doneCards}/${status.totalCards} done`);
    }, 60000);

    it('should get board status when cards exist', async () => {
      const cards = await getUserCards(auth);
      
      if (cards.length === 0) {
        console.log('   ⏭️  Skipping (no cards found)');
        return;
      }

      const boardId = cards[0].boardId;
      const status = await getBoardStatus(auth, boardId);

      expect(status).toBeDefined();
      expect(status).toHaveProperty('boardName');
      expect(status).toHaveProperty('lists');
      expect(status).toHaveProperty('totalCards');
      expect(status).toHaveProperty('completionPercentage');

      console.log(`   ✅ Board: ${status.boardName}`);
      console.log(`   📊 Progress: ${status.completionPercentage.toFixed(1)}%`);
      console.log(`   📋 Lists: ${status.lists.length}`);
    }, 60000);
  });

  describe('Daily Reports', () => {
    it('should get daily report projects', async () => {
      const projects = await getDailyReportProjects(auth);

      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);

      if (projects.length > 0) {
        console.log(`   ✅ Found ${projects.length} daily report projects`);
        projects.forEach((p: any) => {
          expect(p.name.toLowerCase()).toContain('daily report');
        });
      } else {
        console.log('   ℹ️  No daily report projects found');
      }
    }, 30000);

    it('should get user daily reports with summary', async () => {
      console.log('🔍 Testing getUserDailyReports with summary...');
      
      const dailyProjects = await getDailyReportProjects(auth);
      
      if (dailyProjects.length === 0) {
        console.log('   ⏭️  Skipping (no daily report projects)');
        return;
      }

      // Test with boards included
      console.log(`   📋 Project boards:`);
      dailyProjects[0].boards.forEach((b: any) => {
        console.log(`      - ${b.name}`);
      });

      const result = await getUserDailyReports(auth, undefined, {
        projectId: dailyProjects[0].id,
        startDate: '2024-12-01',
        endDate: getTodayDate(),
        includeSummary: true,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray((result as any).entries)).toBe(true);

      const entries = (result as any).entries;
      const summary = (result as any).summary;

      if (entries.length > 0) {
        const report = entries[0];
        expect(report).toHaveProperty('date');
        expect(report).toHaveProperty('cardName');
        expect(report).toHaveProperty('userName');
        expect(report).toHaveProperty('content');

        console.log(`   ✅ Found ${entries.length} daily report entries`);
        console.log(`   📝 Latest: ${report.date} by ${report.userName}`);
        console.log(`   📊 Summary: ${summary.totalReports} reports, ${summary.missingDates.length} missing dates`);
      } else {
        console.log('   ℹ️  No daily reports found in date range');
      }
    }, 60000);

    it('should check for missing daily reports', async () => {
      console.log('🔍 Testing getMissingDailyReports...');
      
      const dailyProjects = await getDailyReportProjects(auth);
      
      if (dailyProjects.length === 0) {
        console.log('   ⏭️  Skipping (no daily report projects)');
        return;
      }

      // Check last 7 days (excluding weekends)
      const endDate = getTodayDate();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];

      const missing = await getMissingDailyReports(auth, startDateStr, endDate, {
        includeWeekends: false,
      });

      expect(missing).toBeDefined();
      expect(Array.isArray(missing)).toBe(true);

      if (missing.length > 0) {
        console.log(`   ✅ Found ${missing.length} users with missing reports`);
        missing.forEach(user => {
          console.log(`   👤 ${user.userName}: ${user.missingDates.length} missing dates`);
          if (user.missingDates.length <= 3) {
            console.log(`      Missing: ${user.missingDates.join(', ')}`);
          }
        });
      } else {
        console.log('   ✅ All users have complete reports!');
      }
    }, 60000);
  });
});
