'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LogoutButton from './LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage, t, dir } = useLanguage();
  
  const navItems = [
    { name: t.nav.settings, path: '/', icon: '⚙️' },
    { name: t.nav.users, path: '/users', icon: '👥' },
    { name: t.nav.packs, path: '/packs', icon: '🎭' },
    { name: t.nav.toolLogs || 'Chat Logs', path: '/chat-logs', icon: '🔧' },
  ];
  
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-gray-900 flex" dir={dir}>
      {/* Sidebar - Sticky */}
      <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">{t.nav.title}</h1>
            <button
              onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
              className="px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            >
              {language === 'fa' ? 'EN' : 'فا'}
            </button>
          </div>
          <p className="text-slate-300 text-sm">{t.nav.subtitle}</p>
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
