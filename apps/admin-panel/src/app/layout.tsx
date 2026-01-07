import type { ReactNode } from 'react';
import { ClientLayout } from './ClientLayout';
import './globals.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata = {
  title: 'Admin Panel',
  description: 'Rastar Telegram Bot Admin Panel',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
