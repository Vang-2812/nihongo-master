'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  getAllTextbooks,
  getAllLessons,
  getLessonsByTextbook,
  LessonInfo,
  TextbookId,
  TextbookInfo,
} from '@/lib/vocabData';
import { useVocabStore, LessonProgressStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  CircleDot,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Layers,
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

  const getStatusBadge = (status: LessonProgressStatus) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Hoàn thành
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Đang học
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <CircleDot className="w-3.5 h-3.5 text-slate-400" />
            Chưa học
          </span>
        );
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'N5':
        return 'bg-emerald-500 text-white';
      case 'N4':
        return 'bg-blue-500 text-white';
      case 'N3':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-indigo-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Hero Banner & Stats Overview */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kho Từ Vựng Giáo Trình Toàn Diện</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Học Từ Vựng Theo Giáo Trình (Tango)
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                Trọn bộ 4 giáo trình chuẩn Minna no Nihongo (N5/N4), Mimikara Oboeru N3 và
                Soumatome N3 với phát âm chuẩn bản xứ và hệ thống Flashcard SRS.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tổng giáo trình
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  4 bộ sách
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tổng bài học
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {overallStats.totalLessonsCount} bài
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tổng từ vựng
                </span>
                <span className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {overallStats.totalVocab.toLocaleString()} từ
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Đã thuộc
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {overallStats.totalKnown.toLocaleString()} ({overallStats.progressPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Textbook Selector Cards / Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {textbooks.map((book) => {
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
                className={`text-left p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClass(
                        book.level
                      )}`}
                    >
                      {book.level}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {book.lessonCount} bài
                    </span>
                  </div>

                  <h2 className="font-bold text-base text-slate-900 dark:text-white leading-tight mb-1">
                    {book.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {book.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Tiến độ</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {bookKnownVocab} / {bookTotalVocab} từ ({bookPercent}%)
                    </span>
                  </div>
                  <ProgressBar value={bookPercent} size="sm" variant="primary" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học, tiêu đề, từ vựng tiếng Nhật, nghĩa tiếng Việt..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Lọc:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'not_started', label: 'Chưa học' },
                { id: 'learning', label: 'Đang học' },
                { id: 'complete', label: 'Hoàn thành' },
              ].map((chip) => {
                const active = statusFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setStatusFilter(chip.id as StatusFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lesson List Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Danh sách bài học
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredLessons.length} bài
            </span>
          </div>

          {selectedBook !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedBook('all')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả giáo trình</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Lesson Cards Grid */}
        {filteredLessons.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <BookMarked className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy bài học nào phù hợp
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedBook('all');
                setStatusFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => {
              return (
                <Link
                  key={lesson.id}
                  href={`/tango/${lesson.id}`}
                  className="group block rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md relative flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Book badge & Status badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getLevelBadgeClass(
                            lesson.level
                          )}`}
                        >
                          {lesson.level}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                          {lesson.bookTitle}
                        </span>
                      </div>
                      {getStatusBadge(lesson.status)}
                    </div>

                    {/* Lesson Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {lesson.title}
                    </h3>

                    {/* Lesson Subtitle / Theme */}
                    {lesson.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {lesson.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Footer: Vocab Count & Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {lesson.items.length} từ vựng
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Đã thuộc {lesson.knownCount}/{lesson.items.length} (
                        {lesson.progressPercent}%)
                      </span>
                    </div>

                    <ProgressBar
                      value={lesson.progressPercent}
                      size="sm"
                      variant={
                        lesson.status === 'complete'
                          ? 'emerald'
                          : lesson.status === 'learning'
                          ? 'amber'
                          : 'primary'
                      }
                    />

                    <div className="flex items-center justify-end mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Vào học bài này</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
