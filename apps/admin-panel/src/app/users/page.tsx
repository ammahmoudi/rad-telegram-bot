import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPrisma } from '@rad/shared';
import AdminLayout from '../AdminLayout';
import { UsersPageHeader } from '@/components/UsersPageHeader';
import { UsersClient } from '@/components/UsersClient';

export default async function UsersPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  const prisma = getPrisma();
  
  // Get all users with their pack assignments
  const users = await prisma.telegramUser.findMany({
    orderBy: { lastSeenAt: 'desc' },
  });
  
  // Get pack assignments
  const assignments = await prisma.userPackAssignment.findMany({
    include: {
      pack: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  // Get connection statuses
  const plankaTokens = await prisma.plankaToken.findMany({
    select: { telegramUserId: true },
  });
  const rastarTokens = await prisma.rastarToken.findMany({
    select: { telegramUserId: true },
  });
  
  const plankaSet = new Set(plankaTokens.map(t => t.telegramUserId));
  const rastarSet = new Set(rastarTokens.map(t => t.telegramUserId));
  const assignmentMap = new Map(assignments.map(a => [a.telegramUserId, a]));
  
  // Role badges
  const roleConfig = {
    admin: { label: 'Admin', color: 'from-red-500 to-rose-500' },
    manager: { label: 'Manager', color: 'from-blue-500 to-cyan-500' },
    user: { label: 'User', color: 'from-slate-500 to-slate-600' },
  };
  
  return (
    <AdminLayout>
      <div className="p-8">
        <UsersPageHeader />
        <UsersClient 
          users={users}
          roleConfig={roleConfig}
          assignmentMap={assignmentMap}
          plankaSet={plankaSet}
          rastarSet={rastarSet}
        />
      </div>
    </AdminLayout>
  );
}
