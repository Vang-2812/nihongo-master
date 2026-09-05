'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  getAllTextbooks,
  getAllLessons,
  TextbookId,
} from '@/lib/vocabData';
import { useVocabStore, LessonProgressStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import {
  Search,
  ChevronRight,
  X,
  BookMarked,
  Filter,
} from 'lucide-react';

type StatusFilter = 'all' | 'not_started' | 'learning' | 'complete';

const JLPT_BADGE_STYLES: Record<string, string> = {
  N5: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  N4: 'bg-sky-50 text-sky-800 border-sky-200',
  N3: 'bg-amber-50 text-amber-800 border-amber-200',
  N2: 'bg-purple-50 text-purple-800 border-purple-200',
  N1: 'bg-rose-50 text-rose-800 border-rose-200',
};

const STATUS_CHIP_STYLES: Record<StatusFilter, { active: string; inactive: string }> = {
  all: {
    active: 'bg-stone-900 text-white border-stone-900',
    inactive: 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200',
  },
  not_started: {
    active: 'bg-stone-700 text-white border-stone-700',
    inactive: 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200',
  },
  learning: {
    active: 'bg-indigo-700 text-white border-indigo-700',
    inactive: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  },
  complete: {
    active: 'bg-emerald-700 text-white border-emerald-700',
    inactive: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
};

export default function TangoCatalogPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedBook, setSelectedBook] = useState<TextbookId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { lessonProgress, vocabStatus } = useVocabStore();
  const { cards } = useSRSStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const textbooks = useMemo(() => getAllTextbooks(), []);
  const allLessons = useMemo(() => getAllLessons(), []);

  // Compute lesson statistics based on store state
  const lessonsWithStats = useMemo(() => {
    return allLessons.map((lesson) => {
      const status: LessonProgressStatus = mounted
        ? lessonProgress[lesson.id] || 'not_started'
        : 'not_started';

      let knownCount = 0;
      let learningCount = 0;

      if (mounted) {
        for (const item of lesson.items) {
          const st = vocabStatus[item.id];
          if (st === 'known') knownCount++;
          else if (st === 'learning') learningCount++;
        }
      }

      const totalItems = lesson.items.length;
      const progressPercent =
        totalItems > 0 ? Math.round((knownCount / totalItems) * 100) : 0;

      // Auto-derived status if not explicitly set
      let derivedStatus: LessonProgressStatus = status;
      if (status === 'not_started') {
        if (knownCount === totalItems && totalItems > 0) {
          derivedStatus = 'complete';
        } else if (knownCount > 0 || learningCount > 0) {
          derivedStatus = 'learning';
        }
      }

      return {
        ...lesson,
        status: derivedStatus,
        knownCount,
        learningCount,
        progressPercent,
      };
    });
  }, [allLessons, lessonProgress, vocabStatus, mounted]);

  // Overall catalog stats
  const overallStats = useMemo(() => {
    const totalVocab = allLessons.reduce((acc, l) => acc + l.items.length, 0);
    const totalLessonsCount = allLessons.length;
    let totalKnown = 0;
    let completedLessonsCount = 0;

    if (mounted) {
      for (const st of Object.values(vocabStatus)) {
        if (st === 'known') totalKnown++;
      }
      for (const stat of Object.values(lessonProgress)) {
        if (stat === 'complete') completedLessonsCount++;
      }
    }

    return {
      totalVocab,
      totalLessonsCount,
      totalKnown,
      completedLessonsCount,
      progressPercent:
        totalVocab > 0 ? Math.round((totalKnown / totalVocab) * 100) : 0,
    };
  }, [allLessons, vocabStatus, lessonProgress, mounted]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    let result = lessonsWithStats;

    // Filter by textbook
    if (selectedBook !== 'all') {
      result = result.filter((l) => l.bookId === selectedBook);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

      result = result.filter((l) => {
        const inTitle = l.title.toLowerCase().includes(q);
        const inSubtitle = l.subtitle ? l.subtitle.toLowerCase().includes(q) : false;
        const inLessonNum = `bài ${l.lessonNumber}`.includes(q);
        const inItems = l.items.some(
          (item) =>
            item.word.toLowerCase().includes(q) ||
            item.reading.toLowerCase().includes(q) ||
            item.meaning.toLowerCase().includes(q)
        );
        return inTitle || inSubtitle || inLessonNum || inItems;
      });
    }

    return result;
  }, [lessonsWithStats, selectedBook, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-stone-900">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500 block mb-2">
            VOCABULARY ARCHIVE · 単語アーカイブ
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-stone-900 uppercase leading-none">
            VOCABULARY ARCHIVE / 単語帳
          </h1>
          <p className="font-sans text-xs sm:text-sm tracking-wider text-stone-500 uppercase mt-3">
            4 GIÁO TRÌNH CHUẨN · {overallStats.totalLessonsCount} BÀI HỌC · {overallStats.totalVocab.toLocaleString()} TỪ VỰNG · SRS
          </p>
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="h-px bg-stone-300 w-full" />

      {/* Overall Stats Strip with Hairline Dividers */}
      <div className="border-t border-b border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 py-4 grid grid-cols-2 lg:grid-cols-4 bg-white">
        {/* Textbooks */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
            GIÁO TRÌNH · 教科書
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-stone-900 tracking-tight leading-none mt-3">
            4 BỘ SÁCH
          </span>
        </div>

        {/* Total Lessons */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
            TỔNG SỐ BÀI · 全課
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-stone-900 tracking-tight leading-none mt-3">
            {overallStats.totalLessonsCount} BÀI
          </span>
        </div>

        {/* Total Words */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
            TỔNG TỪ VỰNG · 総語彙
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-stone-900 tracking-tight leading-none mt-3">
            {overallStats.totalVocab.toLocaleString()}
          </span>
        </div>

        {/* Mastered */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
              ĐÃ THUỘC · 習得済み
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700">
              {overallStats.progressPercent}%
            </span>
          </div>
          <span className="font-serif text-4xl sm:text-5xl font-light text-emerald-700 tracking-tight leading-none mt-3">
            {overallStats.totalKnown.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Textbook Monograph Cards (High-fashion book covers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {textbooks.map((book, idx) => {
          const isSelected = selectedBook === book.id;
          const bookLessons = lessonsWithStats.filter((l) => l.bookId === book.id);
          const bookTotalVocab = book.vocabCount;
          const bookKnownVocab = bookLessons.reduce((sum, l) => sum + l.knownCount, 0);
          const bookPercent =
            bookTotalVocab > 0
              ? Math.round((bookKnownVocab / bookTotalVocab) * 100)
              : 0;

          return (
            <button
              key={book.id}
              type="button"
              onClick={() => setSelectedBook(isSelected ? 'all' : book.id)}
              className={`text-left p-6 sm:p-7 flex flex-col justify-between transition-all duration-150 rounded-none shadow-none group relative cursor-pointer ${
                isSelected
                  ? 'border-2 border-stone-800 bg-stone-50'
                  : 'border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs'
              }`}
            >
              {/* Monograph Top: Book Volume Index & Level Badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-mono text-xs uppercase tracking-widest border px-2 py-0.5 ${
                    JLPT_BADGE_STYLES[book.level] || 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {book.level}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                  VOL. 0{idx + 1}
                </span>
              </div>

              {/* Monograph Center: Giant Serif Number & Editorial Book Title */}
              <div className="my-8">
                <span className="font-serif text-6xl sm:text-7xl font-light leading-none block select-none mb-3 text-stone-900">
                  0{idx + 1}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight leading-snug text-stone-900">
                  {book.title}
                </h2>
                <p className="font-sans text-xs sm:text-sm mt-2 line-clamp-2 text-stone-600">
                  {book.description}
                </p>
              </div>

              {/* Monograph Bottom: Metadata & Monospace Progress */}
              <div className="pt-3 border-t border-stone-200 font-mono text-xs uppercase tracking-wider space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span>{book.lessonCount} BÀI HỌC</span>
                  <span>{book.vocabCount} TỪ VỰNG</span>
                </div>
                <div className="flex items-center justify-between font-bold text-xs text-stone-600">
                  <span>TIẾN ĐỘ</span>
                  <span className="text-stone-900 font-mono">{bookKnownVocab}/{bookTotalVocab} · {bookPercent}%</span>
                </div>
                {isSelected && (
                  <div className="font-sans font-medium text-[10px] tracking-wider uppercase text-center pt-1 border-t border-stone-300 text-stone-800">
                    ĐANG LỌC BỘ SÁCH NÀY
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="border border-stone-200 p-4 mb-6 bg-white rounded-none shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài học, Kanji, Hiragana hoặc nghĩa tiếng Việt..."
            className="w-full pl-9 pr-9 py-2 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 font-mono text-xs sm:text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="font-sans font-medium text-xs uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> TRẠNG THÁI:
          </span>
          {[
            { id: 'all', label: 'TẤT CẢ' },
            { id: 'not_started', label: 'CHƯA HỌC' },
            { id: 'learning', label: 'ĐANG HỌC' },
            { id: 'complete', label: 'HOÀN THÀNH' },
          ].map((chip) => {
            const active = statusFilter === chip.id;
            const styles = STATUS_CHIP_STYLES[chip.id as StatusFilter];
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id as StatusFilter)}
                className={`border font-sans font-medium text-xs uppercase tracking-wider px-3 py-1.5 rounded-none transition-colors duration-100 whitespace-nowrap ${
                  active ? styles.active : styles.inactive
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-stone-900 uppercase">
            DANH SÁCH BÀI HỌC
          </h2>
          <span className="font-mono text-xs border border-stone-200 bg-stone-100 text-stone-700 px-2 py-0.5">
            {filteredLessons.length} BÀI
          </span>
        </div>

        {selectedBook !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedBook('all')}
            className="font-sans font-medium text-xs uppercase tracking-wider text-stone-700 hover:text-stone-900 flex items-center gap-1"
          >
            <span>XEM TẤT CẢ GIÁO TRÌNH</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lesson Cards Grid */}
      {filteredLessons.length === 0 ? (
        <div className="border border-dashed border-stone-300 bg-white p-12 text-center rounded-none">
          <BookMarked className="w-10 h-10 text-stone-400 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-serif text-lg font-normal text-stone-900 uppercase">
            KHÔNG TÌM THẤY BÀI HỌC NÀO PHÙ HỢP
          </h3>
          <p className="font-sans text-sm text-stone-500 mt-1">
            Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedBook('all');
              setStatusFilter('all');
            }}
            className="mt-4 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-sans font-medium text-xs uppercase tracking-wider transition-colors duration-100 rounded-none"
          >
            XÓA TẤT CẢ BỘ LỌC
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => {
            return (
              <Link
                key={lesson.id}
                href={`/tango/${lesson.id}`}
                className="group block border border-stone-200 bg-white p-5 hover:border-stone-400 hover:shadow-xs transition-all duration-150 rounded-none shadow-none relative flex flex-col justify-between"
              >
                <div>
                  {/* Header: Book badge & Status badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] uppercase tracking-widest border px-1.5 py-0.5 ${
                        JLPT_BADGE_STYLES[lesson.level] || 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}>
                        {lesson.level}
                      </span>
                      <span className="font-sans text-xs text-stone-500 truncate max-w-[150px]">
                        {lesson.bookTitle}
                      </span>
                    </div>
                    <span className={`font-sans font-medium text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${
                      lesson.status === 'complete'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : lesson.status === 'learning'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {lesson.status === 'complete' && 'ĐÃ HOÀN THÀNH'}
                      {lesson.status === 'learning' && 'ĐANG HỌC'}
                      {lesson.status === 'not_started' && 'CHƯA HỌC'}
                    </span>
                  </div>

                  {/* Lesson Title */}
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 group-hover:text-stone-700 leading-snug mt-2 transition-colors">
                    {lesson.title}
                  </h3>

                  {/* Lesson Subtitle */}
                  {lesson.subtitle && (
                    <p className="font-sans text-xs text-stone-500 mt-1 line-clamp-2">
                      {lesson.subtitle}
                    </p>
                  )}
                </div>

                {/* Footer: Vocab Count & Progress in Mono */}
                <div className="mt-4 pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="text-stone-600">
                      {lesson.items.length} TỪ VỰNG
                    </span>
                    <span className={`font-bold ${
                      lesson.status === 'complete'
                        ? 'text-emerald-700'
                        : lesson.status === 'learning'
                        ? 'text-indigo-800'
                        : 'text-stone-900'
                    }`}>
                      {lesson.knownCount}/{lesson.items.length} · {lesson.progressPercent}%
                    </span>
                  </div>

                  <div className="flex items-center justify-end mt-3 font-sans font-medium text-xs uppercase tracking-wider text-stone-700 group-hover:text-stone-950 group-hover:translate-x-1 transition-all">
                    <span>VÀO HỌC BÀI →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

