'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Volume2,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Trophy,
  Home,
  Check,
  X,
  Dices,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';
import { useSRSStore } from '@/stores/srsStore';
import { AudioButton } from '@/components/vocab/AudioButton';
import ProgressBar from '@/components/ui/ProgressBar';

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
  title?: string;
  subtitle?: string;
  direction?: 'ja_to_vi' | 'vi_to_ja';
  showKana?: boolean;
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
  title = 'Trắc Nghiệm 4 Đáp Án',
  subtitle = 'Chọn đáp án chính xác cho từ vựng / Hán tự',
  direction = 'ja_to_vi',
  showKana = true,
  onRestart,
  onExit,
  className = '',
}) => {
  const { addXp } = useSRSStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Fallback pool for distractors
  const pool = useMemo(() => {
    return allPool && allPool.length >= 4 ? allPool : items;
  }, [allPool, items]);

  const currentItem = items[currentIndex];

  // Helper to format options based on direction and showKana
  const getOptionLabel = useCallback(
    (item: QuizItem) => {
      if (direction === 'vi_to_ja') {
        if (showKana && item.reading && item.reading !== item.word) {
          return `${item.word} (${item.reading})`;
        }
        return item.word;
      }
      return item.meaning.trim();
    },
    [direction, showKana]
  );

  const correctTarget = useMemo(() => {
    if (!currentItem) return '';
    return getOptionLabel(currentItem);
  }, [currentItem, getOptionLabel]);

  // Generate 4 randomized options for the current question
  const currentOptions = useMemo(() => {
    if (!currentItem) return [];

    const target = getOptionLabel(currentItem);
    const otherMeanings = pool
      .filter((p) => p.id !== currentItem.id && getOptionLabel(p) !== target)
      .map(getOptionLabel);

    // Deduplicate and shuffle distractors
    const uniqueDistractors = Array.from(new Set(otherMeanings)).sort(
      () => Math.random() - 0.5
    );
    const chosenDistractors = uniqueDistractors.slice(0, 3);

    // Fallback if not enough distractors in pool
    const fallbackList =
      direction === 'vi_to_ja'
        ? ['ことば A', 'ことば B', 'ことば C']
        : ['Nghĩa khác A', 'Nghĩa khác B', 'Nghĩa khác C'];
    while (chosenDistractors.length < 3) {
      chosenDistractors.push(fallbackList[chosenDistractors.length]);
    }

    // Combine and shuffle 4 options
    const allFour = [target, ...chosenDistractors].sort(
      () => Math.random() - 0.5
    );
    return allFour;
  }, [currentItem, pool, direction, getOptionLabel]);

  // Handle Option Selection
  const handleSelectOption = useCallback(
    (option: string) => {
      if (isChecked || !currentItem) return;

      setSelectedOption(option);
      setIsChecked(true);

      const isCorrect = option === correctTarget;

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak((prev) => Math.max(prev, newStreak));
        setScore((prev) => prev + 1);
        setEarnedXp((prev) => prev + 10);
        addXp(10);
        speakJapanese(currentItem.word);

        if (newStreak >= 3 && typeof window !== 'undefined') {
          try {
            confetti({
              particleCount: 35,
              spread: 45,
              origin: { y: 0.7 },
            });
          } catch (e) {
            // ignore
          }
        }
      } else {
        setStreak(0);
      }

      // Unified SRS SM-2 Record & sync to vocabStore
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
    [isChecked, currentItem, correctTarget, streak, addXp]
  );

  // Next Question
  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      if (typeof window !== 'undefined') {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [currentIndex, items.length]);

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
      <div className="max-w-md mx-auto p-6 text-center space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Không có câu hỏi nào trong bộ bài này.</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          <Dices className="w-4 h-4" />
          <span>Quay lại Menu Quiz</span>
        </Link>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isFinished) {
    const accuracy = Math.round((score / items.length) * 100);

    return (
      <div className={`w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn ${className}`}>
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 ring-4 ring-white/10">
            <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hoàn Thành Trắc Nghiệm!
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-1">
            Bạn đã trả lời đúng {score}/{items.length} câu hỏi.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-indigo-200">Đúng</span>
              <span className="text-2xl font-black mt-0.5 text-emerald-300">
                {score}/{items.length}
              </span>
              <span className="text-[11px] text-indigo-200/80">câu hỏi</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-indigo-200">Độ chính xác</span>
              <span className="text-2xl font-black mt-0.5">{accuracy}%</span>
              <span className="text-[11px] text-indigo-200/80">chính xác</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-indigo-200">Chuỗi cao nhất</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-black">{maxStreak}</span>
              </div>
              <span className="text-[11px] text-indigo-200/80">liên tiếp</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-indigo-200">Điểm thưởng</span>
              <span className="text-2xl font-black mt-0.5 text-amber-300">+{earnedXp}</span>
              <span className="text-[11px] text-indigo-200/80">XP</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleRestartInternal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm Lại Bộ Này</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-all active:scale-98"
          >
            <Dices className="w-4 h-4 text-indigo-500" />
            <span>Đổi Chế Độ Quiz</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Trang Chủ</span>
          </Link>
        </div>

        {/* Question Review List */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Chi tiết câu trả lời ({history.length})</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.item.id}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      h.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {h.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-japanese">
                        {h.item.word}
                      </span>
                      {h.item.reading && h.item.reading !== h.item.word && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-japanese">
                          {h.item.reading}
                        </span>
                      )}
                      {h.item.sinoVietnamese && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                          {h.item.sinoVietnamese}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {h.item.meaning}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakJapanese(h.item.word)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
  const optionLetters = ['1', '2', '3', '4'];

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              Câu {currentIndex + 1}/{items.length}
            </span>
            {currentItem.level && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentItem.level}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Counter */}
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                streak > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>{streak} chuỗi</span>
            </div>

            {/* XP Earned */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>+{earnedXp} XP</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={currentIndex}
          max={items.length}
          variant="primary"
          size="sm"
          className="transition-all"
        />
      </div>

      {/* Main Question Card */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-lg space-y-4">
        <div className="flex justify-between items-center absolute top-4 left-4 right-4">
          {/* Audio Button */}
          <AudioButton text={currentItem.word} size="md" variant="subtle" />

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`p-2 rounded-full border text-xs font-medium transition-colors ${
              showHint
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent hover:border-slate-200'
            }`}
            title="Xem gợi ý Furigana / Âm Hán Việt"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Word / Prompt Display */}
        <div className="pt-4 pb-2">
          {direction === 'vi_to_ja' ? (
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Nghĩa Tiếng Việt
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {currentItem.meaning}
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-japanese tracking-tight">
                {currentItem.word}
              </h2>
            </div>
          )}

          {/* Reading and Sino-Vietnamese */}
          <div className="min-h-[2rem] flex items-center justify-center gap-2 mt-2">
            {direction === 'vi_to_ja' ? (
              (showHint || isChecked) ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-japanese text-sm">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {currentItem.word}
                  </span>
                  {showKana && currentItem.reading && currentItem.reading !== currentItem.word && (
                    <span className="text-slate-500 dark:text-slate-400">
                      ({currentItem.reading})
                    </span>
                  )}
                  {currentItem.sinoVietnamese && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-mono">
                      {currentItem.sinoVietnamese}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Chọn từ tiếng Nhật tương ứng bên dưới</span>
              )
            ) : (
              (showKana || showHint || isChecked) ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center">
                  {currentItem.reading && currentItem.reading !== currentItem.word && (
                    <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400 font-japanese">
                      {currentItem.reading}
                    </span>
                  )}
                  {currentItem.sinoVietnamese && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-mono">
                      {currentItem.sinoVietnamese}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  (Đã ẩn Kana) Chọn nghĩa tiếng Việt chính xác bên dưới
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentOptions.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === correctTarget;

          let buttonStyle =
            'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800';

          let indicatorStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';

          if (isChecked) {
            if (isCorrect) {
              buttonStyle =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500';
              indicatorStyle = 'bg-emerald-500 text-white';
            } else if (isSelected) {
              buttonStyle =
                'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 shadow-md shadow-rose-500/10 ring-2 ring-rose-500 animate-shake';
              indicatorStyle = 'bg-rose-500 text-white';
            } else {
              buttonStyle =
                'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={`${currentItem.id}-opt-${idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleSelectOption(option)}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left font-medium transition-all active:scale-98 ${buttonStyle}`}
            >
              {/* Option Number Key (1, 2, 3, 4) */}
              <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${indicatorStyle}`}
              >
                {isChecked && isCorrect ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isChecked && isSelected && !isCorrect ? (
                  <X className="w-4 h-4 stroke-[3]" />
                ) : (
                  optionLetters[idx]
                )}
              </span>

              {/* Option Text */}
              <span className="text-sm sm:text-base line-clamp-2">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Bar / Next Action */}
      {isChecked && (
        <div className="pt-2 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">Space</kbd> hoặc <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">Enter</kbd> để tiếp tục
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-98"
          >
            <span>{currentIndex < items.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuiz;