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
        return '1 · HỌC LẠI';
      case 2:
        return '2 · KHÓ';
      case 3:
        return '3 · NHỚ';
      case 4:
        return '4 · DỄ';
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
      {/* Editorial Title Banner */}
      <div className="text-center space-y-2 pb-6 border-b border-stone-200">
        <div className="font-mono text-xs uppercase tracking-widest text-stone-500">
          PHIÊN ÔN TẬP FLASHCARD SRS HOÀN TẤT
        </div>
        <h1 className="font-serif font-light text-4xl sm:text-6xl text-stone-900 tracking-tight uppercase">
          SESSION COMPLETED
        </h1>
        <p className="font-serif text-lg sm:text-2xl text-stone-700 tracking-widest">
          学習完了
        </p>
      </div>

      {/* 4 Core Stats Grid with 1px stone borders and light serif numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 text-center bg-white">
        {/* Total Cards */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            ĐÃ ÔN TẬP
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
            {stats.totalReviewed}
          </span>
          <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
            THẺ FLASHCARD
          </span>
        </div>

        {/* Accuracy */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            ĐỘ CHÍNH XÁC
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
            {stats.accuracy}%
          </span>
          <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
            THUỘC BÀI
          </span>
        </div>

        {/* Streak */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            CHUỖI HỌC
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
            {stats.streak}
          </span>
          <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
            NGÀY LIÊN TIẾP
          </span>
        </div>

        {/* XP Earned */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            ĐIỂM THƯỞNG
          </span>
          <span className="font-serif text-4xl sm:text-6xl font-light text-stone-900 my-1">
            +{stats.totalXp}
          </span>
          <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider">
            XP ĐẠT ĐƯỢC
          </span>
        </div>
      </div>

      {/* Ratings Breakdown Grid with Pastel Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-rose-200 p-3 sm:p-4 bg-rose-50/50 text-center rounded-none">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-rose-800">1 · HỌC LẠI</p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-rose-900 mt-1">{againCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider text-rose-700">Học lại</span>
        </div>

        <div className="border border-amber-200 p-3 sm:p-4 bg-amber-50/50 text-center rounded-none">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-amber-800">2 · KHÓ</p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-amber-900 mt-1">{hardCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider text-amber-700">Khó</span>
        </div>

        <div className="border border-indigo-200 p-3 sm:p-4 bg-indigo-50/50 text-center rounded-none">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-indigo-800">3 · NHỚ</p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-indigo-900 mt-1">{goodCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider text-indigo-700">Nhớ tốt</span>
        </div>

        <div className="border border-emerald-200 p-3 sm:p-4 bg-emerald-50/50 text-center rounded-none">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-emerald-800">4 · DỄ</p>
          <p className="font-serif text-2xl sm:text-3xl font-light text-emerald-900 mt-1">{easyCount}</p>
          <span className="font-sans text-[11px] uppercase tracking-wider text-emerald-700">Dễ dàng</span>
        </div>
      </div>

      {/* Review Action Buttons: Stone Outline & Stone 900 Primary */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* If there were cards rated 'Again', show special button to review them */}
        {againCount > 0 && onReviewAgainCards ? (
          <button
            type="button"
            onClick={onReviewAgainCards}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-rose-300 bg-rose-50 text-rose-800 font-sans text-xs font-medium uppercase tracking-wider hover:bg-rose-100 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ÔN LẠI ({againCount} TỪ CHƯA THUỘC)</span>
          </button>
        ) : onRestartSession ? (
          <button
            type="button"
            onClick={onRestartSession}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-300 bg-white text-stone-800 font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ÔN TẬP LẠI</span>
          </button>
        ) : null}

        <Link
          href="/review/quiz"
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-300 bg-white text-stone-800 font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
        >
          <Dices className="w-4 h-4" />
          <span>LUYỆN TẬP QUIZ</span>
        </Link>

        {/* Primary button: Return to dashboard */}
        <Link
          href="/"
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-stone-900 bg-stone-900 text-white font-sans text-xs font-medium uppercase tracking-wider hover:bg-stone-800 transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
        >
          <Home className="w-4 h-4" />
          <span>TRỞ VỀ TRANG CHỦ</span>
        </Link>
      </div>

      {/* Detailed List of Reviewed Cards */}
      {stats.reviewedItems && stats.reviewedItems.length > 0 && (
        <div className="border border-stone-200 bg-white p-5 sm:p-6 rounded-none shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-stone-900">
              DANH SÁCH THẺ VỪA ÔN · {stats.reviewedItems.length} THẺ
            </h2>
          </div>

          <div className="divide-y divide-stone-200 max-h-80 overflow-y-auto pr-1">
            {stats.reviewedItems.map((item, idx) => {
              const ratingLabel = getRatingLabel(item.rating);
              const ratingBadgeClasses =
                item.rating === 1
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : item.rating === 2
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : item.rating === 3
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => speakJapanese(item.title)}
                      className="p-1.5 border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors duration-100 shrink-0 rounded-none"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-serif font-medium text-stone-900 text-base">
                          {item.title}
                        </span>
                        {item.reading && item.reading !== item.title && (
                          <span className="text-xs font-mono text-stone-500">
                            {item.reading}
                          </span>
                        )}
                        {item.sinoVietnamese && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                            {item.sinoVietnamese}
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-stone-600 truncate mt-0.5">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 border font-medium uppercase tracking-wider ${ratingBadgeClasses}`}>
                      {ratingLabel}
                    </span>

                    <span className="font-medium text-stone-700 hidden sm:inline-block">
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
