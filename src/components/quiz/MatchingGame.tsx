'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Home,
  Check,
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
  }, [items, pairCount, showKana]);

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
              particleCount: 80,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch (e) {
            // ignore
          }
        }
      }
    } else {
      // MISMATCH! Heavy border shake feedback without red color
      setMismatchedCardIds([firstCard.id, card.id]);
      setTimeout(() => {
        setMismatchedCardIds([]);
        setSelectedCardId(null);
      }, 500);
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
      <div className="max-w-md mx-auto p-6 text-center space-y-4 border-2 border-black bg-white rounded-none shadow-none">
        <p className="font-sans text-sm text-black">KHÔNG CÓ ĐỦ THẺ TỪ VỰNG ĐỂ CHƠI GHÉP THẺ</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-black bg-black text-white font-sans text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none"
        >
          <Dices className="w-4 h-4" />
          <span>QUAY LẠI MENU QUIZ</span>
        </Link>
      </div>
    );
  }

  // ==================== VICTORY SUMMARY SCREEN ====================
  if (isFinished) {
    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
        {/* High-Fashion Editorial Title Banner */}
        <div className="text-center space-y-2 pb-6 border-b-4 border-black">
          <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            HOÀN THÀNH TRÒ CHƠI GHÉP THẺ
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-6xl text-black tracking-tight uppercase">
            MATCHING COMPLETED
          </h1>
          <p className="font-serif text-lg sm:text-2xl text-black tracking-widest">
            神経衰弱完了
          </p>
          <p className="font-sans text-xs uppercase tracking-wider text-mutedForeground mt-1 font-medium">
            BẠN ĐÃ GHÉP CHÍNH XÁC {totalPairs} CẶP THẺ
          </p>
        </div>

        {/* 3 Core Stats Grid with 4px black rules and 6xl serif numbers */}
        <div className="grid grid-cols-3 border-b-4 border-black divide-x-2 divide-black text-center">
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              THỜI GIAN
            </span>
            <span className="font-mono text-3xl sm:text-5xl font-black text-black my-1">
              {formatTime(timeSeconds)}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              PHÚT:GIÂY
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              LƯỢT LẬT
            </span>
            <span className="font-serif text-3xl sm:text-5xl font-black text-black my-1">
              {turns}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              LƯỢT THỬ
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐIỂM THƯỞNG
            </span>
            <span className="font-serif text-3xl sm:text-5xl font-black text-black my-1">
              +25
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              XP
            </span>
          </div>
        </div>

        {bestTime && (
          <div className="text-center font-mono text-xs uppercase tracking-wider text-black border-2 border-black p-3 bg-muted">
            KỶ LỤC TỐT NHẤT CỦA BẠN: {formatTime(bestTime)}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={initializeGame}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI VÁN KHÁC</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Dices className="w-4 h-4" />
            <span>ĐỔI CHẾ ĐỘ QUIZ</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>TRANG CHỦ</span>
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
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-2 border-black bg-white rounded-none shadow-none">
        {/* Progress */}
        <div className="font-mono text-xs sm:text-sm font-bold uppercase">
          <span className="text-mutedForeground mr-1">ĐÃ GHÉP:</span>
          <span className="text-black">{matchedPairsCount}/{totalPairs} CẶP</span>
        </div>

        {/* Turns */}
        <div className="font-mono text-xs sm:text-sm font-bold uppercase">
          <span className="text-mutedForeground mr-1">LƯỢT:</span>
          <span className="text-black">{turns}</span>
        </div>

        {/* Timer */}
        <div className="font-mono text-xs sm:text-sm font-bold uppercase">
          <span className="text-mutedForeground mr-1">THỜI GIAN:</span>
          <span className="text-black">{formatTime(timeSeconds)}</span>
        </div>

        {/* Restart Button */}
        <button
          type="button"
          onClick={initializeGame}
          className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none shrink-0"
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

          // Compute Dynamic Card Styling with monochrome feedback states
          let cardStyle =
            'border-2 border-black bg-white text-black hover:bg-muted hover:border-black';

          if (isMatched) {
            // Matched pair: Inverted solid black with opacity and smooth strike/checkmark
            cardStyle =
              'border-2 border-black bg-black text-white opacity-40 cursor-default line-through';
          } else if (isJustMatched) {
            // Just matched pair: Inverted solid black with border
            cardStyle =
              'border-2 border-black bg-black text-white ring-2 ring-black scale-102';
          } else if (isMismatched) {
            // Mismatch: Heavy 4px black border / shake feedback without red color
            cardStyle =
              'border-4 border-black bg-muted text-black animate-shake';
          } else if (isSelected) {
            // Selected state: ring-2 ring-black bg-muted
            cardStyle =
              'border-2 border-black ring-2 ring-black bg-muted text-black scale-102 shadow-none';
          }

          return (
            <button
              key={card.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleCardClick(card)}
              className={`relative min-h-[5.5rem] sm:min-h-[7rem] p-3 border-2 flex flex-col items-center justify-center text-center transition-all select-none active:scale-95 rounded-none shadow-none ${cardStyle}`}
            >
              {/* Type Badge Tag */}
              <span
                className={`absolute top-1.5 left-1.5 font-mono text-[9px] font-bold px-1.5 py-0.2 border uppercase tracking-wider rounded-none ${
                  isMatched || isJustMatched
                    ? 'border-white text-white'
                    : 'border-black text-black'
                }`}
              >
                {card.type === 'japanese' ? 'JA' : 'VI'}
              </span>

              {/* Matched checkmark icon */}
              {(isMatched || isJustMatched) && (
                <span className="absolute top-1.5 right-1.5 text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}

              {/* Card Main Text */}
              <span
                className={`font-bold transition-all line-clamp-2 px-1 ${
                  card.type === 'japanese'
                    ? 'font-serif text-lg sm:text-2xl tracking-tight'
                    : 'font-sans text-sm sm:text-base leading-snug'
                }`}
              >
                {card.text}
              </span>

              {/* Optional Subtext */}
              {card.subText && (
                <span className={`text-[10px] font-mono mt-1 line-clamp-1 opacity-75 ${
                  isMatched || isJustMatched ? 'text-white' : 'text-mutedForeground'
                }`}>
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