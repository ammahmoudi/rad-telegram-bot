import type { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';
import './globals.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Panel',
  description: 'Rastar Telegram Bot Admin Panel',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <LanguageProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(30, 41, 59, 0.95)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
