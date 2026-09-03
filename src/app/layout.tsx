import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import ToastContainer from '@/components/ui/ToastContainer';
import ThemeInitializer from '@/components/ui/ThemeInitializer';

export const metadata: Metadata = {
  title: 'Nihongo Master - Luyện Từ Vựng & Kanji',
  description: 'Nền tảng học tiếng Nhật toàn diện: Từ vựng & Kanji N5-N1 với phương pháp Lặp lại ngắt quãng (SRS)',
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
        <script dangerouslySetInnerHTML={{ __html: themeBlockingScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
        <ThemeInitializer />
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-10">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
