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
      className={`perspective-1000 w-full max-w-xl mx-auto min-h-[420px] sm:min-h-[460px] select-none ${className}`}
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
        className={`relative w-full h-full min-h-[420px] sm:min-h-[460px] transition-transform duration-500 transform-style-3d cursor-pointer rounded-none focus:outline-none focus:ring-1 focus:ring-stone-400 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================== FRONT FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-none border border-stone-200 bg-white text-stone-900 shadow-xs p-6 sm:p-8 flex flex-col justify-between"
        >
          {/* Front Header */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold tracking-widest uppercase border border-stone-200 bg-stone-50 text-stone-700 rounded-none">
                <span>{isKanji ? 'HÁN TỰ' : 'TỪ VỰNG'}</span>
              </span>

              <span className="px-2 py-1 text-xs font-mono font-bold tracking-wider bg-stone-100 text-stone-700 border border-stone-200 rounded-none">
                {content.level}
              </span>
            </div>

            {/* Front Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-none flex items-center gap-1.5 font-mono text-xs uppercase"
              title="Nghe phát âm (Phím R)"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">R</span>
            </button>
          </div>

          {/* Front Body: Japanese word/kanji & optional reading toggle */}
          <div className="flex-1 flex flex-col items-center justify-center my-6 text-center">
            {/* Optional Hint Reading */}
            {showFrontReading && content.reading && (
              <span className="text-base sm:text-lg font-mono font-bold text-stone-500 tracking-widest mb-3 animate-fadeIn">
                {content.reading}
              </span>
            )}

            {/* Main Word / Character */}
            <h2
              className={`font-serif font-bold tracking-tight text-stone-900 select-none leading-none py-2 ${
                isKanji
                  ? 'text-6xl sm:text-8xl'
                  : 'text-4xl sm:text-6xl lg:text-7xl'
              }`}
            >
              {content.title}
            </h2>

            {/* Front Reading/Hint Toggle Button */}
            {content.reading && (
              <button
                type="button"
                onClick={toggleFrontReading}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium uppercase tracking-wider text-stone-700 border border-stone-300 bg-white hover:bg-stone-100 transition-colors duration-100 rounded-none"
              >
                {showFrontReading ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ẨN GỢI Ý CÁCH ĐỌC</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>GỢI Ý CÁCH ĐỌC</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Front Footer: Action hints */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <kbd className="bg-stone-100 text-stone-700 border border-stone-200 font-mono text-[10px] px-1.5 py-0.5">SPACE</kbd>
              <span>TO FLIP</span>
              <RotateCw className="w-3.5 h-3.5" />
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-stone-100 text-stone-700 border border-stone-200 font-mono text-[10px] px-1.5 py-0.5">R</kbd>
              <span>TO LISTEN</span>
            </span>
          </div>
        </div>

        {/* ==================== BACK FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-none border border-stone-200 bg-white text-stone-900 shadow-xs p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
        >
          {/* Back Header: Badges & SRS Info */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider border border-stone-200 bg-stone-50 text-stone-700 rounded-none">
                {isKanji ? 'HÁN TỰ' : 'TỪ VỰNG'} · {content.level}
              </span>

              {/* Repetition & Interval metadata badge */}
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-none">
                <Layers className="w-3 h-3" />
                <span>LẶP {card.repetitions} · {card.interval} NGÀY</span>
              </span>
            </div>

            {/* Back Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-none flex items-center gap-1.5 font-mono text-xs uppercase shrink-0"
              title="Nghe lại phát âm (Phím R)"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">R</span>
            </button>
          </div>

          {/* Back Main Content */}
          <div className="my-3 space-y-3">
            {/* Word & Reading & Sino-Vietnamese */}
            <div className="text-center">
              {content.reading && (
                <div className="text-sm sm:text-base font-mono font-bold text-stone-500 tracking-widest">
                  {content.reading}
                </div>
              )}

              <h2
                className={`font-serif font-bold text-stone-900 tracking-tight ${
                  isKanji ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'
                }`}
              >
                {content.title}
              </h2>

              {/* Sino-Vietnamese reading (âm Hán Việt) */}
              {content.sinoVietnamese && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-none text-xs sm:text-sm font-mono font-bold tracking-widest bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
                    ÂM HÁN: {content.sinoVietnamese}
                  </span>
                </div>
              )}
            </div>

            {/* Vietnamese Meaning & Details */}
            <div className="rounded-none bg-stone-50 p-4 border border-stone-200">
              <p className="font-sans text-base sm:text-lg font-bold text-stone-900 leading-snug text-center">
                {content.meaning}
              </p>

              {content.meaningEn && (
                <p className="font-sans text-xs text-stone-500 text-center mt-1 italic">
                  {content.meaningEn}
                </p>
              )}

              {/* Kanji Specifics: Onyomi, Kunyomi, Stroke count */}
              {isKanji && (
                <div className="mt-3 pt-2.5 border-t border-stone-200 text-xs space-y-1.5">
                  {content.onyomi && content.onyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-stone-700 shrink-0 uppercase">
                        ÂM ON:
                      </span>
                      <span className="font-serif font-medium text-stone-900">
                        {content.onyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.kunyomi && content.kunyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-stone-700 shrink-0 uppercase">
                        ÂM KUN:
                      </span>
                      <span className="font-serif font-medium text-stone-900">
                        {content.kunyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.strokeCount !== undefined && (
                    <div className="flex items-center gap-2 font-mono text-stone-500">
                      <span>SỐ NÉT: <strong className="text-stone-900">{content.strokeCount}</strong></span>
                      {content.mnemonic && (
                        <span className="italic truncate ml-2">
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
              <div className="p-3 rounded-none bg-white border-l-4 border-stone-300 border-y border-r border-stone-200 text-xs sm:text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-serif font-medium text-stone-900">
                    {content.example.japanese}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAudio(e, content.example?.japanese)}
                    className="p-1 border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors duration-100 shrink-0"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-sans text-stone-500 mt-1 text-xs">
                  {content.example.vietnamese}
                </p>
              </div>
            )}
          </div>

          {/* Back Footer */}
          <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <kbd className="bg-stone-100 text-stone-700 border border-stone-200 font-mono text-[10px] px-1.5 py-0.5">1-4</kbd>
              <span>ĐỂ ĐÁNH GIÁ</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-stone-100 text-stone-700 border border-stone-200 font-mono text-[10px] px-1.5 py-0.5">R</kbd>
              <span>TO LISTEN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRSFlashcard;
