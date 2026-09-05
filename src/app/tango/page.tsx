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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen bg-white text-black">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground block mb-2">
            [ VOCABULARY ARCHIVE · 単語アーカイブ ]
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-black uppercase leading-none">
            VOCABULARY ARCHIVE / 単語帳
          </h1>
          <p className="font-mono text-xs sm:text-sm tracking-widest text-mutedForeground uppercase mt-3">
            [ 4 STANDARD TEXTBOOKS · {overallStats.totalLessonsCount} LESSONS · {overallStats.totalVocab.toLocaleString()} VOCABULARY ENTRIES · SRS ]
          </p>
        </div>
      </div>

      {/* 4px Heavy Black Rule */}
      <div className="h-1 bg-black w-full" />

      {/* Overall Stats Strip with Hairline Dividers */}
      <div className="border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-2 lg:grid-cols-4">
        {/* Textbooks */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
            [ TEXTBOOKS · 教科書 ]
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
            4 BỘ SÁCH
          </span>
        </div>

        {/* Total Lessons */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
            [ TOTAL LESSONS · 全課 ]
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
            {overallStats.totalLessonsCount} BÀI
          </span>
        </div>

        {/* Total Words */}
        <div className="p-4 flex flex-col justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
            [ TOTAL VOCABULARY · 総語彙 ]
          </span>
          <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
            {overallStats.totalVocab.toLocaleString()}
          </span>
        </div>

        {/* Mastered */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
              [ MASTERED · 習得済み ]
            </span>
            <span className="font-mono text-xs font-bold text-black">
              [{overallStats.progressPercent}%]
            </span>
          </div>
          <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
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
              className={`text-left border-2 border-black p-6 sm:p-7 flex flex-col justify-between transition-colors duration-100 rounded-none shadow-none group relative cursor-pointer ${
                isSelected
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              {/* Monograph Top: Book Volume Index & Level Badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-mono text-xs uppercase tracking-widest border px-2 py-0.5 ${
                    isSelected
                      ? 'border-white text-white'
                      : 'border-black text-black group-hover:border-white group-hover:text-white'
                  }`}
                >
                  [ {book.level} ]
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    isSelected ? 'text-neutral-400' : 'text-mutedForeground group-hover:text-neutral-400'
                  }`}
                >
                  VOL. 0{idx + 1}
                </span>
              </div>

              {/* Monograph Center: Giant Serif Number & Editorial Book Title */}
              <div className="my-8">
                <span
                  className={`font-serif text-6xl sm:text-7xl font-light leading-none block select-none mb-3 ${
                    isSelected ? 'text-white' : 'text-black group-hover:text-white'
                  }`}
                >
                  0{idx + 1}
                </span>
                <h2
                  className={`font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight leading-snug ${
                    isSelected ? 'text-white' : 'text-black group-hover:text-white'
                  }`}
                >
                  {book.title}
                </h2>
                <p
                  className={`font-body text-xs sm:text-sm mt-2 line-clamp-2 ${
                    isSelected ? 'text-neutral-300' : 'text-mutedForeground group-hover:text-neutral-300'
                  }`}
                >
                  {book.description}
                </p>
              </div>

              {/* Monograph Bottom: Metadata & Monospace Progress */}
              <div
                className={`pt-3 border-t font-mono text-xs uppercase tracking-wider space-y-2 ${
                  isSelected ? 'border-white' : 'border-black group-hover:border-white'
                }`}
              >
                <div
                  className={`flex items-center justify-between text-[11px] ${
                    isSelected ? 'text-neutral-300' : 'text-mutedForeground group-hover:text-neutral-300'
                  }`}
                >
                  <span>{book.lessonCount} BÀI HỌC</span>
                  <span>{book.vocabCount} TỪ VỰNG</span>
                </div>
                <div
                  className={`flex items-center justify-between font-bold text-xs ${
                    isSelected ? 'text-white' : 'text-black group-hover:text-white'
                  }`}
                >
                  <span>TIẾN ĐỘ</span>
                  <span>[{bookKnownVocab}/{bookTotalVocab} · {bookPercent}%]</span>
                </div>
                {isSelected && (
                  <div className="text-[10px] tracking-widest text-center pt-1 border-t border-white/40">
                    [ ĐANG LỌC BỘ SÁCH NÀY ]
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="border-2 border-black p-4 mb-6 bg-white rounded-none shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedForeground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài học, Kanji, Hiragana hoặc nghĩa tiếng Việt..."
            className="w-full pl-9 pr-9 py-2 border border-black bg-white text-black placeholder-neutral-400 font-mono text-xs sm:text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-black"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black hover:bg-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="font-mono text-xs uppercase tracking-wider text-mutedForeground mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> TRẠNG THÁI:
          </span>
          {[
            { id: 'all', label: 'TẤT CẢ' },
            { id: 'not_started', label: 'CHƯA HỌC' },
            { id: 'learning', label: 'ĐANG HỌC' },
            { id: 'complete', label: 'HOÀN THÀNH' },
          ].map((chip) => {
            const active = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id as StatusFilter)}
                className={`border border-black font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-none transition-colors duration-100 whitespace-nowrap ${
                  active
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-muted'
                }`}
              >
                [ {chip.label} ]
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-black uppercase">
            DANH SÁCH BÀI HỌC
          </h2>
          <span className="font-mono text-xs border border-black px-2 py-0.5 text-black">
            [{filteredLessons.length} BÀI]
          </span>
        </div>

        {selectedBook !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedBook('all')}
            className="font-mono text-xs uppercase tracking-wider text-black hover:underline flex items-center gap-1"
          >
            <span>[ XEM TẤT CẢ GIÁO TRÌNH ]</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lesson Cards Grid */}
      {filteredLessons.length === 0 ? (
        <div className="border-2 border-dashed border-black bg-white p-12 text-center rounded-none">
          <BookMarked className="w-10 h-10 text-black mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-serif text-lg font-normal text-black uppercase">
            KHÔNG TÌM THẤY BÀI HỌC NÀO PHÙ HỢP
          </h3>
          <p className="font-body text-sm text-mutedForeground mt-1">
            Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedBook('all');
              setStatusFilter('all');
            }}
            className="mt-4 border border-black bg-black text-white hover:bg-white hover:text-black px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 rounded-none"
          >
            [ XÓA TẤT CẢ BỘ LỌC ]
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => {
            return (
              <Link
                key={lesson.id}
                href={`/tango/${lesson.id}`}
                className="group block border border-black bg-white p-5 transition-colors duration-100 hover:bg-black hover:text-white rounded-none shadow-none relative flex flex-col justify-between"
              >
                <div>
                  {/* Header: Book badge & Status badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest border border-black group-hover:border-white px-1.5 py-0.5 text-black group-hover:text-white">
                        {lesson.level}
                      </span>
                      <span className="font-mono text-xs text-mutedForeground group-hover:text-neutral-300 truncate max-w-[150px]">
                        {lesson.bookTitle}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider border border-black group-hover:border-white px-1.5 py-0.5 text-black group-hover:text-white">
                      {lesson.status === 'complete' && '[ COMPLETED ]'}
                      {lesson.status === 'learning' && '[ LEARNING ]'}
                      {lesson.status === 'not_started' && '[ NEW ]'}
                    </span>
                  </div>

                  {/* Lesson Title */}
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-black group-hover:text-white leading-snug mt-2">
                    {lesson.title}
                  </h3>

                  {/* Lesson Subtitle */}
                  {lesson.subtitle && (
                    <p className="font-body text-xs text-mutedForeground group-hover:text-neutral-300 mt-1 line-clamp-2">
                      {lesson.subtitle}
                    </p>
                  )}
                </div>

                {/* Footer: Vocab Count & Progress in Mono */}
                <div className="mt-4 pt-3 border-t border-borderLight group-hover:border-neutral-800">
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="text-black group-hover:text-white">
                      {lesson.items.length} TỪ VỰNG
                    </span>
                    <span className="font-bold text-black group-hover:text-white">
                      [{lesson.knownCount}/{lesson.items.length} · {lesson.progressPercent}%]
                    </span>
                  </div>

                  <div className="flex items-center justify-end mt-3 font-mono text-xs uppercase tracking-wider text-black group-hover:text-white group-hover:translate-x-1 transition-transform">
                    <span>[ VÀO HỌC BÀI → ]</span>
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

