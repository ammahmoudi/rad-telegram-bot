'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'تنظیمات', path: '/', icon: '⚙️' },
    { name: 'کاربران', path: '/users', icon: '👥' },
    { name: 'پک‌های شخصیتی', path: '/packs', icon: '🎭' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col">
        <div className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white">🤖 پنل مدیریت</h1>
          <p className="text-slate-300 text-sm mt-1">ربات تلگرام Rad</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    pathname === item.path
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-white/20">
          <LogoutButton />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
