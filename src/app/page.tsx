import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Nihongo Master
        </h1>
        <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
        Nền tảng học từ vựng và Kanji tiếng Nhật độc lập, hiện đại và hiệu quả.
      </p>
    </main>
  );
}
