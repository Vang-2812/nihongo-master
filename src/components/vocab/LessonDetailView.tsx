'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { LessonInfo } from '@/lib/vocabData';
import { useVocabStore, LessonProgressStatus } from '@/stores/vocabStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import VocabCard from './VocabCard';
import LessonQuizModal from './LessonQuizModal';
import AIClozeQuizModal from './AIClozeQuizModal';
import { useAIStore } from '@/stores/aiStore';
import { syncService } from '@/services/syncService';
import { ClozeExerciseItem } from '@/types/ai';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  X,
  CheckSquare,
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

  return (
    <div className="min-h-screen bg-white text-black pb-24">
      {/* Top Breadcrumbs & Back Navigation Sticky Header */}
      <div className="border-b border-black bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/tango"
            className="font-mono text-xs uppercase tracking-widest inline-flex items-center gap-1.5 text-black hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ ← BACK TO ARCHIVE ]</span>
          </Link>

          {/* Breadcrumbs trail */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-mutedForeground uppercase tracking-wider">
            <span>TANGO ARCHIVE</span>
            <span>/</span>
            <span>{lesson.bookTitle}</span>
            <span>/</span>
            <span className="text-black font-bold truncate max-w-[200px]">
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
              className="border border-black bg-white hover:bg-black hover:text-white text-black font-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors duration-100 rounded-none disabled:opacity-50"
            >
              <span>
                {isGeneratingAI
                  ? '[ AI: GENERATING... ]'
                  : aiExercises.length > 0
                  ? `[ AI EXERCISES (${aiExercises.length}) ]`
                  : '[ AI EXERCISES ]'}
              </span>
            </button>

            {/* Quick Quizlet Button */}
            <button
              type="button"
              onClick={() => setIsQuizModalOpen(true)}
              className="border border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors duration-100 rounded-none"
            >
              <span>
                {selectedItemIds.size > 0
                  ? `[ QUIZ (${selectedItemIds.size}) ]`
                  : '[ PRACTICE QUIZ ]'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Editorial Section Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-xs uppercase tracking-widest border border-black px-2 py-0.5 text-black">
              [ {lesson.level} ]
            </span>
            <span className="font-mono text-xs uppercase tracking-widest border border-black px-2 py-0.5 text-black">
              [ LESSON {String(lesson.lessonNumber).padStart(2, '0')} ]
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              {lesson.bookTitle}
            </span>
            {currentLessonStatus === 'complete' && (
              <span className="font-mono text-xs uppercase tracking-widest bg-black text-white border border-black px-2 py-0.5">
                [ COMPLETED ]
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-black uppercase leading-tight">
            {lesson.title}
          </h1>

          {lesson.subtitle && (
            <p className="font-body text-sm sm:text-base text-mutedForeground mt-2 max-w-3xl">
              {lesson.subtitle}
            </p>
          )}
        </div>

        {/* 4px Heavy Black Divider Rule */}
        <div className="h-1 bg-black w-full" />

        {/* Clean Summary Metrics Strip with Hairline Dividers */}
        <div className="border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-2 lg:grid-cols-4">
          {/* Total Words */}
          <div className="p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
              [ TOTAL WORDS · 総単語数 ]
            </span>
            <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
              {stats.total}
            </span>
          </div>

          {/* Mastered */}
          <div className="p-4 flex flex-col justify-between">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
                [ MASTERED · 習得済み ]
              </span>
              <span className="font-mono text-xs font-bold text-black">
                [{stats.progressPercent}%]
              </span>
            </div>
            <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
              {stats.knownCount}
            </span>
          </div>

          {/* Learning */}
          <div className="p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
              [ LEARNING · 学習中 ]
            </span>
            <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
              {stats.learningCount}
            </span>
          </div>

          {/* In SRS Queue */}
          <div className="p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-mutedForeground">
              [ SRS QUEUE · 復習対象 ]
            </span>
            <span className="font-serif text-4xl sm:text-5xl font-light text-black tracking-tight leading-none mt-3">
              {stats.srsCount}
            </span>
          </div>
        </div>

        {/* Batch Control Toolbar */}
        <div className="border-2 border-black p-4 mb-6 flex flex-wrap items-center justify-between gap-4 bg-white rounded-none shadow-none">
          {/* Selection tools */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs uppercase tracking-wider">
            <div className="flex items-center gap-1.5 font-bold text-black mr-2">
              <CheckSquare className="w-4 h-4 stroke-[2]" />
              <span>SELECTED: [{selectedItemIds.size} / {filteredItems.length}]</span>
            </div>

            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="border border-black bg-white hover:bg-black hover:text-white px-2.5 py-1.5 transition-colors duration-100 rounded-none text-black"
            >
              [ SELECT ALL ({filteredItems.length}) ]
            </button>

            <button
              type="button"
              onClick={handleSelectUnmastered}
              className="border border-black bg-white hover:bg-black hover:text-white px-2.5 py-1.5 transition-colors duration-100 rounded-none text-black"
            >
              [ ONLY UNMASTERED ]
            </button>

            {selectedItemIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="border border-black bg-white hover:bg-black hover:text-white px-2.5 py-1.5 transition-colors duration-100 rounded-none text-black"
              >
                [ CLEAR SELECTION ]
              </button>
            )}
          </div>

          {/* Main Action Buttons with Hover Invert */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* + ADD ALL TO SRS */}
            <button
              type="button"
              onClick={handleAddAllToSRS}
              className="border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider font-bold px-3.5 py-2 transition-colors duration-100 rounded-none shadow-none"
            >
              [ + ADD ALL TO SRS ]
            </button>

            {/* PRACTICE QUIZ */}
            <button
              type="button"
              onClick={() => setIsQuizModalOpen(true)}
              className="border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-wider font-bold px-3.5 py-2 transition-colors duration-100 rounded-none shadow-none"
            >
              <span>
                {selectedItemIds.size > 0
                  ? `[ PRACTICE QUIZ (${selectedItemIds.size}) ]`
                  : '[ PRACTICE QUIZ ]'}
              </span>
            </button>

            {/* AI CLOZE EXERCISES */}
            {aiExercises.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsAIModalOpen(true)}
                className="border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider font-bold px-3.5 py-2 transition-colors duration-100 rounded-none shadow-none"
              >
                [ AI CLOZE EXERCISES ({aiExercises.length}) ]
              </button>
            ) : (
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={() => handleGenerateAIExercises(false)}
                className="border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider font-bold px-3.5 py-2 transition-colors duration-100 rounded-none shadow-none disabled:opacity-50"
              >
                <span>
                  {isGeneratingAI
                    ? '[ GENERATING AI EXERCISES... ]'
                    : selectedItemIds.size > 0
                    ? `[ AI CLOZE EXERCISES (${selectedItemIds.size}) ]`
                    : '[ AI CLOZE EXERCISES ]'}
                </span>
              </button>
            )}

            {/* Toggle Complete Lesson */}
            <button
              type="button"
              onClick={handleToggleCompleteLesson}
              className={`border border-black px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 rounded-none ${
                currentLessonStatus === 'complete'
                  ? 'bg-black text-white hover:bg-white hover:text-black'
                  : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              {currentLessonStatus === 'complete' ? '[ ✓ COMPLETED ]' : '[ MARK COMPLETE ]'}
            </button>

            {/* Mark All Known */}
            <button
              type="button"
              onClick={handleMarkAllKnown}
              className="border border-black bg-white hover:bg-black hover:text-white px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 rounded-none text-black"
              title="Đánh dấu nhanh tất cả từ vựng trong bài này là Đã thuộc"
            >
              [ MASTER ALL ]
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="border-2 border-black p-4 mb-6 bg-white rounded-none shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedForeground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm từ vựng trong bài: Kanji, Hiragana, âm Hán Việt hoặc nghĩa..."
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

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: `ALL (${stats.total})` },
              { id: 'not_started', label: `NEW (${stats.notStartedCount})` },
              { id: 'learning', label: `LEARNING (${stats.learningCount})` },
              { id: 'known', label: `MASTERED (${stats.knownCount})` },
              { id: 'srs', label: `SRS (${stats.srsCount})` },
            ].map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as FilterTab)}
                  className={`border border-black font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-none transition-colors duration-100 whitespace-nowrap ${
                    active
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-muted'
                  }`}
                >
                  [ {tab.label} ]
                </button>
              );
            })}
          </div>
        </div>

        {/* Vocabulary Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="border-2 border-dashed border-black bg-white p-12 text-center rounded-none">
            <BookOpen className="w-10 h-10 text-black mx-auto mb-3 stroke-[1.5]" />
            <h3 className="font-serif text-lg font-normal text-black uppercase">
              KHÔNG TÌM THẤY TỪ VỰNG NÀO
            </h3>
            <p className="font-body text-sm text-mutedForeground mt-1">
              Vui lòng thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 border border-black bg-black text-white hover:bg-white hover:text-black px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 rounded-none"
            >
              [ HIỂN THỊ TẤT CẢ {stats.total} TỪ ]
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
        <div className="mt-12 pt-6 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs uppercase tracking-wider">
          {adjacent.prev ? (
            <Link
              href={`/tango/${adjacent.prev.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>[ ← BÀI TRƯỚC: {adjacent.prev.title} ]</span>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          <Link
            href="/tango"
            className="text-black hover:underline tracking-widest"
          >
            [ ↑ TRỞ VỀ DANH MỤC ]
          </Link>

          {adjacent.next ? (
            <Link
              href={`/tango/${adjacent.next.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
            >
              <span>[ BÀI TIẾP: {adjacent.next.title} → ]</span>
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
