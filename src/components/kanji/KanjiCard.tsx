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
        level: kanji.level || level || 'N5',
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
        isSelected ? 'border-2 border-black bg-neutral-100' : 'border border-black bg-white'
      } transition-colors duration-100 hover:bg-black hover:text-white rounded-none shadow-none focus:outline-none focus:ring-2 focus:ring-black`}
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
              className={`w-5 h-5 border border-black rounded-none flex items-center justify-center transition-colors duration-100 shrink-0 ${
                isSelected
                  ? 'bg-black text-white group-hover:bg-white group-hover:text-black group-hover:border-white'
                  : 'bg-white text-black group-hover:bg-black group-hover:text-white group-hover:border-white'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          )}

          {/* Stroke count badge */}
          <span className="font-mono text-[10px] tracking-wider uppercase border border-black px-1.5 py-0.5 text-black group-hover:text-white group-hover:border-white">
            {kanji.stroke_count} NÉT
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Audio button */}
          <button
            type="button"
            onClick={handleSpeak}
            title={`Nghe phát âm ${kanji.character}`}
            className="border border-black p-1 bg-transparent text-black hover:bg-black hover:text-white group-hover:border-white group-hover:text-white group-hover:hover:bg-white group-hover:hover:text-black transition-colors duration-100 rounded-none"
          >
            <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          {/* Quick SRS toggle button */}
          <button
            type="button"
            onClick={handleToggleSRS}
            title={isSrsAdded || status === 'learning' ? 'Xóa khỏi SRS' : 'Thêm vào SRS'}
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-black group-hover:border-white transition-colors duration-100 rounded-none ${
              isSrsAdded || status === 'learning'
                ? 'bg-black text-white group-hover:bg-white group-hover:text-black'
                : 'bg-transparent text-black hover:bg-black hover:text-white group-hover:text-white group-hover:hover:bg-white group-hover:hover:text-black'
            }`}
          >
            {isSrsAdded || status === 'learning' ? '[ SRS: IN ]' : '[ + SRS ]'}
          </button>
        </div>
      </div>

      {/* Main character display */}
      <div className="flex flex-col items-center justify-center my-4 text-center">
        <span className="font-serif text-5xl sm:text-6xl text-black group-hover:text-white select-none">
          {kanji.character}
        </span>

        {/* Sino-Vietnamese reading (âm Hán Việt) */}
        <span className="mt-2 font-serif text-sm sm:text-base font-bold uppercase tracking-widest text-black group-hover:text-white">
          {sinoVietnamese || kanji.character}
        </span>

        {/* Meaning in Vietnamese */}
        <p className="mt-1 font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 line-clamp-1 text-center">
          {meaning || kanji.meaning_vi}
        </p>
      </div>

      {/* Footer readings and status badge */}
      <div className="pt-2 mt-2 border-t border-borderLight group-hover:border-neutral-800 font-mono text-[11px] space-y-1">
        {onPreview && (
          <div className="flex items-baseline gap-1 text-neutral-600 group-hover:text-neutral-300 truncate">
            <span className="font-bold text-[10px] text-black group-hover:text-white uppercase shrink-0">
              ON:
            </span>
            <span className="truncate">{onPreview}</span>
          </div>
        )}
        {kunPreview && (
          <div className="flex items-baseline gap-1 text-neutral-600 group-hover:text-neutral-300 truncate">
            <span className="font-bold text-[10px] text-black group-hover:text-white uppercase shrink-0">
              KUN:
            </span>
            <span className="truncate">{kunPreview}</span>
          </div>
        )}

        {/* Status indicator bottom badge */}
        <div className="pt-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-black group-hover:text-white">
            {status === 'known' && '[ MASTERED ]'}
            {status === 'learning' && '[ IN SRS ]'}
            {status === 'new' && '[ NEW ]'}
          </span>

          <span className="font-mono font-bold text-[10px] border border-black px-1 text-black group-hover:text-white group-hover:border-white">
            {kanji.level || level}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default KanjiCard;
