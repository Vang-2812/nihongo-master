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
        className={`relative w-full h-full min-h-[420px] sm:min-h-[460px] transition-transform duration-500 transform-style-3d cursor-pointer rounded-none focus:outline-none focus:ring-2 focus:ring-black ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================== FRONT FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rounded-none border-2 border-black bg-white text-black shadow-none p-6 sm:p-8 flex flex-col justify-between"
        >
          {/* Front Header */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold tracking-widest uppercase border border-black bg-white text-black rounded-none">
                <span>{isKanji ? 'HÁN TỰ' : 'TỪ VỰNG'}</span>
              </span>

              <span className="px-2 py-1 text-xs font-mono font-bold tracking-wider bg-black text-white border border-black rounded-none">
                {content.level}
              </span>
            </div>

            {/* Front Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none flex items-center gap-1.5 font-mono text-xs uppercase"
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
              <span className="text-base sm:text-lg font-mono font-bold text-mutedForeground tracking-widest mb-3 animate-fadeIn">
                {content.reading}
              </span>
            )}

            {/* Main Word / Character in high-contrast Playfair Display Serif */}
            <h2
              className={`font-serif font-bold tracking-tight text-black select-none leading-none py-2 ${
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
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium uppercase tracking-wider text-black border border-black bg-white hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
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
          <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-mono text-mutedForeground uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-black font-bold">
              <span>SPACE TO FLIP</span>
              <RotateCw className="w-3.5 h-3.5" />
            </span>
            <span className="flex items-center gap-1 text-black font-bold">
              <span>R TO LISTEN</span>
            </span>
          </div>
        </div>

        {/* ==================== BACK FACE ==================== */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-none border-2 border-black bg-white text-black shadow-none p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
        >
          {/* Back Header: Badges & SRS Info */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider border border-black bg-white text-black rounded-none">
                {isKanji ? 'HÁN TỰ' : 'TỪ VỰNG'} · {content.level}
              </span>

              {/* Repetition & Interval metadata badge */}
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold tracking-wider bg-black text-white border border-black rounded-none">
                <Layers className="w-3 h-3" />
                <span>LẶP {card.repetitions} · {card.interval} NGÀY</span>
              </span>
            </div>

            {/* Back Audio Button */}
            <button
              type="button"
              onClick={(e) => handleAudio(e)}
              className="p-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none flex items-center gap-1.5 font-mono text-xs uppercase shrink-0"
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
                <div className="text-sm sm:text-base font-mono font-bold text-mutedForeground tracking-widest">
                  {content.reading}
                </div>
              )}

              <h2
                className={`font-serif font-bold text-black tracking-tight ${
                  isKanji ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'
                }`}
              >
                {content.title}
              </h2>

              {/* Sino-Vietnamese reading (âm Hán Việt) in bold solid black badge */}
              {content.sinoVietnamese && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-none text-xs sm:text-sm font-mono font-bold tracking-widest bg-black text-white border border-black uppercase">
                    ÂM HÁN: {content.sinoVietnamese}
                  </span>
                </div>
              )}
            </div>

            {/* Vietnamese Meaning & Details */}
            <div className="rounded-none bg-muted p-4 border border-black">
              <p className="font-sans text-base sm:text-lg font-bold text-black leading-snug text-center">
                {content.meaning}
              </p>

              {content.meaningEn && (
                <p className="font-sans text-xs text-mutedForeground text-center mt-1 italic">
                  {content.meaningEn}
                </p>
              )}

              {/* Kanji Specifics: Onyomi, Kunyomi, Stroke count */}
              {isKanji && (
                <div className="mt-3 pt-2.5 border-t border-black text-xs space-y-1.5">
                  {content.onyomi && content.onyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-black shrink-0 uppercase">
                        ÂM ON:
                      </span>
                      <span className="font-serif font-medium text-black">
                        {content.onyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.kunyomi && content.kunyomi.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-black shrink-0 uppercase">
                        ÂM KUN:
                      </span>
                      <span className="font-serif font-medium text-black">
                        {content.kunyomi.join('・')}
                      </span>
                    </div>
                  )}

                  {content.strokeCount !== undefined && (
                    <div className="flex items-center gap-2 font-mono text-mutedForeground">
                      <span>SỐ NÉT: <strong className="text-black">{content.strokeCount}</strong></span>
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
              <div className="p-3 rounded-none bg-white border-l-4 border-black border-y border-r border-black text-xs sm:text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-serif font-medium text-black">
                    {content.example.japanese}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAudio(e, content.example?.japanese)}
                    className="p-1 border border-black text-black hover:bg-black hover:text-white transition-colors duration-100 shrink-0"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-sans text-mutedForeground mt-1 text-xs">
                  {content.example.vietnamese}
                </p>
              </div>
            )}
          </div>

          {/* Back Footer */}
          <div className="pt-2.5 border-t-2 border-black flex items-center justify-between text-xs font-mono text-mutedForeground uppercase tracking-wider">
            <span className="text-black font-bold">1 - 4 ĐỂ ĐÁNH GIÁ</span>
            <span>R TO LISTEN</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SRSFlashcard;
