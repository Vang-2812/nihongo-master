'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { speakJapanese } from '@/lib/tts';
import {
  Volume2,
  ArrowRight,
  RotateCcw,
  Home,
  Dices,
} from 'lucide-react';

export interface ReviewedCardSummaryItem {
  id: string;
  title: string;
  reading?: string;
  sinoVietnamese?: string;
  meaning: string;
  rating: 1 | 2 | 3 | 4;
  xpEarned: number;
  nextDueDate: string;
}

export interface SessionStatsData {
  totalReviewed: number;
  totalXp: number;
  streak: number;
  accuracy: number; // e.g. 85 (meaning 85%)
  ratingsCount: Record<1 | 2 | 3 | 4, number>;
  reviewedItems: ReviewedCardSummaryItem[];
}

export interface SessionSummaryProps {
  stats: SessionStatsData;
  onReviewAgainCards?: () => void;
  onRestartSession?: () => void;
  className?: string;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  stats,
  onReviewAgainCards,
  onRestartSession,
  className = '',
}) => {
  useEffect(() => {
    // Trigger celebratory confetti on completion
    if (typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, []);

  const againCount = stats.ratingsCount[1] || 0;
  const hardCount = stats.ratingsCount[2] || 0;
  const goodCount = stats.ratingsCount[3] || 0;
  const easyCount = stats.ratingsCount[4] || 0;

  const getRatingLabel = (rating: 1 | 2 | 3 | 4) => {
    switch (rating) {
      case 1:
        return '1 · AGAIN';
      case 2:
        return '2 · HARD';
      case 3:
        return '3 · GOOD';
      case 4:
        return '4 · EASY';
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
      {/* High-Fashion Editorial Title Banner */}
      <div className="text-center space-y-2 pb-6 border-b-4 border-black">
        <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
          PHIÊN ÔN TẬP FLASHCARD SRS HOÀN TẤT
        </div>
        <h1 className="font-serif font-black text-4xl sm:text-6xl text-black tracking-tight uppercase">
          SESSION COMPLETED
        </h1>
        <p className="font-serif text-lg sm:text-2xl text-black tracking-widest">
          学習完了
        </p>
      </div>

      {/* 4 Core Stats Grid with 4px black rules and 6xl serif numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b-4 border-black divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black text-center">
        {/* Total Cards */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            ĐÃ ÔN TẬP
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
            {stats.totalReviewed}
          </span>
          <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
            THẺ FLASHCARD
          </span>
        </div>

        {/* Accuracy */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            ĐỘ CHÍNH XÁC
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
            {stats.accuracy}%
          </span>
          <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
            THUỘC BÀI
          </span>
        </div>

        {/* Streak */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            CHUỖI HỌC
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
            {stats.streak}
          </span>
          <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
            NGÀY LIÊN TIẾP
          </span>
        </div>

        {/* XP Earned */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            ĐIỂM THƯỞNG
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
            +{stats.totalXp}
          </span>
          <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
            XP ĐẠT ĐƯỢC
          </span>
        </div>
      </div>

      {/* Ratings Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border-2 border-black p-3 sm:p-4 bg-white text-center rounded-none">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mutedForeground">1 · AGAIN</p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-black mt-1">{againCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider opacity-70">Học lại</span>
        </div>

        <div className="border-2 border-black p-3 sm:p-4 bg-white text-center rounded-none">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mutedForeground">2 · HARD</p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-black mt-1">{hardCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider opacity-70">Khó</span>
        </div>

        <div className="border-2 border-black p-3 sm:p-4 bg-white text-center rounded-none">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mutedForeground">3 · GOOD</p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-black mt-1">{goodCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider opacity-70">Tốt</span>
        </div>

        <div className="border-2 border-black p-3 sm:p-4 bg-white text-center rounded-none">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mutedForeground">4 · EASY</p>
          <p className="font-serif text-2xl sm:text-3xl font-black text-black mt-1">{easyCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider opacity-70">Dễ</span>
        </div>
      </div>

      {/* Review Action Buttons: Inverted Black and White Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* If there were cards rated 'Again', show special button to review them */}
        {againCount > 0 && onReviewAgainCards ? (
          <button
            type="button"
            onClick={onReviewAgainCards}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ÔN LẠI ({againCount} TỪ CHƯA THUỘC)</span>
          </button>
        ) : onRestartSession ? (
          <button
            type="button"
            onClick={onRestartSession}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ÔN TẬP LẠI</span>
          </button>
        ) : null}

        <Link
          href="/review/quiz"
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
        >
          <Dices className="w-4 h-4" />
          <span>LUYỆN TẬP QUIZ</span>
        </Link>

        {/* Primary inverted black button: [ CONTINUE TO DASHBOARD ] */}
        <Link
          href="/"
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
        >
          <Home className="w-4 h-4" />
          <span>TRỞ VỀ TRANG CHỦ</span>
        </Link>
      </div>

      {/* Detailed List of Reviewed Cards */}
      {stats.reviewedItems && stats.reviewedItems.length > 0 && (
        <div className="border-2 border-black bg-white p-5 sm:p-6 rounded-none shadow-none space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black">
              DANH SÁCH THẺ VỪA ÔN · {stats.reviewedItems.length} THẺ
            </h2>
          </div>

          <div className="divide-y divide-black max-h-80 overflow-y-auto pr-1">
            {stats.reviewedItems.map((item, idx) => {
              const ratingLabel = getRatingLabel(item.rating);

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => speakJapanese(item.title)}
                      className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors duration-100 shrink-0"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-serif font-bold text-black text-base">
                          {item.title}
                        </span>
                        {item.reading && item.reading !== item.title && (
                          <span className="text-xs font-mono text-mutedForeground">
                            {item.reading}
                          </span>
                        )}
                        {item.sinoVietnamese && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black text-white border border-black uppercase">
                            {item.sinoVietnamese}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-mutedForeground truncate mt-0.5">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 border border-black font-bold uppercase tracking-wider">
                      {ratingLabel}
                    </span>

                    <span className="font-bold hidden sm:inline-block">
                      +{item.xpEarned} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionSummary;
