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

  // Pool of all items for generating distractors
  const pool = useMemo(() => {
    return allPool && allPool.length >= 4 ? allPool : items;
  }, [allPool, items]);

  const currentItem = items[currentIndex];

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
      activeDirection === 'vi_to_ja'
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
  }, [currentItem, pool, activeDirection, getOptionLabel]);

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
      } else {
        setStreak(0);
      }

      // Automatically pronounce the correct answer's Japanese word upon selection
      if (autoPlay) {
        speakJapanese(currentItem.word);
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
    [isChecked, currentItem, correctTarget, streak, addXp, autoPlay]
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
            particleCount: 70,
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
      <div className="max-w-md mx-auto p-6 text-center space-y-4 border-2 border-black bg-white rounded-none shadow-none">
        <p className="font-mono text-sm text-black">[ KHÔNG CÓ CÂU HỎI NÀO TRONG BỘ BÀI NÀY ]</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-black bg-black text-white font-mono text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none"
        >
          <Dices className="w-4 h-4" />
          <span>[ MENU QUIZ ]</span>
        </Link>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isFinished) {
    const accuracy = Math.round((score / items.length) * 100);

    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
        {/* High-Fashion Editorial Title Banner */}
        <div className="text-center space-y-2 pb-6 border-b-4 border-black">
          <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            [ HOÀN THÀNH BỘ CÂU HỎI TRẮC NGHIỆM ]
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-6xl text-black tracking-tight uppercase">
            MULTIPLE CHOICE COMPLETED
          </h1>
          <p className="font-serif text-lg sm:text-2xl text-black tracking-widest">
            選択問題完了
          </p>
          <p className="font-mono text-xs uppercase tracking-wider text-mutedForeground mt-1">
            BẠN ĐÃ TRẢ LỜI ĐÚNG {score}/{items.length} CÂU HỎI
          </p>
        </div>

        {/* 4 Core Stats Grid with 4px black rules and 6xl serif numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b-4 border-black divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black text-center">
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐÚNG
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {score}/{items.length}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              CÂU HỎI
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐỘ CHÍNH XÁC
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {accuracy}%
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              CHÍNH XÁC
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              CHUỖI CAO NHẤT
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {maxStreak}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              LIÊN TIẾP
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐIỂM THƯỞNG
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              +{earnedXp}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              XP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestartInternal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>[ LÀM LẠI BỘ NÀY ]</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Dices className="w-4 h-4" />
            <span>[ ĐỔI CHẾ ĐỘ QUIZ ]</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>[ TRANG CHỦ ]</span>
          </Link>
        </div>

        {/* Question Review List */}
        <div className="border-2 border-black bg-white p-5 sm:p-6 rounded-none shadow-none space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black">
              [ CHI TIẾT CÂU TRẢ LỜI · {history.length} CÂU ]
            </h2>
          </div>

          <div className="divide-y divide-black max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.item.id}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 font-mono text-xs font-bold uppercase shrink-0 border border-black ${
                      h.isCorrect
                        ? 'bg-black text-white'
                        : 'bg-white text-black line-through'
                    }`}
                  >
                    {h.isCorrect ? '[ ĐÚNG ] ✓' : '[ SAI ] ✕'}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-serif font-bold text-black text-base">
                        {h.item.word}
                      </span>
                      {h.item.reading && h.item.reading !== h.item.word && (
                        <span className="text-xs font-mono text-mutedForeground">
                          {h.item.reading}
                        </span>
                      )}
                      {h.item.sinoVietnamese && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black text-white border border-black uppercase">
                          {h.item.sinoVietnamese}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-mutedForeground truncate mt-0.5">
                      {h.item.meaning}
                    </p>
                    {!h.isCorrect && (
                      <p className="font-mono text-[11px] text-black font-semibold mt-0.5">
                        Bạn chọn: {h.selectedMeaning}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakJapanese(h.item.word)}
                    className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 border border-black bg-white text-black rounded-none uppercase">
              CÂU {currentIndex + 1}/{items.length}
            </span>
            {currentItem.level && (
              <span className="text-xs font-mono font-bold px-2 py-1 bg-black text-white border border-black rounded-none">
                {currentItem.level}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Counter Badge */}
            <div className="flex items-center gap-1 px-3 py-1 border border-black bg-white text-black font-mono text-xs font-bold rounded-none uppercase">
              <span>[ STREAK: {streak} ]</span>
            </div>

            {/* XP Earned Badge */}
            <div className="flex items-center gap-1 px-3 py-1 border border-black bg-black text-white font-mono text-xs font-bold rounded-none uppercase">
              <span>[ +{earnedXp} XP ]</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={currentIndex}
          max={items.length}
          size="sm"
          className="transition-all"
        />
      </div>

      {/* Main Question Card */}
      <div className="relative border-2 border-black bg-white p-6 sm:p-8 text-center rounded-none shadow-none space-y-4">
        <div className="flex justify-between items-center absolute top-4 left-4 right-4">
          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakJapanese(currentItem.word)}
              className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none"
              title="Phát âm từ này"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2 py-1 border border-black text-xs font-mono font-bold transition-colors duration-100 rounded-none ${
                autoPlay ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              title={autoPlay ? 'Tự động phát âm: Đang BẬT' : 'Tự động phát âm: Đang TẮT'}
            >
              {autoPlay ? '[ AUTO: ON ]' : '[ AUTO: OFF ]'}
            </button>
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`px-2 py-1 border border-black text-xs font-mono font-bold transition-colors duration-100 rounded-none ${
              showHint ? 'bg-black text-white' : 'bg-white text-black'
            }`}
            title="Xem gợi ý Furigana / Âm Hán Việt"
          >
            {showHint ? '[ HINT: ON ]' : '[ HINT ]'}
          </button>
        </div>

        {/* Word / Prompt Display */}
        <div className="pt-6 pb-2">
          {activeDirection === 'vi_to_ja' ? (
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-mutedForeground block mb-2">
                [ NGHĨA TIẾNG VIỆT ]
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-black tracking-tight">
                {currentItem.meaning}
              </h2>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl sm:text-6xl font-serif font-black text-black tracking-tight">
                {currentItem.word}
              </h2>
            </div>
          )}

          {/* Reading and Sino-Vietnamese */}
          <div className="min-h-[2rem] flex items-center justify-center gap-2 mt-3">
            {activeDirection === 'vi_to_ja' ? (
              (showHint || isChecked) ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-mono text-sm">
                  <span className="font-bold text-black">
                    {currentItem.word}
                  </span>
                  {showKana && currentItem.reading && currentItem.reading !== currentItem.word && (
                    <span className="text-mutedForeground">
                      ({currentItem.reading})
                    </span>
                  )}
                  {currentItem.sinoVietnamese && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-black text-white border border-black uppercase">
                      {currentItem.sinoVietnamese}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-mono text-mutedForeground uppercase tracking-wider">
                  [ CHỌN TỪ TIẾNG NHẬT TƯƠNG ỨNG ]
                </span>
              )
            ) : (
              (showKana || showHint || isChecked) ? (
                <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-mono">
                  {currentItem.reading && currentItem.reading !== currentItem.word && (
                    <span className="text-base font-bold text-mutedForeground">
                      {currentItem.reading}
                    </span>
                  )}
                  {currentItem.sinoVietnamese && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-black text-white border border-black uppercase">
                      {currentItem.sinoVietnamese}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-mono text-mutedForeground uppercase tracking-wider">
                  [ CHỌN NGHĨA TIẾNG VIỆT CHÍNH XÁC ]
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
            'border-2 border-black bg-white text-black hover:bg-muted transition-colors duration-100 rounded-none shadow-none cursor-pointer';

          let feedbackLabel = null;

          if (isChecked) {
            if (isCorrect) {
              buttonStyle =
                'border-2 border-black bg-black text-white rounded-none shadow-none';
              feedbackLabel = '[ CORRECT ] ✓';
            } else if (isSelected) {
              buttonStyle =
                'border-4 border-black bg-white text-black line-through rounded-none shadow-none font-bold';
              feedbackLabel = '[ INCORRECT ] ✕';
            } else {
              buttonStyle =
                'border-2 border-black bg-white text-mutedForeground opacity-40 rounded-none shadow-none';
            }
          }

          return (
            <button
              key={`${currentItem.id}-opt-${idx}`}
              type="button"
              disabled={isChecked}
              onClick={() => handleSelectOption(option)}
              className={`relative flex items-center justify-between p-4 text-left font-mono text-sm sm:text-base font-medium active:scale-[0.99] ${buttonStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Option Number Key (1, 2, 3, 4) */}
                <span
                  className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-black ${
                    isChecked && isCorrect
                      ? 'bg-white text-black border-white'
                      : isChecked && isSelected
                      ? 'bg-black text-white'
                      : 'bg-white text-black'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Option Text */}
                <span className="line-clamp-2">{option}</span>
              </div>

              {/* Feedback Label */}
              {feedbackLabel && (
                <span className="font-mono text-xs font-bold shrink-0 ml-2">
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
          <div className="text-xs font-mono text-mutedForeground uppercase tracking-wider hidden sm:block">
            [ NHẤN SPACE HOẶC ENTER ĐỂ TIẾP TỤC ]
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <span>{currentIndex < items.length - 1 ? '[ CÂU TIẾP THEO ]' : '[ XEM KẾT QUẢ ]'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceQuiz;