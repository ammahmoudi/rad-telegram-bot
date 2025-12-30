/**
 * Test file for helper functions
 * Run with: npx tsx test-helpers.ts
 * 
 * Set these environment variables:
 * - PLANKA_BASE_URL
 * - PLANKA_TOKEN
 */

import {
  getUserCards,
  getUserTasks,
  getUserActivity,
  getUserTodayActivity,
  getUserWeekActivity,
  getUserNotifications,
  getProjectStatus,
  getBoardStatus,
  getDailyReportProjects,
  getUserDailyReports,
  getTodayDate,
} from './src/helpers/index.js';

const auth = {
  plankaBaseUrl: process.env.PLANKA_BASE_URL || 'https://pm-dev.rastar.dev',
  accessToken: process.env.PLANKA_TOKEN || '',
};

async function testHelpers() {
  console.log('🧪 Testing Planka Helper Functions\n');
  console.log('Using:', auth.plankaBaseUrl);
  console.log('Token:', auth.accessToken ? `${auth.accessToken.substring(0, 10)}...` : 'NOT SET');
  console.log('');

  if (!auth.accessToken) {
    console.error('❌ PLANKA_TOKEN not set!');
    process.exit(1);
  }

  try {
    // Test 1: Get current user's cards
    console.log('1️⃣ Testing getUserCards (current user)...');
    const myCards = await getUserCards(auth); // No userId = current user
    console.log(`   ✅ Found ${myCards.length} cards`);
    if (myCards.length > 0) {
      const card = myCards[0];
      console.log(`   📝 Sample: "${card.name}" in ${card.projectName} > ${card.boardName}`);
      console.log(`      - Assignees: ${card.assignees.map(a => a.name).join(', ')}`);
      console.log(`      - Tasks: ${card.tasks.completed}/${card.tasks.total} (${card.tasks.percentage.toFixed(0)}%)`);
      console.log(`      - Done: ${card.isDone}`);
    }
    console.log('');

    // Test 2: Get undone cards
    console.log('2️⃣ Testing getUserCards (undone only)...');
    const undoneCards = await getUserCards(auth, undefined, { done: false });
    console.log(`   ✅ Found ${undoneCards.length} undone cards`);
    console.log('');

    // Test 3: Get checklist tasks
    console.log('3️⃣ Testing getUserTasks (current user)...');
    const myTasks = await getUserTasks(auth); // No userId = current user
    console.log(`   ✅ Found ${myTasks.length} tasks`);
    if (myTasks.length > 0) {
      const task = myTasks[0];
      console.log(`   ☑️  Sample: "${task.name}" in card "${task.cardName}"`);
      console.log(`      - Project: ${task.projectName}`);
      console.log(`      - Completed: ${task.isCompleted}`);
    }
    console.log('');

    // Test 4: Today's activity
    console.log('4️⃣ Testing getUserTodayActivity...');
    const todayActivity = await getUserTodayActivity(auth);
    console.log(`   ✅ Found ${todayActivity.length} activities today (${getTodayDate()})`);
    if (todayActivity.length > 0) {
      const activity = todayActivity[0];
      console.log(`   🔔 Sample: ${activity.description}`);
      console.log(`      - Card: ${activity.cardName || 'N/A'}`);
      console.log(`      - Time: ${new Date(activity.timestamp).toLocaleString()}`);
    }
    console.log('');

    // Test 5: This week's activity
    console.log('5️⃣ Testing getUserWeekActivity...');
    const weekActivity = await getUserWeekActivity(auth);
    console.log(`   ✅ Found ${weekActivity.length} activities this week`);
    console.log('');

    // Test 6: Notifications
    console.log('6️⃣ Testing getUserNotifications...');
    const notifications = await getUserNotifications(auth, undefined, { limit: 5 });
    console.log(`   ✅ Found ${notifications.length} recent notifications`);
    if (notifications.length > 0) {
      const notif = notifications[0];
      console.log(`   📬 Sample: Card "${notif.cardName || 'Unknown'}"`);
      console.log(`      - Read: ${notif.isRead}`);
      console.log(`      - Time: ${new Date(notif.createdAt).toLocaleString()}`);
    }
    console.log('');

    // Test 7: Daily report projects
    console.log('7️⃣ Testing getDailyReportProjects...');
    const dailyProjects = await getDailyReportProjects(auth);
    console.log(`   ✅ Found ${dailyProjects.length} daily report projects`);
    if (dailyProjects.length > 0) {
      console.log(`   📊 Projects: ${dailyProjects.map((p: any) => p.name).join(', ')}`);
      
      // Test 8: Get daily reports
      console.log('');
      console.log('8️⃣ Testing getUserDailyReports...');
      const reports = await getUserDailyReports(auth, undefined, { 
        projectId: dailyProjects[0].id,
        startDate: '2024-12-01',
        endDate: getTodayDate(),
      });
      console.log(`   ✅ Found ${reports.length} daily report entries`);
      if (reports.length > 0) {
        const report = reports[0];
        console.log(`   📝 Sample: ${report.date} - "${report.cardName}"`);
        console.log(`      - User: ${report.userName}`);
        console.log(`      - Season: ${report.listName}`);
      }
    }
    console.log('');

    // Test 9: Project status (if we have cards)
    if (myCards.length > 0) {
      const projectId = myCards[0].projectId;
      console.log('9️⃣ Testing getProjectStatus...');
      const projectStatus = await getProjectStatus(auth, projectId);
      console.log(`   ✅ Project: ${projectStatus.projectName}`);
      console.log(`   📊 Progress: ${projectStatus.completionPercentage.toFixed(1)}%`);
      console.log(`   📝 Cards: ${projectStatus.doneCards}/${projectStatus.totalCards} done`);
      console.log(`   📋 Boards: ${projectStatus.boards.length}`);
      console.log('');

      // Test 10: Board status
      const boardId = myCards[0].boardId;
      console.log('🔟 Testing getBoardStatus...');
      const boardStatus = await getBoardStatus(auth, boardId);
      console.log(`   ✅ Board: ${boardStatus.boardName}`);
      console.log(`   📊 Progress: ${boardStatus.completionPercentage.toFixed(1)}%`);
      console.log(`   📝 Cards: ${boardStatus.doneCards}/${boardStatus.totalCards} done`);
      console.log(`   📋 Lists: ${boardStatus.lists.length}`);
      console.log('');
    }

    console.log('✨ All tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testHelpers();
