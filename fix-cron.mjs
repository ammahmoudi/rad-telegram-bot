/**
 * Fix Cron Patterns Script
 * Resets job schedules to valid patterns
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_SCHEDULES = {
  'unselected-food-reminder': {
    schedule: '0 22 * * *', // 10 PM daily
    timezone: 'Asia/Tehran',
  },
  'weekly-food-check': {
    schedule: '0 22 * * 5', // Friday 10 PM
    timezone: 'Asia/Tehran',
  },
  'custom-message': {
    schedule: '0 9 * * *', // 9 AM daily
    timezone: 'Asia/Tehran',
  },
};

async function fixCronPatterns() {
  console.log('🔧 Fixing cron patterns in database...\n');

  for (const [jobName, { schedule, timezone }] of Object.entries(VALID_SCHEDULES)) {
    try {
      const existing = await prisma.scheduledJob.findUnique({
        where: { name: jobName },
      });

      if (existing) {
        console.log(`Updating ${jobName}...`);
        await prisma.scheduledJob.update({
          where: { name: jobName },
          data: {
            schedule,
            timezone,
            updatedAt: BigInt(Date.now()),
          },
        });
        console.log(`  ✅ Updated to: ${schedule} (${timezone})\n`);
      } else {
        console.log(`  ℹ️  Job not found: ${jobName}\n`);
      }
    } catch (error) {
      console.error(`  ❌ Error updating ${jobName}:`, error);
    }
  }

  await prisma.$disconnect();
  console.log('✅ All cron patterns fixed!');
}

fixCronPatterns().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
