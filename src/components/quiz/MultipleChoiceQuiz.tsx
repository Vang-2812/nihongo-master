'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Home,
  Check,
  X,
  Dices,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';
import { useSRSStore } from '@/stores/srsStore';
import ProgressBar from '@/components/ui/ProgressBar';
import { selectDistractors } from '@/lib/distractorSelector';
import { getAllVocab } from '@/lib/vocabData';
import { getAllKanji, parseKanjiMeaning } from '@/lib/kanjiData';
import { reinsertQuestion } from '@/lib/quizQueue';

export interface QuizItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  sinoVietnamese?: string;
  level?: string;
  romaji?: string;
  type?: 'vocab' | 'kanji';
}

export interface MultipleChoiceQuizProps {
  items: QuizItem[];
  allPool?: QuizItem[];
  globalPool?: QuizItem[];
  title?: string;
  subtitle?: string;
  direction?: 'ja_to_vi' | 'vi_to_ja' | 'mixed';
  showKana?: boolean;
  autoPlayAudio?: boolean;
  onRestart?: () => void;
  onExit?: () => void;
  className?: string;
}

interface QuestionHistory {
  item: QuizItem;
  selectedMeaning: string;
  correctMeaning: string;
  isCorrect: boolean;
}

export const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({
  items,
  allPool,
  globalPool: propGlobalPool,
  title = 'Trắc Nghiệm 4 Đáp Án',
  subtitle = 'Chọn đáp án chính xác cho từ vựng / Hán tự',
  direction = 'ja_to_vi',
  showKana = true,
  autoPlayAudio,
  onRestart,
  onExit,
  className = '',
}) => {
  const { addXp, autoPlayAudio: globalAutoPlay } = useSRSStore();
  const [autoPlay, setAutoPlay] = useState<boolean>(
    autoPlayAudio !== undefined ? autoPlayAudio : (globalAutoPlay !== undefined ? globalAutoPlay : true)
  );

  const [queue, setQueue] = useState<QuizItem[]>(() => [...items]);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => new Set());
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(() => new Set());

  const totalUniqueItems = useMemo(() => new Set(items.map((i) => i.id)).size, [items]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [history, setHistory] = useState<QuestionHistory[]>([]);

  // Sync queue if items prop changes
  useEffect(() => {
    setQueue([...items]);
    setMasteredIds(new Set());
    setAttemptedIds(new Set());
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setIsFinished(false);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    setEarnedXp(0);
    setHistory([]);
  }, [items]);

  // Pool of all items for generating distractors
  const pool = useMemo(() => {
    return allPool && allPool.length >= 4 ? allPool : items;
  }, [allPool, items]);

  const currentItem = queue[currentIndex];

  // Memoized global candidate pool for smart distractors
  const effectiveGlobalPool = useMemo<QuizItem[]>(() => {
    if (propGlobalPool && propGlobalPool.length > 0) return propGlobalPool;
    const isKanji = currentItem?.type === 'kanji' || items[0]?.type === 'kanji';
    if (isKanji) {
      return getAllKanji().map((k) => {
        const parsed = parseKanjiMeaning(k.meaning_vi, k.character);
        return {
          id: `global_kanji_${k.character}`,
          word: k.character,
          reading: (k.onyomi || k.kunyomi || [])[0] || k.character,
          meaning: parsed.meaning || k.meaning_vi || '',
          sinoVietnamese: parsed.sinoVietnamese,
          level: k.level,
          type: 'kanji' as const,
        };
      });
    }
    return getAllVocab().map((v) => ({
      id: `global_vocab_${v.id}`,
      word: v.word,
      reading: v.reading,
      meaning: v.meaning,
      sinoVietnamese: v.sinoVietnamese,
      level: v.level,
      type: 'vocab' as const,
    }));
  }, [propGlobalPool, currentItem?.type, items]);

  // Dynamic direction per question when 'mixed' is selected
  const activeDirection = useMemo<'ja_to_vi' | 'vi_to_ja'>(() => {
    if (direction === 'vi_to_ja') return 'vi_to_ja';
    if (direction === 'ja_to_vi') return 'ja_to_vi';
    return currentIndex % 2 === 0 ? 'ja_to_vi' : 'vi_to_ja';
  }, [direction, currentIndex]);

  // Auto-play audio for ja_to_vi direction as soon as the question appears
  useEffect(() => {
    if (autoPlay && activeDirection === 'ja_to_vi' && currentItem && !isFinished && !isChecked) {
      const timer = setTimeout(() => {
        speakJapanese(currentItem.word);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, activeDirection, autoPlay, isFinished, isChecked]);

  // Helper to format options based on direction and showKana
  const getOptionLabel = useCallback(
    (item: QuizItem) => {
      if (activeDirection === 'vi_to_ja') {
        if (showKana && item.reading && item.reading !== item.word) {
          return `${item.word} (${item.reading})`;
        }
        return item.word;
      }
      return item.meaning.trim();
    },
    [activeDirection, showKana]
  );

  const correctTarget = useMemo(() => {
    if (!currentItem) return '';
    return getOptionLabel(currentItem);
  }, [currentItem, getOptionLabel]);

  // Generate 4 smart distractor options for the current question
  const currentOptions = useMemo(() => {
    if (!currentItem) return [];

    const target = getOptionLabel(currentItem);
    const fallbackList =
      activeDirection === 'vi_to_ja'
        ? ['ことば A', 'ことば B', 'ことば C']
        : ['Nghĩa khác A', 'Nghĩa khác B', 'Nghĩa khác C'];

    const chosenDistractors = selectDistractors(
      currentItem,
      pool,
      effectiveGlobalPool,
      {
        count: 3,
        getOptionLabel,
        fallbackDistractors: fallbackList,
      }
    );

    // Combine target and 3 distractors, then shuffle
    const allFour = [target, ...chosenDistractors].sort(
      () => Math.random() - 0.5
    );
    return allFour;
  }, [currentItem, pool, effectiveGlobalPool, activeDirection, getOptionLabel]);

  // Handle Option Selection
  const handleSelectOption = useCallback(
    (option: string) => {
      if (isChecked || !currentItem) return;

      setSelectedOption(option);
      setIsChecked(true);

      const isCorrect = option === correctTarget;
      const isFirstAttempt = !attemptedIds.has(currentItem.id);

      setAttemptedIds((prev) => {
        const next = new Set(prev);
        next.add(currentItem.id);
        return next;
      });

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak((prev) => Math.max(prev, newStreak));

        setMasteredIds((prev) => {
          const next = new Set(prev);
          next.add(currentItem.id);
          return next;
        });

        if (isFirstAttempt) {
          setScore((prev) => prev + 1);
        }

        setEarnedXp((prev) => prev + 10);
        addXp(10);
      } else {
        setStreak(0);

        // Re-insert this question into the remaining queue at a random position
        setQueue((prevQueue) => reinsertQuestion(prevQueue, currentIndex, currentItem, 2));
      }

      // Automatically pronounce the correct answer's Japanese word upon selection
      if (autoPlay) {
        speakJapanese(currentItem.word);
      }

      // Unified SRS SM-2 Record & sync to vocabStore (only on first attempt)
      if (isFirstAttempt) {
        try {
          useSRSStore
            .getState()
            .recordReview(
              currentItem.type || 'vocab',
              currentItem.id,
              isCorrect ? 3 : 1,
              (currentItem.level as any) || 'N5'
            );
        } catch (err) {
          // ignore
        }
      }

      setHistory((prev) => [
        ...prev,
        {
          item: currentItem,
          selectedMeaning: option,
          correctMeaning: correctTarget,
          isCorrect,
        },
      ]);
    },
    [isChecked, currentItem, correctTarget, streak, addXp, autoPlay, currentIndex, attemptedIds]
  );

  // Next Question
  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      if (typeof window !== 'undefined') {
        try {
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [currentIndex, queue.length]);

  // Keyboard Shortcuts (1, 2, 3, 4, Enter, Space)
  useEffect(() => {
    if (isFinished || !currentItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!isChecked) {
        if (e.key === '1' && currentOptions[0]) handleSelectOption(currentOptions[0]);
        else if (e.key === '2' && currentOptions[1]) handleSelectOption(currentOptions[1]);
        else if (e.key === '3' && currentOptions[2]) handleSelectOption(currentOptions[2]);
        else if (e.key === '4' && currentOptions[3]) handleSelectOption(currentOptions[3]);
      } else {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, currentItem, isChecked, currentOptions, handleSelectOption, handleNext]);

  // Restart Quiz
  const handleRestartInternal = () => {
    setQueue([...items]);
    setMasteredIds(new Set());
    setAttemptedIds(new Set());
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setStreak(0);
    setScore(0);
    setEarnedXp(0);
    setShowHint(false);
    setHistory([]);
    setIsFinished(false);
    if (onRestart) onRestart();
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 border border-stone-200 bg-white rounded-none shadow-sm">
        <p className="font-sans text-sm text-stone-800">KHÔNG CÓ CÂU HỎI NÀO TRONG BỘ BÀI NÀY</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone-900 bg-stone-900 text-white font-sans text-xs uppercase font-medium hover:bg-stone-800 transition-colors duration-100 rounded-none shadow-xs"
        >
          <Dices className="w-4 h-4" />
          <span>MENU QUIZ</span>
        </Link>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isFinished) {
    const accuracy = totalUniqueItems > 0 ? Math.round((score / totalUniqueItems) * 100) : 100;

    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
        {/* Editorial Title Banner */}
        <div className="text-center space-y-2 pb-6 border-b border-stone-200">
          <div className="font-mono text-xs uppercase tracking-widest text-stone-500">
            {masteredIds.size >= totalUniqueItems
              ? 'HOÀN THÀNH 100% BỘ CÂU HỎI'
              : 'HOÀN THÀNH BỘ CÂU HỎI TRẮC NGHIỆM'}
          </div>
          <h1 className="font-serif font-light text-4xl sm:text-6xl text-stone-900 tracking-tight uppercase">
            MULTIPLE CHOICE COMPLETED
          </h1>
          <p className="font-serif text-lg sm:text-2xl text-stone-700 tracking-widest">
            {masteredIds.size}/{totalUniqueItems} TỪ ĐÃ NẮM VỮNG
          </p>
          <p className="font-sans text-xs uppercase tracking-wider text-stone-500 mt-1 font-medium">
            ĐÚNG NGAY LẦN ĐẦU: {score}/{totalUniqueItems} ({accuracy}%) · TỔNG SỐ LƯỢT LÀM: {history.length}
          </p>
        </div>

        {/* 4 Core Stats Grid with 1px stone borders and light serif numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 text-center bg-white">
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
              ĐÃ THUỘC
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
              {masteredIds.size}/{totalUniqueItems}
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              TỪ VỰNG
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
              ĐỘ CHÍNH XÁC LẦN 1
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
              {accuracy}%
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              CHÍNH XÁC
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
              CHUỖI CAO NHẤT
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
              {maxStreak}
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              LIÊN TIẾP
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
              ĐIỂM THƯỞNG
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
              +{earnedXp}
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
              XP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestartInternal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-300 bg-white text-stone-800 font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>LÀM LẠI BỘ NÀY</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-300 bg-white text-stone-800 font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <Dices className="w-4 h-4" />
            <span>ĐỔI CHẾ ĐỘ QUIZ</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-900 bg-stone-900 text-white font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>TRANG CHỦ</span>
          </Link>
        </div>

        {/* Question Review List */}
        <div className="border border-stone-200 bg-white p-5 sm:p-6 rounded-none shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-stone-900">
              CHI TIẾT CÂU TRẢ LỜI · {history.length} CÂU
            </h2>
          </div>

          <div className="divide-y divide-stone-200 max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.item.id}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 font-sans text-xs font-medium uppercase shrink-0 border ${
                      h.isCorrect
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200 line-through'
                    }`}
                  >
                    {h.isCorrect ? 'ĐÚNG ✓' : 'SAI ✕'}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-serif font-medium text-stone-900 text-base">
                        {h.item.word}
                      </span>
                      {h.item.reading && h.item.reading !== h.item.word && (
                        <span className="text-xs font-mono text-stone-500">
                          {h.item.reading}
                        </span>
                      )}
                      {h.item.sinoVietnamese && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                          {h.item.sinoVietnamese}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-stone-600 truncate mt-0.5">
                      {h.item.meaning}
                    </p>
                    {!h.isCorrect && (
                      <p className="font-sans text-[11px] text-rose-700 font-medium mt-0.5">
                        Bạn chọn: {h.selectedMeaning}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakJapanese(h.item.word)}
                    className="p-1.5 border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE QUIZ SCREEN ====================
  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium px-2.5 py-1 border border-stone-300 bg-white text-stone-800 rounded-none uppercase">
              CÂU {currentIndex + 1}
            </span>
            <span className="text-xs font-mono font-medium px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-none uppercase">
              ĐÃ THUỘC: {masteredIds.size}/{totalUniqueItems}
            </span>
            {queue.length - currentIndex - 1 > 0 && totalUniqueItems > masteredIds.size && (
              <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-none uppercase hidden sm:inline-flex">
                CÒN LẠI: {queue.length - currentIndex - 1} CÂU
              </span>
            )}
            {currentItem.level && (
              <span className="text-xs font-mono font-medium px-2 py-1 bg-stone-100 text-stone-800 border border-stone-200 rounded-none">
                {currentItem.level}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Counter Badge */}
            <div className="flex items-center gap-1 px-3 py-1 border border-amber-200 bg-amber-50 text-amber-800 font-mono text-xs font-medium rounded-none uppercase">
              <span>CHUỖI: {streak}</span>
            </div>

            {/* XP Earned Badge */}
            <div className="flex items-center gap-1 px-3 py-1 border border-stone-200 bg-stone-100 text-stone-800 font-mono text-xs font-medium rounded-none uppercase">
              <span>+{earnedXp} XP</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={masteredIds.size}
          max={totalUniqueItems}
          size="sm"
          className="transition-all"
        />
      </div>

      {/* Main Question Card */}
      <div className="relative border border-stone-200 bg-white p-6 sm:p-8 text-center rounded-none shadow-xs space-y-4">
        <div className="flex justify-between items-center absolute top-4 left-4 right-4">
          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakJapanese(currentItem.word)}
              className="p-1.5 border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs"
              title="Phát âm từ này"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2 py-1 border text-xs font-sans font-medium transition-colors duration-100 rounded-none ${
                autoPlay
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
              }`}
              title={autoPlay ? 'Tự động phát âm: Đang BẬT' : 'Tự động phát âm: Đang TẮT'}
            >
              {autoPlay ? 'PHÁT ÂM: BẬT' : 'PHÁT ÂM: TẮT'}
            </button>
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`px-2 py-1 border text-xs font-sans font-medium transition-colors duration-100 rounded-none ${
              showHint
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
            }`}
            title="Xem gợi ý Furigana / Âm Hán Việt"
          >
            {showHint ? 'GỢI Ý: BẬT' : 'GỢI Ý'}
          </button>
        </div>

        {/* Word / Prompt Display */}
        <div className="pt-6 pb-2">
          {activeDirection === 'vi_to_ja' ? (
            <div>
              <span className="text-xs font-sans font-medium uppercase tracking-wider text-stone-500 block mb-2">
                NGHĨA TIẾNG VIỆT
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-medium text-stone-900 tracking-tight">
                {currentItem.meaning}
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl sm:text-6xl font-serif font-light text-stone-900 tracking-tight">
                {currentItem.word}
              </h2>
            </div>
          )}

          {/* Reading display (without Sino-Vietnamese leak) */}
          <div className="min-h-[2rem] flex items-center justify-center gap-2 mt-3">
            {activeDirection === 'vi_to_ja' ? (
              (showHint || isChecked) ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-mono text-sm">
                  <span className="font-medium text-stone-900">
                    {currentItem.word}
                  </span>
                  {showKana && currentItem.reading && currentItem.reading !== currentItem.word && (
                    <span className="text-stone-500">
                      ({currentItem.reading})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-sans font-medium text-stone-500 uppercase tracking-wider">
                  CHỌN TỪ TIẾNG NHẬT TƯƠNG ỨNG
                </span>
              )
            ) : (
              (showKana || showHint) && currentItem.reading && currentItem.reading !== currentItem.word ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-mono">
                  <span className="text-base font-medium text-stone-500">
                    {currentItem.reading}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-sans font-medium text-stone-500 uppercase tracking-wider">
                  CHỌN NGHĨA TIẾNG VIỆT CHÍNH XÁC
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* 4 Choices Grid with Semantic Muted Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentOptions.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === correctTarget;

          let buttonStyle =
            'border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 hover:border-stone-400 transition-all duration-100 rounded-none shadow-xs cursor-pointer';

          let badgeStyle = 'bg-stone-100 text-stone-700 border border-stone-300';
          let feedbackLabel = null;

          if (isChecked) {
            if (isCorrect) {
              buttonStyle =
                'bg-emerald-50 text-emerald-900 border-2 border-emerald-500 rounded-none shadow-xs';
              badgeStyle = 'bg-emerald-600 text-white border border-emerald-600';
              feedbackLabel = 'CHÍNH XÁC ✓';
            } else if (isSelected) {
              buttonStyle =
                'bg-rose-50 text-rose-900 border-2 border-rose-400 line-through rounded-none shadow-xs font-medium';
              badgeStyle = 'bg-rose-600 text-white border border-rose-600';
              feedbackLabel = 'CHƯA ĐÚNG ✕';
            } else {
              buttonStyle =
                'border border-stone-200 bg-stone-50 text-stone-400 opacity-40 rounded-none shadow-none cursor-default';
              badgeStyle = 'bg-stone-100 text-stone-400 border border-stone-200';
            }
          }

          return (
            <button
              key={`${currentItem.id}-opt-${idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleSelectOption(option)}
              className={`relative flex items-center justify-between p-4 text-left font-sans text-sm sm:text-base font-medium active:scale-[0.99] ${buttonStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Option Number Key (1, 2, 3, 4) */}
                <span
                  className={`w-7 h-7 flex items-center justify-center font-mono font-medium text-xs shrink-0 rounded-none ${badgeStyle}`}
                >
                  {idx + 1}
                </span>

                {/* Option Text */}
                <span className="line-clamp-2">{option}</span>
              </div>

              {/* Feedback Label */}
              {feedbackLabel && (
                <span className="font-sans text-xs font-semibold shrink-0 ml-2">
                  {feedbackLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Bar / Next Action */}
      {isChecked && (
        <div className="pt-2 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="text-xs font-sans font-medium text-stone-500 uppercase tracking-wider hidden sm:block">
            NHẤN SPACE HOẶC ENTER ĐỂ TIẾP TỤC
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 font-sans text-xs uppercase font-medium tracking-wider transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <span>{currentIndex < queue.length - 1 ? 'CÂU TIẾP THEO' : 'XEM KẾT QUẢ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuiz;