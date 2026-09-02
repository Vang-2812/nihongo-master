import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import ToastContainer from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'Nihongo Master - Luyện Từ Vựng & Kanji',
  description: 'Nền tảng học tiếng Nhật toàn diện: Từ vựng & Kanji N5-N1 với phương pháp Lặp lại ngắt quãng (SRS)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
        <Navbar />
        <main className="flex-1 pb-20 lg:pb-10">
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
