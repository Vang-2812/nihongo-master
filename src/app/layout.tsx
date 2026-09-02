import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nihongo Master - Luyện Từ Vựng & Kanji',
  description: 'Nền tảng học tiếng Nhật toàn diện: Từ vựng & Kanji N5-N1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
