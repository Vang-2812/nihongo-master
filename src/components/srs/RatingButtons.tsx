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

      const text = output.interval === 1 ? '[ +1 DAY ]' : `[ +${output.interval} DAYS ]`;
      return { text, xp: output.xpEarned };
    } catch {
      return { text: '[ +1 DAY ]', xp: 1 };
    }
  };

  const ratingOptions: RatingOption[] = [
    {
      rating: 1,
      label: '1 · AGAIN',
      subLabel: 'Học lại',
      keyLabel: '1',
    },
    {
      rating: 2,
      label: '2 · HARD',
      subLabel: 'Khó',
      keyLabel: '2',
    },
    {
      rating: 3,
      label: '3 · GOOD',
      subLabel: 'Tốt',
      keyLabel: '3',
    },
    {
      rating: 4,
      label: '4 · EASY',
      subLabel: 'Dễ',
      keyLabel: '4',
    },
  ];

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      {/* Reminder if not flipped */}
      {!isFlipped && (
        <div className="text-center mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-black border border-black bg-white px-3 py-1 rounded-none">
            [ LẬT THẺ HOẶC BẤM 1 - 4 ĐỂ ĐÁNH GIÁ TRỰC TIẾP ]
          </span>
        </div>
      )}

      {/* 4 Sharp Rectangular Rating Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {ratingOptions.map((opt) => {
          const { text: intervalText, xp } = getIntervalText(opt.rating);

          return (
            <button
              key={opt.rating}
              type="button"
              disabled={disabled}
              onClick={() => onRate(opt.rating)}
              className="group relative flex flex-col items-center justify-between p-3 sm:p-3.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              title={`Đánh giá ${opt.label} (${opt.subLabel}) - Phím ${opt.keyLabel}. Chu kỳ tiếp theo: ${intervalText}`}
            >
              {/* Top Row: Hotkey Badge & XP */}
              <div className="w-full flex items-center justify-between gap-1 mb-1.5 font-mono text-xs">
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 border border-black group-hover:border-white font-bold transition-colors duration-100">
                  [ {opt.keyLabel} ]
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
                <span className="text-[11px] font-mono opacity-75 mt-0.5">
                  {opt.subLabel}
                </span>
              </div>

              {/* Bottom: Next Interval Preview */}
              <div className="mt-2 pt-1.5 border-t border-black group-hover:border-white w-full text-center transition-colors duration-100">
                <span className="font-mono text-xs font-bold tracking-tight">
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
