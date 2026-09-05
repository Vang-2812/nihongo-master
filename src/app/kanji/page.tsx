'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useKanjiStore, KanjiLevel, KanjiFilter, KanjiStatus } from '@/stores/kanjiStore';
import { useSRSStore } from '@/stores/srsStore';
import { getKanjiByLevel, parseKanjiMeaning } from '@/lib/kanjiData';
import KanjiGrid from '@/components/kanji/KanjiGrid';
import KanjiQuizModal from '@/components/kanji/KanjiQuizModal';
import {
  Search,
  X,
  PlusCircle,
  CheckSquare,
} from 'lucide-react';
import { toast } from '@/stores/toastStore';

const JLPT_LEVELS: KanjiLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const JLPT_TAB_STYLES: Record<KanjiLevel, { active: string; inactive: string }> = {
  N5: {
    active: 'bg-emerald-800 text-white border-emerald-800',
    inactive: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
  },
  N4: {
    active: 'bg-sky-800 text-white border-sky-800',
    inactive: 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100',
  },
  N3: {
    active: 'bg-amber-800 text-white border-amber-800',
    inactive: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
  },
  N2: {
    active: 'bg-purple-800 text-white border-purple-800',
    inactive: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
  },
  N1: {
    active: 'bg-rose-800 text-white border-rose-800',
    inactive: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100',
  },
};

const STATUS_FILTER_STYLES: Record<KanjiFilter, { active: string; inactive: string }> = {
  all: {
    active: 'bg-stone-900 text-white border-stone-900',
    inactive: 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200',
  },
  known: {
    active: 'bg-emerald-800 text-white border-emerald-800',
    inactive: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  learning: {
    active: 'bg-indigo-800 text-white border-indigo-800',
    inactive: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  },
  new: {
    active: 'bg-stone-700 text-white border-stone-700',
    inactive: 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200',
  },
};

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export default function KanjiCatalogPage() {
  const { level, filter, search, setLevel, setFilter, setSearch, kanjiStatus } =
    useKanjiStore();
  const { cards, addCards } = useSRSStore();

  const [mounted, setMounted] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleSelectChar = (char: string) => {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(char)) {
        next.delete(char);
      } else {
        next.add(char);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedChars(new Set(filteredKanji.map((k) => k.character)));
  };

  const handleClearSelection = () => {
    setSelectedChars(new Set());
  };

  // Raw list for active JLPT level
  const currentLevelKanji = useMemo(() => {
    return getKanjiByLevel(level);
  }, [level]);

  // Derive status for each kanji in current level
  const kanjiWithStatus = useMemo(() => {
    if (!mounted) {
      return currentLevelKanji.map((k) => ({
        kanji: k,
        status: 'new' as KanjiStatus,
        sinoVietnamese: '',
        meaning: '',
      }));
    }

    return currentLevelKanji.map((k) => {
      const cardId = `kanji_${k.character}`;
      const isSrs = Boolean(cards[cardId]);
      const rawStatus = kanjiStatus[k.character];

      let status: KanjiStatus = 'new';
      if (rawStatus === 'known') {
        status = 'known';
      } else if (isSrs || rawStatus === 'learning') {
        status = 'learning';
      }

      const { sinoVietnamese, meaning } = parseKanjiMeaning(
        k.meaning_vi,
        k.character
      );

      return {
        kanji: k,
        status,
        sinoVietnamese,
        meaning,
      };
    });
  }, [currentLevelKanji, kanjiStatus, cards, mounted]);

  // Statistics for active level
  const stats = useMemo(() => {
    const total = currentLevelKanji.length;
    let knownCount = 0;
    let learningCount = 0;
    let newCount = 0;

    for (const item of kanjiWithStatus) {
      if (item.status === 'known') knownCount++;
      else if (item.status === 'learning') learningCount++;
      else newCount++;
    }

    const progressPercentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return {
      total,
      knownCount,
      learningCount,
      newCount,
      progressPercentage,
    };
  }, [currentLevelKanji, kanjiWithStatus]);

  // Filter and search
  const filteredKanji = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return kanjiWithStatus
      .filter((item) => {
        // Status filter
        if (filter !== 'all' && item.status !== filter) {
          return false;
        }

        // Search query matching
        if (normalizedSearch) {
          const char = item.kanji.character;
          const sino = normalizeText(item.sinoVietnamese);
          const rawMeaning = normalizeText(item.kanji.meaning_vi);
          const detailMeaning = normalizeText(item.meaning);
          const onyomi = (item.kanji.onyomi || []).map(normalizeText).join(' ');
          const kunyomi = (item.kanji.kunyomi || []).map(normalizeText).join(' ');

          const isMatch =
            char.includes(search.trim()) ||
            sino.includes(normalizedSearch) ||
            rawMeaning.includes(normalizedSearch) ||
            detailMeaning.includes(normalizedSearch) ||
            onyomi.includes(normalizedSearch) ||
            kunyomi.includes(normalizedSearch);

          if (!isMatch) return false;
        }

        return true;
      })
      .map((item) => item.kanji);
  }, [kanjiWithStatus, filter, search]);

  const handleResetFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const handleAddAllToSRS = () => {
    const unadded = filteredKanji.filter(
      (k) => !cards[`kanji_${k.character}`] && kanjiStatus[k.character] !== 'known'
    );
    if (unadded.length === 0) {
      toast.info('Tất cả chữ Hán trong danh sách này đã có trong SRS hoặc đã thuộc');
      return;
    }

    addCards(
      unadded.map((k) => ({
        id: `kanji_${k.character}`,
        cardType: 'kanji',
        contentId: k.character,
        level: k.level || level,
      }))
    );
    toast.success(`Đã thêm ${unadded.length} chữ Kanji vào hàng đợi ôn tập SRS!`);
  };

  const statusFilters: { id: KanjiFilter; label: string; count: number }[] = [
    { id: 'all', label: 'TẤT CẢ', count: stats.total },
    { id: 'known', label: 'ĐÃ THUỘC', count: stats.knownCount },
    { id: 'learning', label: 'ĐANG HỌC (SRS)', count: stats.learningCount },
    { id: 'new', label: 'CHƯA HỌC', count: stats.newCount },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-500 block mb-2">
            KANJI REPOSITORY · 漢字アーカイブ
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-stone-900 uppercase leading-none">
            KHO HÁN TỰ
          </h1>
          <p className="font-sans text-xs sm:text-sm tracking-wider text-stone-500 uppercase mt-3 font-medium">
            2,136 THƯỜNG DỤNG HÁN TỰ · JLPT N5–N1 · BỘ THỦ & THỨ TỰ NÉT · SRS
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsQuizModalOpen(true)}
            className="border border-stone-800 bg-stone-900 text-white hover:bg-stone-800 font-sans font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-none shadow-none transition-colors duration-100"
            title={`Luyện tập Quizlet cho Kanji ${level}`}
          >
            <span>LUYỆN TẬP QUIZLET</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSelecting(!isSelecting);
              if (isSelecting) setSelectedChars(new Set());
            }}
            className={`font-sans font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-none shadow-none transition-colors duration-100 ${
              isSelecting
                ? 'border border-stone-800 bg-stone-900 text-white'
                : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 stroke-[2]" />
              <span>{isSelecting ? 'HỦY CHỌN' : 'CHỌN CHỮ'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleAddAllToSRS}
            className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 font-sans font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-none shadow-none transition-colors duration-100"
            title="Thêm toàn bộ Kanji đang hiển thị vào hàng đợi SRS"
          >
            <span className="inline-flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5 stroke-[2]" />
              <span>+ THÊM VÀO SRS</span>
            </span>
          </button>
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="h-px bg-stone-300 w-full" />

      {/* JLPT Level Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {JLPT_LEVELS.map((lvl) => {
          const isActive = level === lvl;
          const levelCount = getKanjiByLevel(lvl).length;
          const tabStyle = JLPT_TAB_STYLES[lvl];
          const styleClass = isActive ? tabStyle.active : tabStyle.inactive;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevel(lvl);
                setSelectedChars(new Set());
              }}
              className={`border font-sans font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-none transition-colors duration-100 flex items-center gap-2 ${styleClass}`}
            >
              <span>{lvl}</span>
              <span className="text-[11px] opacity-75">({levelCount})</span>
            </button>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="border-t border-b border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 py-4 grid grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
            TỔNG SỐ KANJI {level}
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-stone-900 tracking-tight leading-none mt-3">
            {stats.total}
          </span>
        </div>

        {/* Known */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
              ĐÃ THUỘC
            </span>
            <span className="font-mono text-xs font-bold text-stone-700">
              {stats.progressPercentage}%
            </span>
          </div>
          <span className="font-serif text-4xl sm:text-5xl font-light text-emerald-700 tracking-tight leading-none mt-3">
            {stats.knownCount}
          </span>
        </div>

        {/* Learning */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
            ĐANG HỌC SRS
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-indigo-800 tracking-tight leading-none mt-3">
            {stats.learningCount}
          </span>
        </div>

        {/* New */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
            CHƯA HỌC
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-stone-600 tracking-tight leading-none mt-3">
            {stats.newCount}
          </span>
        </div>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="TÌM CHỮ HÁN, HÁN VIỆT, NGHĨA, ON, KUN..."
            className="w-full pl-10 pr-10 py-2.5 border border-stone-300 bg-white text-stone-900 font-sans text-xs uppercase placeholder:text-stone-400 focus:border-stone-500 focus:ring-1 focus:ring-stone-400 focus:outline-none rounded-none shadow-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((st) => {
            const isSelected = filter === st.id;
            const chipStyle = STATUS_FILTER_STYLES[st.id];
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilter(st.id)}
                className={`px-3 py-2 border font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 flex items-center gap-1.5 ${
                  isSelected ? chipStyle.active : chipStyle.inactive
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[11px] opacity-75">({st.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Count and Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-sans text-stone-500 uppercase tracking-wider">
          <span>
            HIỂN THỊ <strong className="text-stone-900">{filteredKanji.length}</strong> / {stats.total} CHỮ KANJI {level}
          </span>
          {(search || filter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-stone-800 underline uppercase hover:text-stone-600 font-semibold"
            >
              XÓA BỘ LỌC
            </button>
          )}
        </div>

        {/* Grid List */}
        <KanjiGrid
          kanjiList={filteredKanji}
          level={level}
          onResetFilter={handleResetFilters}
          isSelecting={isSelecting}
          selectedChars={selectedChars}
          onToggleSelect={handleToggleSelectChar}
          onSelectAll={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onBatchAction={() => setIsQuizModalOpen(true)}
          batchActionLabel="LUYỆN TẬP"
        />
      </div>

      {/* Floating Selection Bar */}
      {isSelecting && (
        <div className="sticky bottom-4 z-30 mx-auto max-w-xl w-full p-4 border border-stone-300 bg-white text-stone-900 font-sans text-xs rounded-none shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 bg-stone-900 text-white font-bold shrink-0">
              {selectedChars.size}
            </span>
            <span className="truncate uppercase tracking-wider font-semibold">
              CHỮ HÁN ĐÃ CHỌN
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedChars.size === filteredKanji.length ? handleClearSelection : handleSelectAllFiltered}
              className="px-3 py-1.5 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 uppercase tracking-wider transition-colors duration-100 font-semibold rounded-none"
            >
              {selectedChars.size === filteredKanji.length ? 'BỎ CHỌN' : 'CHỌN TẤT CẢ'}
            </button>

            <button
              type="button"
              disabled={selectedChars.size < 4}
              onClick={() => setIsQuizModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 uppercase tracking-wider transition-colors duration-100 font-semibold rounded-none disabled:opacity-40 disabled:cursor-not-allowed"
              title={selectedChars.size < 4 ? 'Cần chọn tối thiểu 4 chữ để luyện tập' : ''}
            >
              <span>LUYỆN TẬP</span>
            </button>
          </div>
        </div>
      )}

      {/* Kanji Quizlet Modal */}
      <KanjiQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        level={level}
        filteredKanji={filteredKanji}
        allLevelKanji={currentLevelKanji}
        selectedKanjiChars={selectedChars}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
