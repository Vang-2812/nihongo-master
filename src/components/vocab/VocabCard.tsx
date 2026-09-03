'use client';

import React, { useState, useEffect } from 'react';
import { VocabItem } from '@/lib/vocabData';
import { useVocabStore, VocabLearningStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import AudioButton from './AudioButton';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  CircleDot,
  Check,
  Sparkles,
} from 'lucide-react';

export interface VocabCardProps {
  vocab: VocabItem;
  className?: string;
  onStatusChange?: (vocabId: string, status: VocabLearningStatus) => void;
  selected?: boolean;
  onToggleSelect?: (vocabId: string) => void;
}

export const VocabCard: React.FC<VocabCardProps> = ({
  vocab,
  className = '',
  onStatusChange,
  selected = false,
  onToggleSelect,
}) => {
  const [mounted, setMounted] = useState(false);
  const { vocabStatus, setVocabStatus } = useVocabStore();
  const { cards, addCard, removeCard } = useSRSStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const srsCardId = `vocab_${vocab.id}`;
  const isInSRS = mounted ? !!cards[srsCardId] : false;
  const currentStatus: VocabLearningStatus = mounted
    ? vocabStatus[vocab.id] || 'not_started'
    : 'not_started';

  const hasKanji = /[\u4e00-\u9faf]/.test(vocab.word);
  const isDifferentReading = vocab.word !== vocab.reading && vocab.reading.trim() !== '';

  const handleToggleSRS = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInSRS) {
      removeCard(srsCardId);
      toast.info(`Đã xóa "${vocab.word}" khỏi danh sách ôn tập SRS`);
    } else {
      addCard({
        id: srsCardId,
        cardType: 'vocab',
        contentId: vocab.id,
        level: vocab.level,
      });
      toast.success(`Đã thêm "${vocab.word}" vào danh sách ôn tập SRS!`);
    }
  };

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextStatusMap: Record<VocabLearningStatus, VocabLearningStatus> = {
      not_started: 'learning',
      learning: 'known',
      known: 'not_started',
    };

    const nextStatus = nextStatusMap[currentStatus];
    setVocabStatus(vocab.id, nextStatus);
    if (onStatusChange) {
      onStatusChange(vocab.id, nextStatus);
    }

    if (nextStatus === 'known') {
      toast.success(`Đã đánh dấu "${vocab.word}" là Đã thuộc!`);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'known':
        return {
          label: 'Đã thuộc',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          classes:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
        };
      case 'learning':
        return {
          label: 'Đang học',
          icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
          classes:
            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
        };
      case 'not_started':
      default:
        return {
          label: 'Chưa học',
          icon: <CircleDot className="w-3.5 h-3.5 text-slate-400" />,
          classes:
            'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div
      className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 flex flex-col justify-between ${
        selected
          ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
          : currentStatus === 'known'
          ? 'border-emerald-200/80 dark:border-emerald-900/40'
          : currentStatus === 'learning'
          ? 'border-amber-200/80 dark:border-amber-900/40'
          : 'border-slate-200/80 dark:border-slate-800'
      } ${className}`}
    >
      {/* Top Header: Checkbox & Word & Audio & SRS & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Checkbox for custom quiz selection */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(vocab.id);
              }}
              className={`w-5 h-5 rounded-md border flex items-center justify-center mt-1 flex-shrink-0 transition-all ${
                selected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400'
              }`}
              title={selected ? 'Bỏ chọn từ này' : 'Chọn từ này để luyện Quizlet'}
            >
              {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          )}

          {/* Japanese Display with Furigana / Reading */}
          <div className="flex-1">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              {isDifferentReading ? (
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 tracking-wide font-japanese">
                    {vocab.reading}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-japanese tracking-tight">
                    {vocab.word}
                  </span>
                </div>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-japanese tracking-tight">
                  {vocab.word}
                </span>
              )}

              {/* Sino-Vietnamese (Âm Hán Việt) Badge */}
              {vocab.sinoVietnamese && hasKanji && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 self-center">
                  {vocab.sinoVietnamese}
                </span>
              )}

              {/* Word Type Badge */}
              {vocab.wordType && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 self-center">
                  {vocab.wordType}
                </span>
              )}
            </div>

            {/* Romaji display if available */}
            {vocab.romaji && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">
                {vocab.romaji}
              </span>
            )}
          </div>

          {/* Quick Audio Button */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AudioButton text={vocab.word} size="md" variant="subtle" />
          </div>
        </div>

        {/* Vietnamese Meaning */}
        <div className="mb-3">
          <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-snug">
            {vocab.meaning}
          </p>

          {/* English Meaning (Optional) */}
          {vocab.meaningEn && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
              {vocab.meaningEn}
            </p>
          )}
        </div>

        {/* Example Sentence (if present) */}
        {vocab.example && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-japanese text-slate-900 dark:text-white">
                {vocab.example.japanese}
              </span>
              <AudioButton
                text={vocab.example.japanese}
                size="sm"
                variant="ghost"
                className="opacity-70 hover:opacity-100 -mt-1"
              />
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-xs">
              {vocab.example.vietnamese}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer Actions: Status Toggle & SRS Button */}
      <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Interactive Status Cycle Button */}
        <button
          type="button"
          onClick={handleStatusCycle}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${statusInfo.classes}`}
          title="Bấm để chuyển trạng thái: Chưa học → Đang học → Đã thuộc"
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </button>

        {/* SRS Toggle Action Button */}
        <button
          type="button"
          onClick={handleToggleSRS}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
            isInSRS
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
          title={isInSRS ? 'Đã lưu trong SRS. Bấm để xóa' : 'Thêm từ này vào chu kỳ ôn tập SRS'}
        >
          {isInSRS ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Đã lưu SRS</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500" />
              <span>+ SRS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VocabCard;
