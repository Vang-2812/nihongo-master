'use client';

import React from 'react';
import Link from 'next/link';
import { useKanjiStore, KanjiStatus, KanjiLevel } from '@/stores/kanjiStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import { KanjiItem, parseKanjiMeaning } from '@/lib/kanjiData';
import { speakJapanese } from '@/lib/tts';
import { Volume2, Plus, Check, BookmarkCheck, Sparkles } from 'lucide-react';

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

  // Border & badge styling based on status
  const statusConfig = {
    known: {
      border: 'border-emerald-500/80 hover:border-emerald-600 dark:border-emerald-500/70',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
      label: 'Đã thuộc',
      glow: 'hover:shadow-emerald-500/10',
    },
    learning: {
      border: 'border-amber-500/80 hover:border-amber-600 dark:border-amber-500/70',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
      label: 'Đang học SRS',
      glow: 'hover:shadow-amber-500/10',
    },
    new: {
      border: 'border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-700',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      label: 'Chưa học',
      glow: 'hover:shadow-indigo-500/10',
    },
  };

  const currentConfig = statusConfig[status];

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
      className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20'
          : currentConfig.border
      } shadow-sm hover:shadow-lg ${currentConfig.glow} transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
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
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          )}

          {/* Stroke count badge */}
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            {kanji.stroke_count} nét
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Audio button */}
          <button
            type="button"
            onClick={handleSpeak}
            title={`Nghe phát âm ${kanji.character}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick SRS toggle button */}
          <button
            type="button"
            onClick={handleToggleSRS}
            title={isSrsAdded ? 'Xóa khỏi SRS' : 'Thêm vào SRS'}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
              isSrsAdded || status === 'learning'
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-600 hover:text-white'
            }`}
          >
            {isSrsAdded || status === 'learning' ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>SRS</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>SRS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main character display */}
      <div className="flex flex-col items-center justify-center my-2 text-center">
        <span className="font-serif text-5xl sm:text-6xl text-slate-900 dark:text-white group-hover:scale-105 transition-transform duration-200 select-none">
          {kanji.character}
        </span>

        {/* Sino-Vietnamese reading (âm Hán Việt) */}
        <span className="mt-2 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
          {sinoVietnamese || kanji.character}
        </span>

        {/* Meaning in Vietnamese */}
        <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-1 text-center font-medium">
          {meaning || kanji.meaning_vi}
        </p>
      </div>

      {/* Footer readings and status badge */}
      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1">
        {onPreview && (
          <div className="flex items-baseline gap-1 text-slate-500 dark:text-slate-400 truncate">
            <span className="font-semibold text-[10px] text-slate-400 uppercase shrink-0">
              On:
            </span>
            <span className="truncate">{onPreview}</span>
          </div>
        )}
        {kunPreview && (
          <div className="flex items-baseline gap-1 text-slate-500 dark:text-slate-400 truncate">
            <span className="font-semibold text-[10px] text-slate-400 uppercase shrink-0">
              Kun:
            </span>
            <span className="truncate">{kunPreview}</span>
          </div>
        )}

        {/* Status indicator bottom badge */}
        <div className="pt-1 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${currentConfig.badgeBg}`}
          >
            {status === 'known' && <BookmarkCheck className="w-3 h-3" />}
            {status === 'learning' && <Sparkles className="w-3 h-3" />}
            <span>{currentConfig.label}</span>
          </span>

          <span className="text-[10px] font-bold text-indigo-500/80 dark:text-indigo-400/80">
            {kanji.level}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default KanjiCard;
