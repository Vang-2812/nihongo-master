'use client';

import React from 'react';
import Link from 'next/link';
import { useKanjiStore, KanjiStatus, KanjiLevel } from '@/stores/kanjiStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import { KanjiItem, parseKanjiMeaning } from '@/lib/kanjiData';
import { speakJapanese } from '@/lib/tts';
import { Volume2, Check } from 'lucide-react';

export interface KanjiCardProps {
  kanji: KanjiItem;
  level?: KanjiLevel;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (character: string) => void;
}

const LEVEL_BADGE_STYLES: Record<string, string> = {
  N5: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  N4: 'bg-sky-50 text-sky-800 border-sky-200',
  N3: 'bg-amber-50 text-amber-800 border-amber-200',
  N2: 'bg-purple-50 text-purple-800 border-purple-200',
  N1: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  level,
  isSelecting = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const { kanjiStatus, setStatus } = useKanjiStore();
  const { cards, addCard, removeCard } = useSRSStore();

  const cardId = `kanji_${kanji.character}`;
  const isSrsAdded = Boolean(cards[cardId]);
  const rawStatus = kanjiStatus[kanji.character];

  // Derive active status
  let status: KanjiStatus = 'new';
  if (rawStatus === 'known') {
    status = 'known';
  } else if (isSrsAdded || rawStatus === 'learning') {
    status = 'learning';
  }

  const effectiveLevel = kanji.level || level || 'N5';

  const { sinoVietnamese, meaning } = parseKanjiMeaning(
    kanji.meaning_vi,
    kanji.character
  );

  const handleToggleSRS = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSrsAdded || status === 'learning') {
      removeCard(cardId);
      setStatus(kanji.character, 'new');
      toast.info(`Đã bỏ ${kanji.character} khỏi danh sách SRS`);
    } else {
      addCard({
        id: cardId,
        cardType: 'kanji',
        contentId: kanji.character,
        level: effectiveLevel,
      });
      setStatus(kanji.character, 'learning');
      toast.success(`Đã thêm ${kanji.character} (${sinoVietnamese}) vào SRS`);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const textToSpeak =
      kanji.onyomi?.[0] || kanji.kunyomi?.[0] || kanji.character;
    speakJapanese(textToSpeak);
  };

  // Onyomi & Kunyomi previews
  const onPreview = kanji.onyomi?.slice(0, 2).join('・');
  const kunPreview = kanji.kunyomi?.slice(0, 2).join('・');

  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelecting) {
      e.preventDefault();
      onToggleSelect?.(kanji.character);
    }
  };

  return (
    <Link
      href={`/kanji/${encodeURIComponent(kanji.character)}`}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between p-4 ${
        isSelected ? 'border-2 border-stone-800 bg-stone-50' : 'border border-stone-200 bg-white'
      } hover:border-stone-400 hover:shadow-xs transition-all duration-150 rounded-none shadow-none focus:outline-none focus:ring-1 focus:ring-stone-400`}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          {/* Selection Checkbox */}
          {isSelecting && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSelect?.(kanji.character);
              }}
              className={`w-5 h-5 border rounded-none flex items-center justify-center shrink-0 transition-colors duration-100 ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'border-stone-300 bg-white text-stone-900 hover:border-stone-400'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          )}

          {/* Stroke count badge */}
          <span className="bg-stone-100 text-stone-600 border border-stone-200 font-mono text-[10px] uppercase px-1.5 py-0.5">
            {kanji.stroke_count} NÉT
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Audio button */}
          <button
            type="button"
            onClick={handleSpeak}
            title={`Nghe phát âm ${kanji.character}`}
            className="border border-stone-300 p-1 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors rounded-none"
          >
            <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Quick SRS toggle button */}
          <button
            type="button"
            onClick={handleToggleSRS}
            title={isSrsAdded || status === 'learning' ? 'Xóa khỏi SRS' : 'Thêm vào SRS'}
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-none transition-colors duration-100 ${
              isSrsAdded || status === 'learning'
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
            }`}
          >
            {isSrsAdded || status === 'learning' ? 'SRS' : '+ SRS'}
          </button>
        </div>
      </div>

      {/* Main character display */}
      <div className="flex flex-col items-center justify-center my-4 text-center">
        <span className="font-serif text-5xl sm:text-6xl text-stone-900 select-none">
          {kanji.character}
        </span>

        {/* Sino-Vietnamese reading (âm Hán Việt) */}
        <span className="mt-2 font-serif text-sm sm:text-base font-bold uppercase tracking-widest text-stone-900">
          {sinoVietnamese || kanji.character}
        </span>

        {/* Meaning in Vietnamese */}
        <p className="mt-1 font-sans text-xs sm:text-sm text-stone-600 line-clamp-1 text-center">
          {meaning || kanji.meaning_vi}
        </p>
      </div>

      {/* Footer readings and status badge */}
      <div className="pt-2 mt-2 border-t border-stone-200 font-mono text-[11px] space-y-1">
        {onPreview && (
          <div className="flex items-baseline gap-1 text-stone-600 truncate">
            <span className="text-[10px] text-stone-900 font-semibold uppercase shrink-0">
              ON:
            </span>
            <span className="truncate">{onPreview}</span>
          </div>
        )}
        {kunPreview && (
          <div className="flex items-baseline gap-1 text-stone-600 truncate">
            <span className="text-[10px] text-stone-900 font-semibold uppercase shrink-0">
              KUN:
            </span>
            <span className="truncate">{kunPreview}</span>
          </div>
        )}

        {/* Status indicator bottom badge */}
        <div className="pt-1 flex items-center justify-between">
          {status === 'known' && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 font-sans font-medium text-[10px] uppercase tracking-wider">
              ĐÃ THUỘC
            </span>
          )}
          {status === 'learning' && (
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 font-sans font-medium text-[10px] uppercase tracking-wider">
              ĐANG HỌC
            </span>
          )}
          {status === 'new' && (
            <span className="bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.5 font-sans font-medium text-[10px] uppercase tracking-wider">
              CHƯA HỌC
            </span>
          )}

          <span
            className={`font-mono font-bold text-[10px] border px-1.5 py-0.5 ${
              LEVEL_BADGE_STYLES[effectiveLevel] ||
              'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {effectiveLevel}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default KanjiCard;
