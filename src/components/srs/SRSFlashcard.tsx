'use client';

import React, { useState } from 'react';
import { SRSCard } from '@/stores/srsStore';
import { ResolvedCardContent, resolveCardContent } from '@/lib/cardResolver';
import { speakJapanese } from '@/lib/tts';
import {
  Volume2,
  RotateCw,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Languages,
  BookmarkCheck,
  Layers,
} from 'lucide-react';

export interface SRSFlashcardProps {
  card: SRSCard;
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
  resolvedContent?: ResolvedCardContent;
}

export const SRSFlashcard: React.FC<SRSFlashcardProps> = ({
  card,
  isFlipped,
  onFlip,
  className = '',
  resolvedContent,
}) => {
  const [showFrontReading, setShowFrontReading] = useState(false);
  const content = resolvedContent || resolveCardContent(card);

  const handleAudio = (e: React.MouseEvent, text?: string) => {
    e.stopPropagation();
    speakJapanese(text || content.title);
  };

  const toggleFrontReading = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFrontReading((prev) => !prev);
  };

  const isKanji = content.cardType === 'kanji';

  return (
    <div
      className={`perspective-1000 w-full max-w-xl mx-auto min-h-[390px] sm:min-h-[440px] select-none ${className}`}
    >
      <div
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Mặt sau của thẻ flashcard, bấm để lật lại mặt trước' : 'Mặt trước của thẻ flashcard, bấm để lật xem đáp án'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFlip();
          }
        }}
        className={`relative w-full h-full min-h-[390px] sm:min-h-[440px] transition-transform duration-500 transform-style-3d cursor-pointer rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================== FRONT FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-2 border-indigo-100/90 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-xl shadow-indigo-500/5 p-6 sm:p-8 flex flex-col justify-between transition-colors"
        >
          {/* Front Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                  isKanji
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
                }`}
              >
                {isKanji ? <Languages className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>{isKanji ? 'Hán tự' : 'Từ vựng'}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {content.level}
              </span>
            </div>

            {/* Front Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-all active:scale-95 shadow-xs"
              title="Nghe phát âm (Phím R)"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Front Body: Japanese word/kanji & optional reading toggle */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
            {/* Optional Hint Reading */}
            {showFrontReading && content.reading && (
              <span className="text-base sm:text-lg font-medium text-indigo-600 dark:text-indigo-400 tracking-wider mb-2 font-japanese animate-fadeIn">
                {content.reading}
              </span>
            )}

            {/* Main Word / Character */}
            <h2
              className={`font-bold tracking-tight text-slate-900 dark:text-white select-none transition-all ${
                isKanji
                  ? 'text-6xl sm:text-8xl font-serif py-2'
                  : 'text-4xl sm:text-5xl lg:text-6xl font-japanese py-3'
              }`}
            >
              {content.title}
            </h2>

            {/* Front Reading/Hint Toggle Button */}
            {content.reading && (
              <button
                type="button"
                onClick={toggleFrontReading}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {showFrontReading ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn gợi ý cách đọc</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Gợi ý cách đọc</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Front Footer: Hint to flip */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 font-bold text-[11px] shadow-2xs">
              Space
            </span>
            <span>hoặc bấm vào thẻ để lật đáp án</span>
            <RotateCw className="w-3.5 h-3.5 ml-1 text-slate-400" />
          </div>
        </div>

        {/* ==================== BACK FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-b from-white via-slate-50/70 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-xl shadow-indigo-500/10 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto transition-colors"
        >
          {/* Back Header: Badges & SRS Info */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                  isKanji
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
                }`}
              >
                {isKanji ? 'Hán tự' : 'Từ vựng'} • {content.level}
              </span>

              {/* Repetition & Interval metadata badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>Lặp {card.repetitions} lần • {card.interval} ngày</span>
              </span>
            </div>

            {/* Back Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-xs shrink-0"
              title="Nghe lại phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Back Main Content */}
          <div className="my-3 space-y-3">
            {/* Word & Reading & Sino-Vietnamese */}
            <div className="text-center">
              {content.reading && (
                <div className="text-sm sm:text-base font-medium text-indigo-600 dark:text-indigo-400 font-japanese tracking-wide">
                  {content.reading}
                </div>
              )}

              <h2
                className={`font-bold text-slate-900 dark:text-white font-japanese ${
                  isKanji ? 'text-4xl sm:text-5xl font-serif' : 'text-3xl sm:text-4xl'
                }`}
              >
                {content.title}
              </h2>

              {/* Sino-Vietnamese reading (âm Hán Việt) in bold uppercase */}
              {content.sinoVietnamese && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm sm:text-base font-extrabold tracking-widest bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 shadow-2xs font-mono uppercase">
                    {content.sinoVietnamese}
                  </span>
                </div>
              )}
            </div>

            {/* Vietnamese Meaning & Details */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug text-center">
                {content.meaning}
              </p>

              {content.meaningEn && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 italic">
                  {content.meaningEn}
                </p>
              )}

              {/* Kanji Specifics: Onyomi, Kunyomi, Stroke count */}
              {isKanji && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                  {content.onyomi && content.onyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 uppercase">
                        Âm On:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-japanese">
                        {content.onyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.kunyomi && content.kunyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 uppercase">
                        Âm Kun:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-japanese">
                        {content.kunyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.strokeCount !== undefined && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span>Số nét: <strong>{content.strokeCount}</strong></span>
                      {content.mnemonic && (
                        <span className="italic truncate ml-2 text-slate-400 dark:text-slate-500">
                          Mẹo: {content.mnemonic}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Example sentence (if available) */}
            {content.example && (
              <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40 text-xs sm:text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-japanese font-medium text-slate-900 dark:text-slate-100">
                    {content.example.japanese}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAudio(e, content.example?.japanese)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 -mt-0.5"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-1 text-xs">
                  {content.example.vietnamese}
                </p>
              </div>
            )}
          </div>

          {/* Back Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
            <span>Chọn mức độ ghi nhớ bên dưới (Phím 1 - 4)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRSFlashcard;
