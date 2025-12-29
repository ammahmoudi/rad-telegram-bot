import type { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'react-hot-toast';

export const runtime = 'nodejs';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      border: "hsl(214.3 31.8% 91.4%)",
                      input: "hsl(214.3 31.8% 91.4%)",
                      ring: "hsl(221.2 83.2% 53.3%)",
                      background: "hsl(0 0% 100%)",
                      foreground: "hsl(222.2 84% 4.9%)",
                      primary: {
                        DEFAULT: "hsl(221.2 83.2% 53.3%)",
                        foreground: "hsl(210 40% 98%)",
                      },
                      secondary: {
                        DEFAULT: "hsl(210 40% 96.1%)",
                        foreground: "hsl(222.2 47.4% 11.2%)",
                      },
                      muted: {
                        DEFAULT: "hsl(210 40% 96.1%)",
                        foreground: "hsl(215.4 16.3% 46.9%)",
                      },
                      accent: {
                        DEFAULT: "hsl(210 40% 96.1%)",
                        foreground: "hsl(222.2 47.4% 11.2%)",
                      },
                      destructive: {
                        DEFAULT: "hsl(0 84.2% 60.2%)",
                        foreground: "hsl(210 40% 98%)",
                      },
                    },
                  }
                }
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Inter', system-ui, sans-serif; }
        `}</style>
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
