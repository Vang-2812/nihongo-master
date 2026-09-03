'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useSRSStore } from '@/stores/srsStore';
import { resolveCardContent } from '@/lib/cardResolver';
import { getAllVocab, getLessonById, VocabLevel } from '@/lib/vocabData';
import { getKanjiByLevel, KanjiLevel } from '@/lib/kanjiData';
import MultipleChoiceQuiz, { QuizItem } from '@/components/quiz/MultipleChoiceQuiz';
import MatchingGame from '@/components/quiz/MatchingGame';
import WordBuilderQuiz from '@/components/quiz/WordBuilderQuiz';

interface QuizContainerProps {
  mode: string;
}

export default function QuizContainer({ mode }: QuizContainerProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { cards } = useSRSStore();

  const source = searchParams.get('source') || 'level';
  const level = (searchParams.get('level') as VocabLevel | KanjiLevel) || 'N5';
  const lessonId = searchParams.get('lessonId') || 'minna_1';
  const rawCount = parseInt(searchParams.get('count') || '15', 10);
  const count = isNaN(rawCount) || rawCount <= 0 ? 15 : rawCount;
  const direction = (searchParams.get('direction') as 'ja_to_vi' | 'vi_to_ja') || 'ja_to_vi';
  const showKana = searchParams.get('kana') !== 'false';

  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load and assemble question pool
  const { items, fullPool, titleDescription } = useMemo(() => {
    let pool: QuizItem[] = [];
    let desc = '';

    if (source === 'srs') {
      const allSRSCards = Object.values(cards);
      if (allSRSCards.length > 0) {
        pool = allSRSCards.map((card) => {
          const resolved = resolveCardContent(card);
          return {
            id: card.id,
            word: resolved.title,
            reading: resolved.reading,
            meaning: resolved.meaning,
            sinoVietnamese: resolved.sinoVietnamese,
            level: resolved.level,
            type: resolved.cardType,
          };
        });
        desc = `Kho SRS cá nhân (${pool.length} thẻ)`;
      }
    } else if (source === 'lesson') {
      const lesson = getLessonById(lessonId);
      if (lesson && lesson.items.length > 0) {
        pool = lesson.items.map((v) => ({
          id: v.id,
          word: v.word,
          reading: v.reading,
          meaning: v.meaning,
          sinoVietnamese: v.sinoVietnamese,
          level: v.level,
          romaji: v.romaji,
          type: 'vocab',
        }));
        desc = `${lesson.title} (${lesson.bookTitle})`;
      }
    } else {
      const vocabList = getAllVocab()
        .filter((v) => v.level === level)
        .map((v) => ({
          id: `vocab_${v.id}`,
          word: v.word,
          reading: v.reading,
          meaning: v.meaning,
          sinoVietnamese: v.sinoVietnamese,
          level: v.level,
          romaji: v.romaji,
          type: 'vocab' as const,
        }));

      const kanjiList = getKanjiByLevel(level as KanjiLevel).map((k) => ({
        id: `kanji_${k.character}`,
        word: k.character,
        reading: (k.kunyomi || k.onyomi || [])[0] || k.character,
        meaning: k.meaning_vi,
        sinoVietnamese: undefined,
        level: k.level,
        type: 'kanji' as const,
      }));

      pool = [...vocabList, ...kanjiList];
      desc = `Cấp độ JLPT ${level}`;
    }

    if (pool.length === 0) {
      const fallbackVocab = getAllVocab()
        .filter((v) => v.level === 'N5')
        .slice(0, 30)
        .map((v) => ({
          id: `vocab_${v.id}`,
          word: v.word,
          reading: v.reading,
          meaning: v.meaning,
          sinoVietnamese: v.sinoVietnamese,
          level: v.level,
          type: 'vocab' as const,
        }));
      pool = fallbackVocab;
      desc = 'Bộ từ vựng N5 cơ bản';
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return {
      items: selected,
      fullPool: pool,
      titleDescription: desc,
    };
  }, [source, level, lessonId, count, cards, sessionKey]);

  const handleRestart = useCallback(() => {
    setSessionKey((prev) => prev + 1);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  const modeTitles: Record<string, string> = {
    builder: 'Ghép Ký Tự (Word Builder)',
    choice: 'Trắc Nghiệm 4 Đáp Án',
    matching: 'Ghép Thẻ (Matching Game)',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-4 sm:py-8 px-4 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Thoát và đổi chế độ"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu Quiz</span>
        </Link>

        <div className="text-center">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {modeTitles[mode] || 'Luyện Tập Quiz'}
          </h1>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {titleDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tạo lại bộ câu hỏi mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Active Game Mode Component */}
      {mode === 'builder' ? (
        <WordBuilderQuiz
          key={`builder_${sessionKey}`}
          items={items}
          showKana={showKana}
          onRestart={handleRestart}
        />
      ) : mode === 'matching' ? (
        <MatchingGame
          key={`matching_${sessionKey}`}
          items={items}
          pairCount={count <= 8 ? count : 6}
          showKana={showKana}
          onRestart={handleRestart}
        />
      ) : (
        <MultipleChoiceQuiz
          key={`choice_${sessionKey}`}
          items={items}
          allPool={fullPool}
          direction={direction}
          showKana={showKana}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}