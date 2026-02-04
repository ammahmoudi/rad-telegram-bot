import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const jobs = await prisma.scheduledJob.findMany();
  console.log('\n📋 Scheduled Jobs in Database:\n');
  
  if (jobs.length === 0) {
    console.log('No jobs found.');
  } else {
    jobs.forEach(job => {
      console.log(`Job: ${job.name}`);
      console.log(`  Schedule: ${job.schedule}`);
      console.log(`  Enabled: ${job.enabled}`);
      
      // Validate cron
      const parts = job.schedule.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        console.log(`  ❌ ERROR: Invalid format - has ${parts.length} parts (need 5 or 6)`);
      } else {
        const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
        console.log(`  Parts: minute=${minute} hour=${hour} day=${dayOfMonth} month=${month} dow=${dayOfWeek}`);
        
        // Check for invalid values
        if (month.includes('14')) {
          console.log(`  ❌ ERROR: Invalid month value (contains 14, max is 12)`);
        }
      }
      console.log('');
    });
  }
} catch (error) {
  console.error('❌ Error querying database:', error.message);
} finally {
  await prisma.$disconnect();
}
