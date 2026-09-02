'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useKanjiStore, KanjiLevel, KanjiFilter, KanjiStatus } from '@/stores/kanjiStore';
import { useSRSStore } from '@/stores/srsStore';
import { getKanjiByLevel, parseKanjiMeaning, KanjiItem } from '@/lib/kanjiData';
import KanjiGrid from '@/components/kanji/KanjiGrid';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  Languages,
  PlusCircle,
} from 'lucide-react';
import { toast } from '@/stores/toastStore';

const JLPT_LEVELS: KanjiLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

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
  useEffect(() => {
    setMounted(true);
  }, []);

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
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'known', label: 'Đã thuộc', count: stats.knownCount },
    { id: 'learning', label: 'Đang học (SRS)', count: stats.learningCount },
    { id: 'new', label: 'Chưa học', count: stats.newCount },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Languages className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Kho Hán Tự (Kanji)
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tra cứu hơn 2.000 chữ Hán N5 - N1, tập viết thuận tay và ôn tập lặp lại ngắt quãng SRS.
          </p>
        </div>

        {/* Quick Batch Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddAllToSRS}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            title="Thêm toàn bộ Kanji đang hiển thị vào hàng đợi SRS"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm trang này vào SRS</span>
          </button>
        </div>
      </div>

      {/* JLPT Level Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
        {JLPT_LEVELS.map((lvl) => {
          const isActive = level === lvl;
          const levelCount = getKanjiByLevel(lvl).length;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
              className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-0 scale-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span>{lvl}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                    : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {levelCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats and Progress bar banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tổng số Kanji {level}
            </div>
          </div>
        </div>

        {/* Known card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.knownCount}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {stats.progressPercentage}%
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
              Đã thuộc
            </div>
            <ProgressBar
              value={stats.knownCount}
              max={stats.total}
              variant="emerald"
              size="xs"
            />
          </div>
        </div>

        {/* Learning (SRS) card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.learningCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Đang học trong SRS
            </div>
          </div>
        </div>

        {/* New card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-200">
              {stats.newCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Chưa học
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo chữ Hán, âm Hán Việt (nhất, hải...), nghĩa, On, Kun..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((st) => {
            const isSelected = filter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-indigo-800/80 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Count and Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>
            Hiển thị{' '}
            <strong className="text-slate-900 dark:text-white">
              {filteredKanji.length}
            </strong>{' '}
            / {stats.total} chữ Kanji {level}
          </span>
          {(search || filter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Grid List */}
        <KanjiGrid
          kanjiList={filteredKanji}
          level={level}
          onResetFilter={handleResetFilters}
        />
      </div>
    </div>
  );
}
