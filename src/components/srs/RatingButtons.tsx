'use client';

import React from 'react';
import { SRSCard } from '@/stores/srsStore';
import { calculateSM2 } from '@/lib/sm2';
import { RotateCcw, AlertCircle, ThumbsUp, Zap, Sparkles } from 'lucide-react';

export type SRSRating = 1 | 2 | 3 | 4;

export interface RatingButtonsProps {
  card: SRSCard;
  onRate: (rating: SRSRating) => void;
  disabled?: boolean;
  isFlipped?: boolean;
  className?: string;
}

interface RatingOption {
  rating: SRSRating;
  label: string;
  subLabel: string;
  keyLabel: string;
  icon: React.ReactNode;
  classes: {
    button: string;
    badge: string;
    keyBadge: string;
    xpBadge: string;
  };
}

export const RatingButtons: React.FC<RatingButtonsProps> = ({
  card,
  onRate,
  disabled = false,
  isFlipped = true,
  className = '',
}) => {
  // Pre-calculate SM2 next intervals for each rating
  const getIntervalText = (rating: SRSRating): { text: string; xp: number } => {
    try {
      const output = calculateSM2({
        rating,
        repetitions: card.repetitions,
        interval: card.interval,
        easeFactor: card.easeFactor,
      });

      const text = output.interval === 1 ? '1 ngày' : `${output.interval} ngày`;
      return { text, xp: output.xpEarned };
    } catch {
      return { text: '1 ngày', xp: 1 };
    }
  };

  const ratingOptions: RatingOption[] = [
    {
      rating: 1,
      label: 'Học lại',
      subLabel: 'Again',
      keyLabel: '1',
      icon: <RotateCcw className="w-4 h-4" />,
      classes: {
        button:
          'border-rose-200/90 dark:border-rose-900/50 bg-rose-50/90 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-300 hover:border-rose-300 focus:ring-rose-400',
        badge: 'text-rose-600 dark:text-rose-400',
        keyBadge: 'bg-rose-200/80 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200',
        xpBadge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
      },
    },
    {
      rating: 2,
      label: 'Khó',
      subLabel: 'Hard',
      keyLabel: '2',
      icon: <AlertCircle className="w-4 h-4" />,
      classes: {
        button:
          'border-amber-200/90 dark:border-amber-900/50 bg-amber-50/90 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 dark:text-amber-300 hover:border-amber-300 focus:ring-amber-400',
        badge: 'text-amber-600 dark:text-amber-400',
        keyBadge: 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200',
        xpBadge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
      },
    },
    {
      rating: 3,
      label: 'Tốt',
      subLabel: 'Good',
      keyLabel: '3',
      icon: <ThumbsUp className="w-4 h-4" />,
      classes: {
        button:
          'border-blue-200/90 dark:border-blue-900/50 bg-blue-50/90 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 dark:text-blue-300 hover:border-blue-300 focus:ring-blue-400',
        badge: 'text-blue-600 dark:text-blue-400',
        keyBadge: 'bg-blue-200/80 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200',
        xpBadge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      },
    },
    {
      rating: 4,
      label: 'Dễ',
      subLabel: 'Easy',
      keyLabel: '4',
      icon: <Zap className="w-4 h-4" />,
      classes: {
        button:
          'border-emerald-200/90 dark:border-emerald-900/50 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:text-emerald-300 hover:border-emerald-300 focus:ring-emerald-400',
        badge: 'text-emerald-600 dark:text-emerald-400',
        keyBadge: 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200',
        xpBadge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      },
    },
  ];

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      {/* Reminder if not flipped */}
      {!isFlipped && (
        <div className="text-center mb-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Lật thẻ để xem đáp án hoặc bấm phím 1 - 4 để đánh giá trực tiếp
          </span>
        </div>
      )}

      {/* 4 Rating Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {ratingOptions.map((opt) => {
          const { text: intervalText, xp } = getIntervalText(opt.rating);

          return (
            <button
              key={opt.rating}
              type="button"
              disabled={disabled}
              onClick={() => onRate(opt.rating)}
              className={`group relative flex flex-col items-center justify-between p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 shadow-xs ${opt.classes.button}`}
              title={`Đánh giá ${opt.label} (${opt.subLabel}) - Phím ${opt.keyLabel}. Chu kỳ tiếp theo: ${intervalText}`}
            >
              {/* Top Row: Hotkey & XP */}
              <div className="w-full flex items-center justify-between gap-1 mb-1.5">
                {/* Hotkey Badge */}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-mono text-xs font-bold shadow-2xs ${opt.classes.keyBadge}`}
                >
                  {opt.keyLabel}
                </span>

                {/* XP badge */}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${opt.classes.xpBadge}`}
                >
                  +{xp} XP
                </span>
              </div>

              {/* Center: Label & Icon */}
              <div className="flex flex-col items-center my-0.5 text-center">
                <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base leading-tight">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                <span className="text-[11px] opacity-75 font-medium">{opt.subLabel}</span>
              </div>

              {/* Bottom: Next Interval Preview */}
              <div className="mt-2 pt-1.5 border-t border-current/10 w-full text-center">
                <span className="text-xs font-bold tracking-tight">
                  {intervalText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RatingButtons;
