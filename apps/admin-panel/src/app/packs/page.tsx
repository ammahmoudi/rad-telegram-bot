import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPrisma } from '@rad/shared';
import AdminLayout from '../AdminLayout';
import Link from 'next/link';

export default async function PacksPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  const prisma = getPrisma();
  
  // Get all character packs
  const packs = await prisma.characterPack.findMany({
    include: {
      _count: {
        select: {
          messages: true,
          userAssignments: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              پکیج‌های کاراکتر 🎭
            </h1>
            <p className="text-slate-300">
              مدیریت پکیج‌های شخصیتی ربات
            </p>
          </div>
          <Link
            href="/packs/new"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <span>➕</span>
            <span>پکیج جدید</span>
          </Link>
        </div>
        
        {/* Packs Grid */}
        {packs.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-bold text-white mb-2">هیچ پکیجی وجود ندارد</h3>
            <p className="text-slate-300 mb-6">
              اولین پکیج کاراکتر خود را ایجاد کنید
            </p>
            <Link
              href="/packs/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all"
            >
              ➕ ساخت پکیج جدید
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all group"
              >
                {/* Pack Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                      {pack.name}
                    </h3>
                    {pack.description && (
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  {pack.isDefault && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                      پیش‌فرض
                    </span>
                  )}
                </div>
                
                {/* Pack Stats */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>💬</span>
                    <span>{pack._count.messages} پیام</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span>👥</span>
                    <span>{pack._count.userAssignments} کاربر</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/packs/${pack.id}`}
                    className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-center rounded-lg transition-all font-medium"
                  >
                    ویرایش
                  </Link>
                  <button
                    className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                    title="حذف پکیج"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
