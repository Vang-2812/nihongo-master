'use client';

import React from 'react';
import { SRSCard } from '@/stores/srsStore';
import { calculateSM2 } from '@/lib/sm2';

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
  colorClasses: string;
  borderTopColor: string;
  badgeColor: string;
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

      const text = output.interval === 1 ? '+1 NGÀY' : `+${output.interval} NGÀY`;
      return { text, xp: output.xpEarned };
    } catch {
      return { text: '+1 NGÀY', xp: 1 };
    }
  };

  const ratingOptions: RatingOption[] = [
    {
      rating: 1,
      label: '1 · HỌC LẠI',
      subLabel: 'Học lại',
      keyLabel: '1',
      colorClasses: 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100',
      borderTopColor: 'border-rose-200',
      badgeColor: 'border-rose-300 text-rose-700 bg-rose-50',
    },
    {
      rating: 2,
      label: '2 · KHÓ',
      subLabel: 'Khó',
      keyLabel: '2',
      colorClasses: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
      borderTopColor: 'border-amber-200',
      badgeColor: 'border-amber-300 text-amber-700 bg-amber-50',
    },
    {
      rating: 3,
      label: '3 · NHỚ',
      subLabel: 'Tốt',
      keyLabel: '3',
      colorClasses: 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100',
      borderTopColor: 'border-indigo-200',
      badgeColor: 'border-indigo-300 text-indigo-700 bg-indigo-50',
    },
    {
      rating: 4,
      label: '4 · DỄ',
      subLabel: 'Dễ',
      keyLabel: '4',
      colorClasses: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
      borderTopColor: 'border-emerald-200',
      badgeColor: 'border-emerald-300 text-emerald-700 bg-emerald-50',
    },
  ];

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      {/* Reminder if not flipped */}
      {!isFlipped && (
        <div className="text-center mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium uppercase tracking-wider text-stone-600 border border-stone-200 bg-stone-50 px-3 py-1 rounded-none">
            LẬT THẺ HOẶC BẤM 1 - 4 ĐỂ ĐÁNH GIÁ TRỰC TIẾP
          </span>
        </div>
      )}

      {/* 4 Muted Semantic Rating Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {ratingOptions.map((opt) => {
          const { text: intervalText, xp } = getIntervalText(opt.rating);

          return (
            <button
              key={opt.rating}
              type="button"
              disabled={disabled}
              onClick={() => onRate(opt.rating)}
              className={`group relative flex flex-col items-center justify-between p-3 sm:p-3.5 ${opt.colorClasses} transition-colors duration-100 rounded-none shadow-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer`}
              title={`Đánh giá ${opt.label} (${opt.subLabel}) - Phím ${opt.keyLabel}. Chu kỳ tiếp theo: ${intervalText}`}
            >
              {/* Top Row: Hotkey Badge & XP */}
              <div className="w-full flex items-center justify-between gap-1 mb-1.5 font-mono text-xs">
                <span className={`inline-flex items-center justify-center w-5 h-5 border ${opt.badgeColor} font-bold transition-colors duration-100`}>
                  {opt.keyLabel}
                </span>

                <span className="text-[10px] font-bold font-mono">
                  +{xp} XP
                </span>
              </div>

              {/* Center: Label & Sublabel */}
              <div className="flex flex-col items-center my-0.5 text-center">
                <span className="font-mono font-bold text-sm sm:text-base leading-tight uppercase tracking-wider">
                  {opt.label}
                </span>
                <span className="text-[11px] font-sans opacity-75 mt-0.5">
                  {opt.subLabel}
                </span>
              </div>

              {/* Bottom: Next Interval Preview */}
              <div className={`mt-2 pt-1.5 border-t ${opt.borderTopColor} w-full text-center transition-colors duration-100`}>
                <span className="font-sans text-xs font-semibold tracking-tight">
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
