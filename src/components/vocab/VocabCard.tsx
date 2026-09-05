'use client';

import React, { useState, useEffect } from 'react';
import { VocabItem } from '@/lib/vocabData';
import { useVocabStore, VocabLearningStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import AudioButton from './AudioButton';
import { Check } from 'lucide-react';

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
      if (!isInSRS) {
        addCard({
          id: srsCardId,
          cardType: 'vocab',
          contentId: vocab.id,
          level: vocab.level,
        });
      }
      try {
        useSRSStore.getState().reviewCard(srsCardId, 3);
        useSRSStore.getState().reviewCard(srsCardId, 3);
      } catch (err) {}
      toast.success(`Đã đánh dấu "${vocab.word}" là Đã thuộc!`);
    } else if (nextStatus === 'learning') {
      if (!isInSRS) {
        addCard({
          id: srsCardId,
          cardType: 'vocab',
          contentId: vocab.id,
          level: vocab.level,
        });
      }
      try {
        useSRSStore.getState().reviewCard(srsCardId, 1);
      } catch (err) {}
      toast.info(`Đã chuyển "${vocab.word}" sang Đang học`);
    } else {
      if (isInSRS) {
        removeCard(srsCardId);
      }
      toast.info(`Đã đặt lại "${vocab.word}" về Chưa học`);
    }
  };

  const getStatusButton = () => {
    switch (currentStatus) {
      case 'known':
        return {
          label: 'ĐÃ THUỘC',
          classes: 'bg-black text-white hover:bg-neutral-800',
        };
      case 'learning':
        return {
          label: 'ĐANG HỌC',
          classes: 'bg-neutral-100 text-black hover:bg-black hover:text-white',
        };
      case 'not_started':
      default:
        return {
          label: 'CHƯA HỌC',
          classes: 'bg-white text-black hover:bg-black hover:text-white',
        };
    }
  };

  const statusInfo = getStatusButton();

  return (
    <div
      className={`border border-black bg-white p-4 sm:p-5 flex flex-col justify-between rounded-none shadow-none transition-colors duration-100 ${
        selected ? 'border-2 border-black bg-neutral-100' : ''
      } ${className}`}
    >
      {/* Top Section: Checkbox & Word & Audio */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Checkbox for selection */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(vocab.id);
              }}
              className={`w-5 h-5 border border-black rounded-none flex items-center justify-center mt-1 shrink-0 transition-colors duration-100 ${
                selected
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
              title={selected ? 'Bỏ chọn từ này' : 'Chọn từ này để luyện tập'}
            >
              {selected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          )}

          {/* Japanese Display with Furigana / Reading */}
          <div className="flex-1">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              {isDifferentReading ? (
                <div className="flex flex-col">
                  <span className="font-mono text-xs sm:text-sm text-mutedForeground tracking-wide">
                    {vocab.reading}
                  </span>
                  <span className="font-serif text-xl sm:text-2xl font-bold text-black tracking-tight">
                    {vocab.word}
                  </span>
                </div>
              ) : (
                <span className="font-serif text-xl sm:text-2xl font-bold text-black tracking-tight">
                  {vocab.word}
                </span>
              )}

              {/* Sino-Vietnamese (Âm Hán Việt) Badge */}
              {vocab.sinoVietnamese && hasKanji && (
                <span className="font-mono text-[11px] uppercase tracking-widest border border-black px-1.5 py-0.5 text-black self-center">
                  {vocab.sinoVietnamese}
                </span>
              )}

              {/* Word Type Badge */}
              {vocab.wordType && (
                <span className="font-mono text-[10px] uppercase tracking-wider border border-black px-1.5 py-0.5 text-black self-center">
                  {vocab.wordType}
                </span>
              )}
            </div>

            {/* Romaji display if available */}
            {vocab.romaji && (
              <span className="font-mono text-xs text-mutedForeground italic tracking-wide mt-0.5 block">
                {vocab.romaji}
              </span>
            )}
          </div>

          {/* Quick Audio Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AudioButton text={vocab.word} size="md" variant="subtle" />
          </div>
        </div>

        {/* Vietnamese Meaning */}
        <div className="my-3">
          <p className="font-sans font-medium text-base sm:text-lg text-black leading-snug">
            {vocab.meaning}
          </p>

          {/* English Meaning (Optional) */}
          {vocab.meaningEn && (
            <p className="font-sans text-xs text-mutedForeground mt-0.5 italic">
              {vocab.meaningEn}
            </p>
          )}
        </div>

        {/* Example Sentence (if present) */}
        {vocab.example && (
          <div className="border-l-2 border-black pl-3 py-1 bg-muted my-2 rounded-none text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-serif text-black">
                {vocab.example.japanese}
              </span>
              <AudioButton
                text={vocab.example.japanese}
                size="sm"
                variant="ghost"
                className="opacity-70 hover:opacity-100 -mt-0.5"
              />
            </div>
            <p className="font-sans text-xs text-mutedForeground mt-1">
              {vocab.example.vietnamese}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer Actions: Status Toggle & SRS Button */}
      <div className="pt-3 mt-2 border-t border-black flex items-center justify-between gap-2">
        {/* Interactive Status Cycle Button */}
        <button
          type="button"
          onClick={handleStatusCycle}
          className={`border border-black px-2.5 py-1 font-sans font-medium text-xs uppercase tracking-wider transition-colors duration-100 rounded-none ${statusInfo.classes}`}
          title="Bấm để chuyển trạng thái: Chưa học → Đang học → Đã thuộc"
        >
          {statusInfo.label}
        </button>

        {/* SRS Toggle Action Button */}
        <button
          type="button"
          onClick={handleToggleSRS}
          className={`border border-black px-2.5 py-1 font-sans font-medium text-xs uppercase tracking-wider transition-colors duration-100 rounded-none ${
            isInSRS
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-white text-black hover:bg-black hover:text-white'
          }`}
          title={isInSRS ? 'Đã lưu trong SRS. Bấm để xóa' : 'Thêm từ này vào chu kỳ ôn tập SRS'}
        >
          {isInSRS ? 'SRS ✓' : '+ SRS'}
        </button>
      </div>
    </div>
  );
};

export default VocabCard;
