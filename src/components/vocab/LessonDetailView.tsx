'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { LessonInfo } from '@/lib/vocabData';
import { useVocabStore, VocabLearningStatus, LessonProgressStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import VocabCard from './VocabCard';
import LessonQuizModal from './LessonQuizModal';
import AIClozeQuizModal from './AIClozeQuizModal';
import { useAIStore } from '@/stores/aiStore';
import { syncService } from '@/services/syncService';
import { ClozeExerciseItem } from '@/types/ai';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BookmarkPlus,
  CheckCircle2,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Dices,
  Filter,
  Check,
  Bookmark,
  GraduationCap,
  CheckSquare,
  Bot,
  Loader2,
} from 'lucide-react';


export interface LessonDetailViewProps {
  lesson: LessonInfo;
  adjacent: {
    prev: LessonInfo | null;
    next: LessonInfo | null;
  };
}

type FilterTab = 'all' | 'not_started' | 'learning' | 'known' | 'srs';

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({
  lesson,
  adjacent,
}) => {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // AI Exercises state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiExercises, setAiExercises] = useState<ClozeExerciseItem[]>([]);

  const { lessonProgress, vocabStatus, setLessonStatus, setVocabStatus } = useVocabStore();
  const { cards, addCard, addCards } = useSRSStore();
  const { config: aiConfig, getExercisesFromCache, saveExercisesToCache } = useAIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load AI exercises from local cache or SQLite Turso cloud
  useEffect(() => {
    if (!mounted) return;

    // 1. Check local cache
    const cached = getExercisesFromCache(lesson.id);
    if (cached && cached.exercises && cached.exercises.length > 0) {
      setAiExercises(cached.exercises);
    }

    // 2. Fetch from DB
    const syncCode = syncService.getSyncCode() || 'local';
    fetch(`/api/ai/exercises?lessonId=${lesson.id}&syncCode=${syncCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.found && Array.isArray(data.exercises) && data.exercises.length > 0) {
          setAiExercises(data.exercises);
          saveExercisesToCache(lesson.id, data.exercises, data.model || 'deepseek-chat', syncCode);
        }
      })
      .catch((err) => {
        console.warn('Could not load AI exercises from DB:', err);
      });
  }, [lesson.id, mounted, getExercisesFromCache, saveExercisesToCache]);

  // Handle Generate / Regenerate AI Exercises
  const handleGenerateAIExercises = async (isRegenerate: boolean = false) => {
    if (!aiConfig.apiKey.trim()) {
      toast.warning('Vui lòng vào Cài đặt để thêm API Key trước khi tạo bài tập AI!');
      return;
    }

    if (isRegenerate) {
      const confirmed = window.confirm(
        'Bạn có chắc chắn muốn tạo lại bài tập AI không? Thao tác này sẽ làm mới toàn bộ câu hỏi hiện tại của bài.'
      );
      if (!confirmed) return;
    }

    const targetItems =
      selectedItemIds.size > 0
        ? lesson.items.filter((item) => selectedItemIds.has(item.id))
        : lesson.items;

    if (targetItems.length === 0) {
      toast.warning('Không có từ vựng nào để tạo bài tập.');
      return;
    }

    setIsGeneratingAI(true);
    toast.info(`Đang gọi AI (${aiConfig.modelName}) tạo bài tập cho ${targetItems.length} từ vựng...`);

    try {
      const res = await fetch('/api/ai/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: aiConfig.endpointUrl,
          apiKey: aiConfig.apiKey,
          model: aiConfig.modelName,
          lessonTitle: lesson.title,
          level: lesson.level,
          words: targetItems.map((item) => ({
            id: item.id,
            word: item.word,
            reading: item.reading,
            meaning: item.meaning,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo bài tập từ AI.');
      }

      const generated: ClozeExerciseItem[] = data.exercises;
      const syncCode = syncService.getSyncCode() || 'local';

      // Save to local cache
      saveExercisesToCache(lesson.id, generated, data.model || aiConfig.modelName, syncCode);
      setAiExercises(generated);

      // Persist to SQLite Cloud
      fetch('/api/ai/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          syncCode,
          model: data.model || aiConfig.modelName,
          exercises: generated,
        }),
      }).catch((e) => console.warn('Could not persist exercises to SQLite:', e));

      toast.success(`Đã tạo thành công ${generated.length} câu bài tập AI!`);
      setIsAIModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo bài tập AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };


  const currentLessonStatus: LessonProgressStatus = mounted
    ? lessonProgress[lesson.id] || 'not_started'
    : 'not_started';

  // Calculate statistics for this lesson
  const stats = useMemo(() => {
    let knownCount = 0;
    let learningCount = 0;
    let notStartedCount = 0;
    let srsCount = 0;

    for (const item of lesson.items) {
      const st = mounted ? vocabStatus[item.id] || 'not_started' : 'not_started';
      if (st === 'known') knownCount++;
      else if (st === 'learning') learningCount++;
      else notStartedCount++;

      if (mounted && cards[`vocab_${item.id}`]) {
        srsCount++;
      }
    }

    const total = lesson.items.length;
    const progressPercent = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return {
      total,
      knownCount,
      learningCount,
      notStartedCount,
      srsCount,
      progressPercent,
    };
  }, [lesson.items, vocabStatus, cards, mounted]);

  // Handle "Add all to SRS"
  const handleAddAllToSRS = () => {
    const newCards = lesson.items.map((item) => ({
      id: `vocab_${item.id}`,
      cardType: 'vocab' as const,
      contentId: item.id,
      level: item.level,
    }));

    addCards(newCards);
    toast.success(`Đã thêm toàn bộ ${newCards.length} từ vào chu kỳ ôn tập SRS!`);
  };

  // Handle "Mark complete lesson"
  const handleToggleCompleteLesson = () => {
    if (currentLessonStatus === 'complete') {
      setLessonStatus(lesson.id, 'learning');
      toast.info(`Đã chuyển trạng thái bài sang Đang học`);
    } else {
      setLessonStatus(lesson.id, 'complete');
      toast.success(`🎉 Đã đánh dấu hoàn thành bài học "${lesson.title}"!`);
    }
  };

  // Handle "Mark all as known"
  const handleMarkAllKnown = () => {
    lesson.items.forEach((item) => {
      setVocabStatus(item.id, 'known');
      const sId = `vocab_${item.id}`;
      addCard({
        id: sId,
        cardType: 'vocab',
        contentId: item.id,
        level: item.level,
      });
      try {
        useSRSStore.getState().reviewCard(sId, 3);
        useSRSStore.getState().reviewCard(sId, 3);
      } catch (e) {}
    });
    setLessonStatus(lesson.id, 'complete');
    toast.success(`Đã đánh dấu toàn bộ ${lesson.items.length} từ là Đã thuộc!`);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return lesson.items.filter((item) => {
      const st = mounted ? vocabStatus[item.id] || 'not_started' : 'not_started';
      const inSRS = mounted ? !!cards[`vocab_${item.id}`] : false;

      // Status filter
      if (activeFilter === 'not_started' && st !== 'not_started') return false;
      if (activeFilter === 'learning' && st !== 'learning') return false;
      if (activeFilter === 'known' && st !== 'known') return false;
      if (activeFilter === 'srs' && !inSRS) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase()
          .trim();

        const inWord = item.word.toLowerCase().includes(q);
        const inReading = item.reading.toLowerCase().includes(q);
        const inMeaning = item.meaning
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(q);
        const inSino = item.sinoVietnamese
          ? item.sinoVietnamese
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes(q)
          : false;

        return inWord || inReading || inMeaning || inSino;
      }

      return true;
    });
  }, [lesson.items, activeFilter, searchQuery, vocabStatus, cards, mounted]);

  // Selection handlers
  const handleSelectAllVisible = () => {
    setSelectedItemIds(new Set(filteredItems.map((item) => item.id)));
    toast.info(`Đã chọn ${filteredItems.length} từ vựng`);
  };

  const handleSelectUnmastered = () => {
    const unmastered = lesson.items.filter((item) => {
      const st = mounted ? vocabStatus[item.id] || 'not_started' : 'not_started';
      return st !== 'known';
    });
    setSelectedItemIds(new Set(unmastered.map((item) => item.id)));
    toast.info(`Đã chọn ${unmastered.length} từ chưa thuộc`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/tango"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Danh mục giáo trình</span>
          </Link>

          {/* Breadcrumbs trail */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Từ vựng</span>
            <span>/</span>
            <span>{lesson.bookTitle}</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
              {lesson.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick AI Exercise Button */}
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={() => {
                if (aiExercises.length > 0) {
                  setIsAIModalOpen(true);
                } else {
                  handleGenerateAIExercises(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors active:scale-95 disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {isGeneratingAI
                  ? 'Đang tạo...'
                  : aiExercises.length > 0
                  ? `Bài tập AI (${aiExercises.length})`
                  : 'Bài tập AI'}
              </span>
            </button>

            {/* Quick Quizlet Button */}
            <button
              type="button"
              onClick={() => setIsQuizModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors active:scale-95"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>
                {selectedItemIds.size > 0
                  ? `Luyện Quizlet (${selectedItemIds.size} từ)`
                  : 'Luyện Quizlet'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Lesson Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClass(
                    lesson.level
                  )}`}
                >
                  {lesson.level}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {lesson.bookTitle}
                </span>
                {currentLessonStatus === 'complete' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Đã hoàn thành
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lesson.title}
              </h1>

              {lesson.subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  {lesson.subtitle}
                </p>
              )}

              {/* Progress Summary */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">
                    Tiến độ bài học: {stats.knownCount} / {stats.total} từ đã thuộc
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {stats.progressPercent}%
                  </span>
                </div>
                <ProgressBar
                  value={stats.progressPercent}
                  size="md"
                  variant={currentLessonStatus === 'complete' ? 'emerald' : 'primary'}
                />
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 flex-shrink-0">
              {/* AI Cloze Exercise Main Buttons */}
              {aiExercises.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Luyện bài tập AI ({aiExercises.length} câu)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={() => handleGenerateAIExercises(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors disabled:opacity-50 active:scale-95"
                    title="Tạo lại bộ câu hỏi bài tập bằng AI cho bài học này"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                    <span>{isGeneratingAI ? 'Đang tạo lại...' : 'Tạo lại bài tập bằng AI'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isGeneratingAI}
                  onClick={() => handleGenerateAIExercises(false)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-200" />
                  )}
                  <span>
                    {isGeneratingAI
                      ? 'Đang tạo bài tập AI...'
                      : selectedItemIds.size > 0
                      ? `Tạo bài tập AI (${selectedItemIds.size} từ)`
                      : '✨ Tạo bài tập bằng AI'}
                  </span>
                </button>
              )}

              {/* Luyện Quizlet Button */}
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Dices className="w-4 h-4" />
                <span>
                  {selectedItemIds.size > 0
                    ? `Luyện Quizlet (${selectedItemIds.size} từ)`
                    : 'Luyện Quizlet'}
                </span>
              </button>

              {/* Add All to SRS */}
              <button
                type="button"
                onClick={handleAddAllToSRS}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20 active:scale-95 transition-all"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Thêm tất cả từ vào SRS</span>
              </button>

              {/* Toggle Complete Lesson */}
              <button
                type="button"
                onClick={handleToggleCompleteLesson}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all active:scale-95 ${
                  currentLessonStatus === 'complete'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span>
                  {currentLessonStatus === 'complete'
                    ? '✓ Đã hoàn thành bài'
                    : 'Đánh dấu hoàn thành bài'}
                </span>
              </button>

              {/* Mark All Known */}
              <button
                type="button"
                onClick={handleMarkAllKnown}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Đánh dấu nhanh tất cả từ vựng trong bài này là Đã thuộc"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Thuộc tất cả từ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Search within lesson */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ vựng trong bài theo Kanji, Hiragana, âm Hán Việt hoặc nghĩa..."
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {[
                { id: 'all', label: `Tất cả (${stats.total})` },
                { id: 'not_started', label: `Chưa học (${stats.notStartedCount})` },
                { id: 'learning', label: `Đang học (${stats.learningCount})` },
                { id: 'known', label: `Đã thuộc (${stats.knownCount})` },
                { id: 'srs', label: `Trong SRS (${stats.srsCount})` },
              ].map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as FilterTab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selection Toolbar for Quizlet */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Chọn từ luyện:
            </span>
            <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
              Đã chọn {selectedItemIds.size} / {filteredItems.length} từ
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="px-2.5 py-1.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              Chọn tất cả ({filteredItems.length})
            </button>
            <button
              type="button"
              onClick={handleSelectUnmastered}
              className="px-2.5 py-1.5 rounded-lg font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors border border-amber-200/80 dark:border-amber-800/60"
            >
              Chỉ chọn từ chưa thuộc
            </button>
            {selectedItemIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="px-2.5 py-1.5 rounded-lg font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-rose-200/60 dark:border-rose-900/40"
              >
                Bỏ chọn
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsQuizModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xs active:scale-95"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>
                {selectedItemIds.size > 0
                  ? `Luyện (${selectedItemIds.size})`
                  : 'Luyện toàn bài'}
              </span>
            </button>
          </div>
        </div>

        {/* Vocabulary Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy từ vựng nào
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Vui lòng thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100"
            >
              Hiển thị tất cả {stats.total} từ vựng
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <VocabCard
                key={item.id}
                vocab={item}
                selected={selectedItemIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}

        {/* Bottom Adjacent Lesson Navigation */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {adjacent.prev ? (
            <Link
              href={`/tango/${adjacent.prev.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-semibold text-sm shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Bài trước</div>
                <div className="truncate max-w-[180px]">{adjacent.prev.title}</div>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          <Link
            href="/tango"
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← Trở về danh mục tất cả bài học
          </Link>

          {adjacent.next ? (
            <Link
              href={`/tango/${adjacent.next.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-semibold text-sm shadow-xs"
            >
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Bài tiếp theo</div>
                <div className="truncate max-w-[180px]">{adjacent.next.title}</div>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      </div>

      {/* Lesson Quizlet Modal */}
      <LessonQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        lesson={lesson}
        selectedItemIds={selectedItemIds}
        onClearSelection={() => setSelectedItemIds(new Set())}
      />

      {/* AI Cloze Exercise Modal */}
      <AIClozeQuizModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        exercises={aiExercises}
        lessonTitle={lesson.title}
        onRegenerate={() => handleGenerateAIExercises(true)}
      />
    </div>

  );
};

export default LessonDetailView;
