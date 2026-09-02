'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { speakJapanese } from '@/lib/tts';
import {
  Trophy,
  Flame,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Home,
  Dices,
  BookOpen,
  Volume2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  Zap,
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
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });

        const timer = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 300);

        return () => clearTimeout(timer);
      } catch (err) {
        // Safe fallback
      }
    }
  }, []);

  const againCount = stats.ratingsCount[1] || 0;
  const hardCount = stats.ratingsCount[2] || 0;
  const goodCount = stats.ratingsCount[3] || 0;
  const easyCount = stats.ratingsCount[4] || 0;

  const getRatingBadge = (rating: 1 | 2 | 3 | 4) => {
    switch (rating) {
      case 1:
        return {
          label: 'Học lại',
          classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60',
          icon: <RotateCcw className="w-3 h-3" />,
        };
      case 2:
        return {
          label: 'Khó',
          classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60',
          icon: <AlertCircle className="w-3 h-3" />,
        };
      case 3:
        return {
          label: 'Tốt',
          classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60',
          icon: <ThumbsUp className="w-3 h-3" />,
        };
      case 4:
        return {
          label: 'Dễ',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60',
          icon: <Zap className="w-3 h-3" />,
        };
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn ${className}`}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/20 text-center">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 ring-4 ring-white/10">
          <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Hoàn Thành Phiên Ôn Tập!
        </h1>
        <p className="text-indigo-100 text-sm sm:text-base mt-1 max-w-md mx-auto">
          Xuất sắc! Bạn đã duy trì kỷ luật ôn tập đều đặn và củng cố trí nhớ dài hạn.
        </p>

        {/* 4 Core Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {/* Total Cards */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
            <span className="text-xs text-indigo-200 font-medium">Đã ôn tập</span>
            <span className="text-2xl font-black mt-0.5">{stats.totalReviewed}</span>
            <span className="text-[11px] text-indigo-200/80">thẻ flashcard</span>
          </div>

          {/* Accuracy */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
            <span className="text-xs text-indigo-200 font-medium">Độ chính xác</span>
            <span className="text-2xl font-black mt-0.5">{stats.accuracy}%</span>
            <span className="text-[11px] text-indigo-200/80">thuộc bài</span>
          </div>

          {/* XP Earned */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
            <span className="text-xs text-indigo-200 font-medium">Điểm kinh nghiệm</span>
            <span className="text-2xl font-black mt-0.5 text-amber-300">+{stats.totalXp}</span>
            <span className="text-[11px] text-indigo-200/80">XP đạt được</span>
          </div>

          {/* Streak */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
            <span className="text-xs text-indigo-200 font-medium">Chuỗi học tập</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-black">{stats.streak}</span>
            </div>
            <span className="text-[11px] text-indigo-200/80">ngày liên tiếp</span>
          </div>
        </div>
      </div>

      {/* Ratings Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">Học lại</p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400">Again</p>
            </div>
          </div>
          <span className="text-lg font-bold text-rose-700 dark:text-rose-300">{againCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Khó</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">Hard</p>
            </div>
          </div>
          <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{hardCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              <ThumbsUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Tốt</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">Good</p>
            </div>
          </div>
          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{goodCount}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Dễ</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Easy</p>
            </div>
          </div>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{easyCount}</span>
        </div>
      </div>

      {/* Review Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* If there were cards rated 'Again', show special button to review them */}
        {againCount > 0 && onReviewAgainCards && (
          <button
            type="button"
            onClick={onReviewAgainCards}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md shadow-rose-500/20 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ôn lại {againCount} thẻ vừa sai</span>
          </button>
        )}

        <Link
          href="/review/quiz"
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-98"
        >
          <Dices className="w-4 h-4" />
          <span>Luyện tập với Quizlet</span>
        </Link>

        <Link
          href="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-all active:scale-98"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Detailed List of Reviewed Cards */}
      {stats.reviewedItems && stats.reviewedItems.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Danh sách thẻ vừa ôn ({stats.reviewedItems.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {stats.reviewedItems.map((item, idx) => {
              const badge = getRatingBadge(item.rating);

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => speakJapanese(item.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white font-japanese text-base">
                          {item.title}
                        </span>
                        {item.reading && item.reading !== item.title && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-japanese">
                            {item.reading}
                          </span>
                        )}
                        {item.sinoVietnamese && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/60 font-mono">
                            {item.sinoVietnamese}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${badge.classes}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline-block">
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
