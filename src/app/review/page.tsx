'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSRSStore, SRSCard } from '@/stores/srsStore';
import { useToastStore, toast } from '@/stores/toastStore';
import { resolveCardContent, ResolvedCardContent } from '@/lib/cardResolver';
import { speakJapanese } from '@/lib/tts';
import SRSFlashcard from '@/components/srs/SRSFlashcard';
import RatingButtons, { SRSRating } from '@/components/srs/RatingButtons';
import SessionSummary, { SessionStatsData, ReviewedCardSummaryItem } from '@/components/srs/SessionSummary';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Flame,
  BookOpen,
  Languages,
  CheckCircle2,
  Dices,
  Layers,
  HelpCircle,
  Play,
  PlusCircle,
} from 'lucide-react';
import { getAllVocab } from '@/lib/vocabData';
import { getAllKanji } from '@/lib/kanjiData';

export default function ReviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // SRS Store
  const {
    cards,
    stats: globalStats,
    autoPlayAudio,
    setAutoPlayAudio,
    getDueCards,
    reviewCard,
    addCards,
  } = useSRSStore();

  // Session State
  const [sessionQueue, setSessionQueue] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);

  // Session Stats Tracking
  const [sessionXp, setSessionXp] = useState(0);
  const [ratingsCount, setRatingsCount] = useState<Record<1 | 2 | 3 | 4, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [reviewedItems, setReviewedItems] = useState<ReviewedCardSummaryItem[]>([]);
  const [initialQueueLength, setInitialQueueLength] = useState(0);

  // Prevent double keypress trigger
  const isProcessingRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    setMounted(true);
    const due = getDueCards();
    setSessionQueue(due);
    setInitialQueueLength(due.length);
  }, []);

  const currentCard: SRSCard | undefined = sessionQueue[currentIndex];
  const currentContent: ResolvedCardContent | undefined = currentCard
    ? resolveCardContent(currentCard)
    : undefined;

  // Auto-play audio when card is flipped (or when card changes)
  useEffect(() => {
    if (mounted && autoPlayAudio && isFlipped && currentContent) {
      speakJapanese(currentContent.title);
    }
  }, [mounted, isFlipped, currentContent, autoPlayAudio]);

  // Flip handler
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Replay audio
  const handleReplayAudio = useCallback(() => {
    if (currentContent) {
      speakJapanese(currentContent.title);
    }
  }, [currentContent]);

  // Submit Rating Handler
  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!currentCard || !currentContent || isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // Record SM-2 update
        const result = reviewCard(currentCard.id, rating);
        const xp = result.xpEarned;
        const nextDueDate = result.nextDueDate;

        // Update session stats
        setSessionXp((prev) => prev + xp);
        setRatingsCount((prev) => ({
          ...prev,
          [rating]: prev[rating] + 1,
        }));

        setReviewedItems((prev) => [
          ...prev,
          {
            id: currentCard.id,
            title: currentContent.title,
            reading: currentContent.reading,
            sinoVietnamese: currentContent.sinoVietnamese,
            meaning: currentContent.meaning,
            rating,
            xpEarned: xp,
            nextDueDate,
          },
        ]);

        // If Again (Rating 1), re-queue to end of session
        if (rating === 1) {
          toast.info(`Đã xếp lại "${currentContent.title}" vào cuối phiên học`);
          setSessionQueue((prev) => [...prev, currentCard]);
        }

        // Advance to next card or finish session
        const nextIdx = currentIndex + 1;
        if (nextIdx < sessionQueue.length || rating === 1) {
          setCurrentIndex(nextIdx);
          setIsFlipped(false);
        } else {
          setIsSessionFinished(true);
        }
      } catch (err) {
        console.error('Error reviewing card:', err);
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 150);
      }
    },
    [currentCard, currentContent, currentIndex, sessionQueue.length, reviewCard]
  );

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    if (!mounted || isSessionFinished || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Space: Flip card
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
        return;
      }

      // Audio replay: R or A or V
      if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleReplayAudio();
        return;
      }

      // Rating keys: 1, 2, 3, 4 (both top row and numpad)
      if (e.key === '1' || e.code === 'Numpad1' || e.code === 'Digit1') {
        e.preventDefault();
        handleRate(1);
      } else if (e.key === '2' || e.code === 'Numpad2' || e.code === 'Digit2') {
        e.preventDefault();
        handleRate(2);
      } else if (e.key === '3' || e.code === 'Numpad3' || e.code === 'Digit3') {
        e.preventDefault();
        handleRate(3);
      } else if (e.key === '4' || e.code === 'Numpad4' || e.code === 'Digit4') {
        e.preventDefault();
        handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, isSessionFinished, currentCard, handleFlip, handleRate, handleReplayAudio]);

  // Start Cram Mode with all available cards or level selection
  const handleStartCramMode = () => {
    const allSRS = Object.values(cards);
    if (allSRS.length > 0) {
      // Shuffle cards for varied practice
      const shuffled = [...allSRS].sort(() => Math.random() - 0.5);
      setSessionQueue(shuffled);
      setInitialQueueLength(shuffled.length);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSessionFinished(false);
      setIsCramMode(true);
      setSessionXp(0);
      setRatingsCount({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setReviewedItems([]);
      toast.success(`Bắt đầu Ôn tập Tự do (${shuffled.length} thẻ)!`);
    } else {
      // Auto populate initial batch from N5 vocab & kanji
      handleQuickAddSampleCards();
    }
  };

  // Quick Add Sample Cards if user has 0 cards
  const handleQuickAddSampleCards = () => {
    const allVocab = getAllVocab().filter((v) => v.level === 'N5').slice(0, 15);
    const allKanjiList = getAllKanji().filter((k) => k.level === 'N5').slice(0, 5);

    const newCards = [
      ...allVocab.map((v) => ({
        id: `vocab_${v.id}`,
        cardType: 'vocab' as const,
        contentId: v.id,
        level: v.level,
      })),
      ...allKanjiList.map((k) => ({
        id: `kanji_${k.character}`,
        cardType: 'kanji' as const,
        contentId: k.character,
        level: k.level,
      })),
    ];

    addCards(newCards);
    const due = getDueCards();
    setSessionQueue(due);
    setInitialQueueLength(due.length);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    toast.success(`Đã thêm 20 thẻ N5 khởi đầu vào SRS và sẵn sàng ôn tập! 🎉`);
  };

  // Review failed (Again) cards from session summary
  const handleReviewAgainCards = () => {
    const failedCards = sessionQueue.filter((_, idx) => {
      const item = reviewedItems[idx];
      return item && item.rating === 1;
    });

    if (failedCards.length > 0) {
      setSessionQueue(failedCards);
      setInitialQueueLength(failedCards.length);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsSessionFinished(false);
      setSessionXp(0);
      setRatingsCount({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setReviewedItems([]);
      toast.info(`Bắt đầu ôn lại ${failedCards.length} thẻ cần củng cố!`);
    }
  };

  // Restart standard session
  const handleRestartSession = () => {
    const due = getDueCards();
    setSessionQueue(due);
    setInitialQueueLength(due.length);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsSessionFinished(false);
    setSessionXp(0);
    setRatingsCount({ 1: 0, 2: 0, 3: 0, 4: 0 });
    setReviewedItems([]);
  };

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-none" />
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            INITIALIZING SRS DECK...
          </p>
        </div>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isSessionFinished) {
    const totalRev = reviewedItems.length;
    const goodAndEasy = (ratingsCount[3] || 0) + (ratingsCount[4] || 0);
    const accuracy = totalRev > 0 ? Math.round((goodAndEasy / totalRev) * 100) : 100;

    const summaryStats: SessionStatsData = {
      totalReviewed: totalRev,
      totalXp: sessionXp,
      streak: globalStats.streak,
      accuracy,
      ratingsCount,
      reviewedItems,
    };

    return (
      <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4">
        <SessionSummary
          stats={summaryStats}
          onReviewAgainCards={ratingsCount[1] > 0 ? handleReviewAgainCards : undefined}
          onRestartSession={handleRestartSession}
        />
      </div>
    );
  }

  // ==================== EMPTY STATE (NO DUE CARDS) ====================
  if (sessionQueue.length === 0) {
    const totalCardsInSRS = Object.keys(cards).length;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-lg w-full border-2 border-black bg-white p-6 sm:p-8 text-center rounded-none shadow-none space-y-6 animate-fadeIn">
          {/* Empty State Graphic */}
          <div className="w-14 h-14 mx-auto border-2 border-black bg-black text-white flex items-center justify-center rounded-none shadow-none">
            <CheckCircle2 className="w-8 h-8 stroke-[2]" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-black tracking-tight uppercase">
              All Caught Up · 学習完了
            </h1>
            <p className="text-neutral-600 font-serif text-sm sm:text-base mt-2">
              Bạn đã hoàn thành tất cả thẻ cần ôn tập theo thuật toán SM-2.
            </p>
          </div>

          {/* User SRS Overview */}
          <div className="grid grid-cols-3 gap-2.5 p-4 border-2 border-black bg-white text-center rounded-none">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">TOTAL CARDS</p>
              <p className="text-xl font-bold font-serif text-black mt-1">
                {totalCardsInSRS}
              </p>
            </div>
            <div className="border-x-2 border-black px-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">STREAK</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Flame className="w-4 h-4 text-black" />
                <span className="text-xl font-bold font-serif text-black">
                  {globalStats.streak}d
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">TOTAL XP</p>
              <p className="text-xl font-bold font-serif text-black mt-1">
                {globalStats.totalXp}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 pt-2">
            {totalCardsInSRS > 0 ? (
              <button
                type="button"
                onClick={handleStartCramMode}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
              >
                <Layers className="w-4 h-4" />
                <span>CRAM SESSION ({totalCardsInSRS} CARDS)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleQuickAddSampleCards}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
              >
                <PlusCircle className="w-4 h-4" />
                <span>INITIALIZE N5 STARTER DECK (20 CARDS)</span>
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/tango"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 text-xs font-mono uppercase tracking-widest rounded-none"
              >
                <BookOpen className="w-4 h-4" />
                <span>VOCABULARY DECK</span>
              </Link>

              <Link
                href="/kanji"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 text-xs font-mono uppercase tracking-widest rounded-none"
              >
                <Languages className="w-4 h-4" />
                <span>KANJI REPOSITORY</span>
              </Link>
            </div>

            <Link
              href="/review/quiz"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 text-xs font-mono uppercase tracking-widest rounded-none"
            >
              <Dices className="w-4 h-4" />
              <span>PRACTICE QUIZZES & GAMES</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE REVIEW SESSION ====================
  const progressPercent = Math.round(((currentIndex) / sessionQueue.length) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 sm:py-6 px-4 max-w-4xl mx-auto">
      {/* Top Header: Navigation, Progress Bar, Session XP & Audio Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-xs font-mono uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            title="Thoát phiên ôn tập"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>EXIT</span>
          </Link>

          {/* Session Title & Mode */}
          <div className="text-center">
            <h1 className="text-xs sm:text-sm font-serif font-bold tracking-widest uppercase text-black flex items-center justify-center gap-2">
              <span>{isCramMode ? 'CRAM SESSION · 自由学習' : 'SRS REVIEW · 復習'}</span>
              <span className="text-xs px-2 py-0.5 border border-black bg-muted font-mono font-bold text-black rounded-none">
                [{currentIndex + 1} / {sessionQueue.length}]
              </span>
            </h1>
          </div>

          {/* Right Header: XP & AutoPlay Toggle */}
          <div className="flex items-center gap-2">
            {/* Auto Play Audio Toggle */}
            <button
              type="button"
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`px-2.5 py-1.5 border border-black text-xs font-mono uppercase flex items-center gap-1.5 transition-colors duration-100 rounded-none ${
                autoPlayAudio
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-muted'
              }`}
              title={autoPlayAudio ? 'Tự động phát âm thanh (Bật)' : 'Tự động phát âm thanh (Tắt)'}
            >
              {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">TTS: {autoPlayAudio ? 'ON' : 'OFF'}</span>
            </button>

            {/* Session XP Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-black bg-white text-black font-mono text-xs font-bold rounded-none shadow-none">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>+{sessionXp} XP</span>
            </div>
          </div>
        </div>

        {/* Session Progress Bar (Sharp monochrome border & bar) */}
        <div className="w-full h-2 border border-black bg-white rounded-none p-0.5">
          <div
            className="h-full bg-black transition-all duration-200"
            style={{ width: `${Math.round(((currentIndex) / Math.max(sessionQueue.length, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Center 3D Flashcard */}
      <div className="my-6 flex items-center justify-center">
        {currentCard && (
          <SRSFlashcard
            key={`${currentCard.id}-${currentIndex}`}
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            resolvedContent={currentContent}
          />
        )}
      </div>

      {/* Bottom Rating Buttons & Keyboard Shortcut Help */}
      <div className="space-y-3">
        {currentCard && (
          <RatingButtons
            card={currentCard}
            onRate={handleRate}
            isFlipped={isFlipped}
          />
        )}

        {/* Keyboard shortcut bar */}
        <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground pt-3 border-t border-black">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-black bg-white text-black font-mono font-bold text-[10px] rounded-none">SPACE</kbd>
            <span>LẬT THẺ</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-black bg-white text-black font-mono font-bold text-[10px] rounded-none">1 - 4</kbd>
            <span>ĐÁNH GIÁ SM-2</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 border border-black bg-white text-black font-mono font-bold text-[10px] rounded-none">R</kbd>
            <span>PHÁT ÂM</span>
          </span>
        </div>
      </div>
    </div>
  );
}
