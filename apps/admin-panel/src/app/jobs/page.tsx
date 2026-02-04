import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPrisma } from '@rad/shared';
import AdminLayout from '../AdminLayout';
import { JobsPageClient } from '@/components/JobsPageClient';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  const prisma = getPrisma();
  
  // Get job stats
  const [totalJobs, enabledJobs, recentExecutions] = await Promise.all([
    prisma.scheduledJob.count(),
    prisma.scheduledJob.count({ where: { enabled: true } }),
    prisma.jobExecution.count({
      where: {
        startedAt: { gte: BigInt(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  
  // Get success rate for last 24 hours
  const successfulExecutions = await prisma.jobExecution.count({
    where: {
      startedAt: { gte: BigInt(Date.now() - 24 * 60 * 60 * 1000) },
      status: 'success',
    },
  });
  
  const successRate = recentExecutions > 0
    ? Math.round((successfulExecutions / recentExecutions) * 100)
    : 100;
  
  return (
    <AdminLayout>
      <JobsPageClient
        totalJobs={totalJobs}
        enabledJobs={enabledJobs}
        recentExecutions={recentExecutions}
        successRate={successRate}
      />
    </AdminLayout>
  );
}
