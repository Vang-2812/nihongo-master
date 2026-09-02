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
}

export const KanjiGrid: React.FC<KanjiGridProps> = ({
  kanjiList,
  level,
  onResetFilter,
}) => {
  if (kanjiList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 my-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          Không tìm thấy chữ Hán nào
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5">
          Không có chữ Hán nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái
          hiện tại của bạn.
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt lại bộ lọc & tìm kiếm</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {kanjiList.map((kanji) => (
        <KanjiCard
          key={`${kanji.level || level || ''}_${kanji.character}`}
          kanji={kanji}
          level={level}
        />
      ))}
    </div>
  );
};

export default KanjiGrid;
