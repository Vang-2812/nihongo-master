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
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Đang chuẩn bị bộ thẻ SRS...</p>
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
        <div className="max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-lg space-y-6 animate-fadeIn">
          {/* Empty State Graphic */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tuyệt vời! Không còn thẻ nào cần ôn hôm nay 🎉
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              Bạn đã hoàn tất tất cả các thẻ đến hạn theo thuật toán lặp lại ngắt quãng SM-2.
            </p>
          </div>

          {/* User SRS Overview */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng thẻ SRS</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {totalCardsInSRS}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chuỗi học</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {globalStats.streak} ngày
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng XP</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {globalStats.totalXp} XP
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5 pt-2">
            {totalCardsInSRS > 0 ? (
              <button
                type="button"
                onClick={handleStartCramMode}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-98"
              >
                <Layers className="w-4 h-4" />
                <span>Ôn tập tùy chỉnh (Cram mode {totalCardsInSRS} thẻ)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleQuickAddSampleCards}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Thêm nhanh 20 thẻ N5 để bắt đầu học ngay</span>
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/tango"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Kho Từ Vựng (Tango)</span>
              </Link>

              <Link
                href="/kanji"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                <Languages className="w-4 h-4 text-purple-500" />
                <span>Kho Hán Tự (Kanji)</span>
              </Link>
            </div>

            <Link
              href="/review/quiz"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <Dices className="w-4 h-4 text-amber-500" />
              <span>Thử thách với Quizlet Trắc nghiệm & Nối từ</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Thoát phiên ôn tập"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát</span>
          </Link>

          {/* Session Title & Mode */}
          <div className="text-center">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              <span>{isCramMode ? 'Ôn tập tự do (Cram)' : 'Ôn tập Flashcard SRS'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono">
                {currentIndex + 1}/{sessionQueue.length}
              </span>
            </h1>
          </div>

          {/* Right Header: XP & AutoPlay Toggle */}
          <div className="flex items-center gap-2">
            {/* Auto Play Audio Toggle */}
            <button
              type="button"
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                autoPlayAudio
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={autoPlayAudio ? 'Tự động phát âm thanh khi lật thẻ (Bật)' : 'Tự động phát âm thanh (Tắt)'}
            >
              {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">Tự động phát âm</span>
            </button>

            {/* Session XP Badge */}
            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+{sessionXp} XP</span>
            </div>
          </div>
        </div>

        {/* Session Progress Bar */}
        <ProgressBar
          value={currentIndex}
          max={sessionQueue.length}
          variant="primary"
          size="sm"
          className="transition-all"
        />
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
        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">Space</kbd>
            <span>Lật thẻ</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">1 - 4</kbd>
            <span>Đánh giá SM-2</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">R</kbd>
            <span>Nghe lại phát âm</span>
          </span>
        </div>
      </div>
    </div>
  );
}
