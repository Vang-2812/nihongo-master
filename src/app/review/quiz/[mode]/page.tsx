import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import QuizContainer from './QuizContainer';

export function generateStaticParams() {
  return [
    { mode: 'builder' },
    { mode: 'choice' },
    { mode: 'matching' },
  ];
}

export function generateMetadata({
  params,
}: {
  params: { mode: string };
}): Metadata {
  const titles: Record<string, string> = {
    builder: 'Ghép ký tự tạo từ Word Builder - Nihongo Master',
    choice: 'Trắc nghiệm 4 đáp án - Nihongo Master',
    matching: 'Ghép thẻ Match Pairs - Nihongo Master',
  };

  return {
    title: (titles[params.mode] || 'Luyện tập Quiz') + ' | Nihongo Master',
    description: 'Thử thách và củng cố kiến thức từ vựng và Hán tự tiếng Nhật qua các trò chơi tương tác thú vị.',
  };
}

export default function QuizModeDynamicPage({
  params,
}: {
  params: { mode: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-mutedForeground">[ PREPARING QUIZ ARCHIVE... ]</p>
          </div>
        </div>
      }
    >
      <QuizContainer mode={params.mode} />
    </Suspense>
  );
}