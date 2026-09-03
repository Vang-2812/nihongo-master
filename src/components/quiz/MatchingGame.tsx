'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Zap,
  RotateCcw,
  Trophy,
  Home,
  Timer,
  MousePointerClick,
  CheckCircle2,
  Dices,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';
import { useSRSStore } from '@/stores/srsStore';
import { QuizItem } from './MultipleChoiceQuiz';

export interface MatchingCard {
  id: string; // unique card id e.g. "item1_jp" or "item1_vi"
  pairId: string; // matches the QuizItem id
  type: 'japanese' | 'vietnamese';
  text: string;
  subText?: string;
  isMatched: boolean;
}

export interface MatchingGameProps {
  items: QuizItem[];
  pairCount?: number; // 6 or 8 pairs (12 or 16 cards grid)
  title?: string;
  subtitle?: string;
  showKana?: boolean;
  onRestart?: () => void;
  onExit?: () => void;
  className?: string;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  items,
  pairCount = 6,
  title = 'Ghép Thẻ Từ Vựng & Nghĩa',
  subtitle = 'Nối các cặp thẻ tiếng Nhật và tiếng Việt tương ứng',
  showKana = true,
  onRestart,
  onExit,
  className = '',
}) => {
  const { addXp } = useSRSStore();

  const [cards, setCards] = useState<MatchingCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [mismatchedCardIds, setMismatchedCardIds] = useState<string[]>([]);
  const [justMatchedCardIds, setJustMatchedCardIds] = useState<string[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(pairCount);
  const [turns, setTurns] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Load best time from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`nihongo_matching_best_${pairCount}`);
      if (saved) {
        setBestTime(parseInt(saved, 10));
      }
    } catch (e) {
      // ignore
    }
  }, [pairCount]);

  // Initialize Game Cards
  const initializeGame = useCallback(() => {
    if (!items || items.length === 0) return;

    // Pick random items for pairs
    const count = Math.min(pairCount, items.length);
    setTotalPairs(count);

    const shuffledItems = [...items]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    const generatedCards: MatchingCard[] = [];

    shuffledItems.forEach((item) => {
      // 1. Japanese Card
      generatedCards.push({
        id: `${item.id}_jp`,
        pairId: item.id,
        type: 'japanese',
        text: item.word,
        subText: showKana && item.reading !== item.word ? item.reading : undefined,
        isMatched: false,
      });

      // 2. Vietnamese Meaning Card
      generatedCards.push({
        id: `${item.id}_vi`,
        pairId: item.id,
        type: 'vietnamese',
        text: item.meaning,
        subText: item.sinoVietnamese ? item.sinoVietnamese : undefined,
        isMatched: false,
      });
    });

    // Shuffle cards grid
    const shuffledCards = generatedCards.sort(() => Math.random() - 0.5);

    setCards(shuffledCards);
    setSelectedCardId(null);
    setMismatchedCardIds([]);
    setJustMatchedCardIds([]);
    setMatchedPairsCount(0);
    setTurns(0);
    setTimeSeconds(0);
    setIsTimerRunning(false);
    setIsFinished(false);
  }, [items, pairCount]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isFinished]);

  // Handle Card Click
  const handleCardClick = (card: MatchingCard) => {
    if (card.isMatched || isFinished || mismatchedCardIds.length > 0) return;

    // Start timer on first card interaction
    if (!isTimerRunning && matchedPairsCount === 0) {
      setIsTimerRunning(true);
    }

    // Clicked the same card -> deselect
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      return;
    }

    // No card selected yet -> select this card
    if (!selectedCardId) {
      setSelectedCardId(card.id);
      if (card.type === 'japanese') {
        speakJapanese(card.text);
      }
      return;
    }

    // Second card clicked -> check match
    const firstCard = cards.find((c) => c.id === selectedCardId);
    if (!firstCard) {
      setSelectedCardId(card.id);
      return;
    }

    setTurns((prev) => prev + 1);

    // Speak Japanese if either card is Japanese
    if (card.type === 'japanese') {
      speakJapanese(card.text);
    } else if (firstCard.type === 'japanese') {
      speakJapanese(firstCard.text);
    }

    // MATCH SUCCESSFUL!
    if (firstCard.pairId === card.pairId && firstCard.type !== card.type) {
      const matchedIds = [firstCard.id, card.id];
      setJustMatchedCardIds(matchedIds);

      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstCard.id || c.id === card.id ? { ...c, isMatched: true } : c
          )
        );
        setJustMatchedCardIds([]);
      }, 300);

      const nextMatchedCount = matchedPairsCount + 1;
      setMatchedPairsCount(nextMatchedCount);
      setSelectedCardId(null);

      // Unified SRS SM-2 Record & sync to vocabStore
      try {
        const item = items.find((it) => it.id === card.pairId);
        useSRSStore
          .getState()
          .recordReview(
            item?.type || 'vocab',
            card.pairId,
            3,
            (item?.level as any) || 'N5'
          );
      } catch (err) {
        // ignore
      }

      // Check Game Victory
      if (nextMatchedCount === totalPairs) {
        setIsFinished(true);
        setIsTimerRunning(false);
        addXp(25); // Award 25 XP for completing matching game

        // Update best time
        const finalTime = timeSeconds + 1;
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime);
          try {
            localStorage.setItem(
              `nihongo_matching_best_${pairCount}`,
              finalTime.toString()
            );
          } catch (e) {
            // ignore
          }
        }

        if (typeof window !== 'undefined') {
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch (e) {
            // ignore
          }
        }
      }
    } else {
      // MISMATCH!
      setMismatchedCardIds([firstCard.id, card.id]);
      setTimeout(() => {
        setMismatchedCardIds([]);
        setSelectedCardId(null);
      }, 700);
    }
  };

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Không có đủ thẻ từ vựng để chơi ghép thẻ.</p>
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

  // ==================== VICTORY SUMMARY SCREEN ====================
  if (isFinished) {
    return (
      <div className={`w-full max-w-xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn ${className}`}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-500/20 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md ring-4 ring-white/10 mx-auto">
            <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xuất Sắc! Hoàn Thành Ghép Thẻ!
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Bạn đã ghép chính xác toàn bộ {totalPairs} cặp thẻ.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-emerald-200">Thời gian</span>
              <span className="text-2xl font-black mt-0.5 font-mono">
                {formatTime(timeSeconds)}
              </span>
              <span className="text-[10px] text-emerald-200/80">phút:giây</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-emerald-200">Số lượt thử</span>
              <span className="text-2xl font-black mt-0.5">{turns}</span>
              <span className="text-[10px] text-emerald-200/80">lượt lật</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-emerald-200">Điểm thưởng</span>
              <span className="text-2xl font-black mt-0.5 text-amber-300">+25</span>
              <span className="text-[10px] text-emerald-200/80">XP</span>
            </div>
          </div>

          {bestTime && (
            <div className="text-xs text-emerald-100/90 font-medium">
              🏆 Kỷ lục tốt nhất của bạn: <span className="font-bold font-mono">{formatTime(bestTime)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={initializeGame}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Chơi Lại Ván Khác</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-all active:scale-98"
          >
            <Dices className="w-4 h-4 text-emerald-500" />
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
      </div>
    );
  }

  // ==================== ACTIVE GAMEPLAY SCREEN ====================
  const gridColsClass = totalPairs === 8 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  return (
    <div className={`w-full max-w-3xl mx-auto space-y-6 ${className}`}>
      {/* Game Stats Header */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đã ghép</span>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {matchedPairsCount}/{totalPairs} <span className="text-xs font-normal text-slate-500">cặp</span>
            </p>
          </div>
        </div>

        {/* Turns */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lượt lật</span>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
              {turns}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thời gian</span>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
              {formatTime(timeSeconds)}
            </p>
          </div>
        </div>

        {/* Restart Button */}
        <button
          type="button"
          onClick={initializeGame}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Xáo bài và chơi lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className={`grid ${gridColsClass} gap-3 sm:gap-4`}>
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const isMismatched = mismatchedCardIds.includes(card.id);
          const isJustMatched = justMatchedCardIds.includes(card.id);
          const isMatched = card.isMatched;

          // Compute Dynamic Card Styling
          let cardStyle =
            'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-400 hover:shadow-md';

          if (isMatched) {
            cardStyle =
              'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700/60 dark:text-emerald-300/60 opacity-40 cursor-default scale-95';
          } else if (isJustMatched) {
            cardStyle =
              'border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-100 ring-2 ring-emerald-500 scale-102';
          } else if (isMismatched) {
            cardStyle =
              'border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-100 ring-2 ring-rose-500 animate-shake';
          } else if (isSelected) {
            cardStyle =
              'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-600 shadow-lg shadow-indigo-500/10 scale-102';
          }

          return (
            <button
              key={card.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleCardClick(card)}
              className={`relative min-h-[5.5rem] sm:min-h-[6.5rem] p-3 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center text-center transition-all select-none active:scale-95 ${cardStyle}`}
            >
              {/* Type Badge Tag */}
              <span
                className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                  card.type === 'japanese'
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {card.type === 'japanese' ? 'JA' : 'VI'}
              </span>

              {/* Card Main Text */}
              <span
                className={`font-bold transition-all line-clamp-2 ${
                  card.type === 'japanese'
                    ? 'text-lg sm:text-xl font-japanese'
                    : 'text-xs sm:text-sm font-medium'
                }`}
              >
                {card.text}
              </span>

              {/* Optional Subtext */}
              {card.subText && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {card.subText}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingGame;