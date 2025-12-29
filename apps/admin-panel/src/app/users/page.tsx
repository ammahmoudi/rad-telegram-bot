import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPrisma } from '@rad/shared';
import AdminLayout from '../AdminLayout';
import Image from 'next/image';

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
    admin: { label: 'ادمین', color: 'from-red-500 to-rose-500' },
    manager: { label: 'مدیر', color: 'from-blue-500 to-cyan-500' },
    user: { label: 'کاربر', color: 'from-slate-500 to-slate-600' },
  };
  
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            مدیریت کاربران 👥
          </h1>
          <p className="text-slate-300">
            مشاهده و مدیریت کاربران ربات تلگرام
          </p>
        </div>
        
        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">هیچ کاربری یافت نشد</h3>
            <p className="text-slate-300">
              کاربران پس از شروع گفتگو با ربات در این لیست ظاهر می‌شوند
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">کاربر</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">نقش</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">اتصالات</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">پکیج</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">آخرین فعالیت</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const assignment = assignmentMap.get(user.id);
                    const hasPlankaconnection = plankaSet.has(user.id);
                    const hasRastar = rastarSet.has(user.id);
                    const roleInfo = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user;
                    
                    return (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Profile Image */}
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              {user.photoUrl ? (
                                <Image
                                  src={user.photoUrl}
                                  alt={user.firstName || 'User'}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-white text-lg font-bold">
                                  {(user.firstName || user.username || '?')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            
                            {/* User Info */}
                            <div>
                              <div className="text-white font-medium">
                                {user.firstName || user.username || 'بدون نام'}
                                {user.lastName && ` ${user.lastName}`}
                              </div>
                              <div className="text-slate-400 text-xs">
                                @{user.username || user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 bg-gradient-to-r ${roleInfo.color} text-white text-xs font-medium rounded-full`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {hasPlankaconnection && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30">
                                📋 Planka
                              </span>
                            )}
                            {hasRastar && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                                🍽️ Rastar
                              </span>
                            )}
                            {!hasPlankaconnection && !hasRastar && (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          {assignment ? (
                            <span className="text-purple-300 text-sm">
                              {assignment.pack.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">پیش‌فرض</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className="text-slate-300 text-sm">
                            {user.lastSeenAt
                              ? new Date(Number(user.lastSeenAt)).toLocaleDateString('fa-IR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <button
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-all"
                          >
                            ویرایش
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
