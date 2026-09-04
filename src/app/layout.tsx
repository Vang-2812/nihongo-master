import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import ToastContainer from '@/components/ui/ToastContainer';
import ThemeInitializer from '@/components/ui/ThemeInitializer';
import SyncInitializer from '@/components/sync/SyncInitializer';

export const metadata: Metadata = {
  title: 'Nihongo Master - Luyện Từ Vựng & Kanji',
  description: 'Nền tảng học tiếng Nhật toàn diện: Từ vựng & Kanji N5-N1 với phương pháp Lặp lại ngắt quãng (SRS)',
  referrer: 'no-referrer',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nihongo Master',
  },
};

const themeBlockingScript = `
  (function() {
    try {
      var stored = localStorage.getItem('nihongo_theme');
      var theme = 'system';
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.state && parsed.state.theme) {
          theme = parsed.state.theme;
        }
      }
      var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="referrer" content="no-referrer" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeBlockingScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
        <ThemeInitializer />
        <SyncInitializer />
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-10">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
