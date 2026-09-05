'use client';

import React from 'react';
import { KanjiItem } from '@/lib/kanjiData';
import { KanjiLevel } from '@/stores/kanjiStore';
import KanjiCard from './KanjiCard';
import { SearchX, RotateCcw } from 'lucide-react';

export interface KanjiGridProps {
  kanjiList: KanjiItem[];
  level?: KanjiLevel;
  onResetFilter?: () => void;
  isSelecting?: boolean;
  selectedChars?: Set<string>;
  onToggleSelect?: (character: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBatchAction?: () => void;
  batchActionLabel?: string;
}

export const KanjiGrid: React.FC<KanjiGridProps> = ({
  kanjiList,
  level,
  onResetFilter,
  isSelecting = false,
  selectedChars = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBatchAction,
  batchActionLabel,
}) => {
  if (kanjiList.length === 0) {
    return (
      <div className="border-2 border-dashed border-black bg-white p-12 text-center my-6 rounded-none shadow-none">
        <div className="w-12 h-12 border-2 border-black mx-auto mb-4 flex items-center justify-center text-black">
          <SearchX className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="font-serif text-xl sm:text-2xl font-normal text-black uppercase tracking-tight mb-2">
          KHÔNG TÌM THẤY CHỮ HÁN NÀO
        </h3>
        <p className="font-sans text-xs text-mutedForeground max-w-md mx-auto mb-6">
          Không có chữ Hán nào khớp với từ khóa hoặc bộ lọc hiện tại.
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-black bg-black text-white hover:bg-white hover:text-black font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100 rounded-none shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
            <span>ĐẶT LẠI BỘ LỌC</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Batch Action Bar */}
      {isSelecting && (
        <div className="bg-white border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 font-sans text-xs rounded-none shadow-none">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-black">
              ĐÃ CHỌN: {selectedChars.size} / {kanjiList.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedChars.size === kanjiList.length ? onClearSelection : onSelectAll}
              className="border border-black bg-white hover:bg-black hover:text-white px-3 py-1.5 font-sans font-semibold uppercase tracking-wider transition-colors duration-100 rounded-none"
            >
              {selectedChars.size === kanjiList.length ? 'BỎ CHỌN TẤT CẢ' : 'CHỌN TẤT CẢ'}
            </button>

            {onBatchAction && (
              <button
                type="button"
                disabled={selectedChars.size === 0}
                onClick={onBatchAction}
                className="border border-black bg-black text-white hover:bg-white hover:text-black px-3 py-1.5 font-sans font-semibold uppercase tracking-wider transition-colors duration-100 rounded-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {batchActionLabel || 'LUYỆN TẬP'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid Layout with Sharp Borders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {kanjiList.map((kanji) => (
          <KanjiCard
            key={`${kanji.level || level || ''}_${kanji.character}`}
            kanji={kanji}
            level={level}
            isSelecting={isSelecting}
            isSelected={selectedChars.has(kanji.character)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default KanjiGrid;
