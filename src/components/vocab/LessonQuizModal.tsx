'use client';

import React, { useState, useMemo } from 'react';
import { LessonInfo, VocabItem } from '@/lib/vocabData';
import { QuizItem } from '@/components/quiz/MultipleChoiceQuiz';
import WordBuilderQuiz from '@/components/quiz/WordBuilderQuiz';
import MultipleChoiceQuiz from '@/components/quiz/MultipleChoiceQuiz';
import { MatchingGame } from '@/components/quiz/MatchingGame';
import {
  Sparkles,
  CheckCircle2,
  Dices,
  X,
  Play,
  Layers,
  BookOpen,
  CheckSquare,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export type LessonQuizMode = 'builder' | 'choice' | 'matching';
export type LessonQuizScope = 'all' | 'selected';

export interface LessonQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonInfo;
  selectedItemIds: Set<string>;
  onClearSelection?: () => void;
}

export const LessonQuizModal: React.FC<LessonQuizModalProps> = ({
  isOpen,
  onClose,
  lesson,
  selectedItemIds,
  onClearSelection,
}) => {
  const [selectedMode, setSelectedMode] = useState<LessonQuizMode>('builder');
  const [selectedScope, setSelectedScope] = useState<LessonQuizScope>(
    selectedItemIds.size > 0 ? 'selected' : 'all'
  );
  const [direction, setDirection] = useState<'ja_to_vi' | 'vi_to_ja' | 'mixed'>('ja_to_vi');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [showKana, setShowKana] = useState<boolean>(true);
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [pairCount, setPairCount] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync default scope when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      if (selectedItemIds.size >= 4) {
        setSelectedScope('selected');
      } else {
        setSelectedScope('all');
      }
    }
  }, [isOpen, selectedItemIds.size]);

  // Convert VocabItem to QuizItem
  const mapToQuizItem = (v: VocabItem): QuizItem => ({
    id: v.id,
    word: v.word,
    reading: v.reading,
    meaning: v.meaning,
    sinoVietnamese: v.sinoVietnamese,
    level: v.level,
    romaji: v.romaji,
    type: 'vocab',
  });

  const allLessonQuizItems = useMemo(
    () => lesson.items.map(mapToQuizItem),
    [lesson.items]
  );

  const selectedQuizItems = useMemo(
    () =>
      lesson.items
        .filter((item) => selectedItemIds.has(item.id))
        .map(mapToQuizItem),
    [lesson.items, selectedItemIds]
  );

  // Determine active item pool based on scope
  const activePool = useMemo(() => {
    if (selectedScope === 'selected' && selectedQuizItems.length > 0) {
      return selectedQuizItems;
    }
    return allLessonQuizItems;
  }, [selectedScope, selectedQuizItems, allLessonQuizItems]);

  // Final prepared quiz items (shuffled & sliced)
  const quizItems = useMemo(() => {
    let pool = [...activePool];
    if (shuffleQuestions) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    if (selectedMode !== 'matching' && questionCount < pool.length) {
      pool = pool.slice(0, questionCount);
    }
    return pool;
  }, [activePool, shuffleQuestions, selectedMode, questionCount, isPlaying]);

  if (!isOpen) return null;

  // Active playing view (Fullscreen overlay)
  if (isPlaying) {
    const titleText = `${lesson.title} - ${
      selectedScope === 'selected'
        ? `Các từ chỉ định (${quizItems.length} từ)`
        : `Toàn bài (${quizItems.length} từ)`
    }`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col">
        {/* Sticky top control bar */}
        <div className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
              {lesson.bookTitle}
            </span>
            <span className="text-xs sm:text-base font-semibold text-white truncate max-w-[160px] sm:max-w-md">
              {lesson.title}
            </span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {selectedScope === 'selected'
                ? `Đang luyện ${quizItems.length} từ chọn lọc`
                : `Đang luyện toàn bộ ${quizItems.length} từ`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát ra bài học</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>

        {/* Embedded Quiz Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
          {selectedMode === 'builder' && (
            <WordBuilderQuiz
              items={quizItems}
              title="Ghép Ký Tự Tạo Từ"
              subtitle={titleText}
              showKana={showKana}
              onExit={() => setIsPlaying(false)}
            />
          )}

          {selectedMode === 'choice' && (
            <MultipleChoiceQuiz
              items={quizItems}
              allPool={allLessonQuizItems}
              title="Trắc Nghiệm 4 Đáp Án"
              subtitle={titleText}
              direction={direction}
              showKana={showKana}
              onExit={() => setIsPlaying(false)}
            />
          )}

          {selectedMode === 'matching' && (
            <MatchingGame
              items={quizItems}
              pairCount={Math.min(quizItems.length, pairCount)}
              title="Ghép Thẻ Từ Vựng & Nghĩa"
              subtitle={titleText}
              showKana={showKana}
              onExit={() => setIsPlaying(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // Configuration Modal
  const isSelectedScopeDisabled = selectedItemIds.size < 4;

  const modeCards = [
    {
      id: 'builder' as LessonQuizMode,
      title: 'Ghép Ký Tự (Word Builder)',
      badge: '⭐ Độc Quyền',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
      description: 'Luyện phản xạ chính tả: bấm các ô ký tự moras để ghép thành từ đúng.',
      icon: Sparkles,
      iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
      accentColor: 'border-amber-500 ring-amber-500',
    },
    {
      id: 'choice' as LessonQuizMode,
      title: 'Trắc Nghiệm 4 Đáp Án',
      badge: 'Tốc độ',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
      description: 'Nhìn từ tiếng Nhật và chọn nhanh 1 trong 4 đáp án nghĩa tiếng Việt.',
      icon: CheckCircle2,
      iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60',
      accentColor: 'border-indigo-600 ring-indigo-600',
    },
    {
      id: 'matching' as LessonQuizMode,
      title: 'Ghép Thẻ (Matching Game)',
      badge: 'Ghi nhớ',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
      description: 'Nối các cặp thẻ từ vựng và nghĩa tiếng Việt tương ứng theo thời gian kỷ lục.',
      icon: Dices,
      iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
      accentColor: 'border-emerald-600 ring-emerald-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile pull indicator bar */}
        <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Dices className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Luyện tập Quizlet</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {lesson.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 overscroll-contain">
          {/* Step 1: Chọn Phạm vi từ vựng */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Chọn phạm vi từ vựng:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* Option A: Full Lesson */}
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`flex items-center sm:items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all ${
                  selectedScope === 'all'
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedScope === 'all'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedScope === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">Toàn bài ({lesson.items.length} từ)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                    Luyện tập toàn bộ {lesson.items.length} từ trong bài học này.
                  </p>
                </div>
              </button>

              {/* Option B: Selected Words */}
              <button
                type="button"
                disabled={isSelectedScopeDisabled}
                onClick={() => setSelectedScope('selected')}
                className={`flex items-center sm:items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all ${
                  isSelectedScopeDisabled
                    ? 'opacity-60 cursor-not-allowed border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'
                    : selectedScope === 'selected'
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedScope === 'selected' && !isSelectedScopeDisabled
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedScope === 'selected' && !isSelectedScopeDisabled && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">Từ chỉ định ({selectedItemIds.size} từ)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                    {isSelectedScopeDisabled
                      ? `(Chọn ít nhất 4 từ trong danh sách)`
                      : `Chỉ luyện ${selectedItemIds.size} từ bạn đã tick chọn.`}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Chọn Chế độ Quizlet */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Chọn chế độ Quizlet:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {modeCards.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative flex items-center sm:flex-col sm:items-start justify-between gap-3 ${
                      isSelected
                        ? `border-2 ${mode.accentColor} bg-indigo-50/20 dark:bg-slate-800 shadow-sm ring-1 ring-indigo-500/20`
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center sm:block gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between sm:mb-2 shrink-0">
                        <div className={`p-2 rounded-xl ${mode.iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${mode.badgeColor}`}>
                          {mode.badge}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                            {mode.title}
                          </h3>
                          <span className={`sm:hidden text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${mode.badgeColor}`}>
                            {mode.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-2">
                          {mode.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3] sm:hidden shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Tùy chọn học tập (Chiều câu hỏi, Trộn câu & Phiên âm Kana) */}
          <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                3. Chiều câu hỏi / đáp án:
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('ja_to_vi')}
                  className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1 ${
                    direction === 'ja_to_vi'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Nhật → Việt</span>
                  {direction === 'ja_to_vi' && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('vi_to_ja')}
                  className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1 ${
                    direction === 'vi_to_ja'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Việt → Nhật</span>
                  {direction === 'vi_to_ja' && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('mixed')}
                  className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1 ${
                    direction === 'mixed'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">🔀 Lộn xộn</span>
                  {direction === 'mixed' && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Thứ tự các câu hỏi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(true)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    shuffleQuestions
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">🔀 Trộn ngẫu nhiên</span>
                  {shuffleQuestions && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShuffleQuestions(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    !shuffleQuestions
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Theo bài học</span>
                  {!shuffleQuestions && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Hiển thị phiên âm Kana:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowKana(true)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    showKana
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Bật Kana (Furigana)</span>
                  {showKana && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowKana(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border text-center transition-all flex items-center justify-center gap-1.5 ${
                    !showKana
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Tắt Kana (Chỉ Kanji)</span>
                  {!showKana && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Tùy chỉnh số lượng câu / thẻ */}
          {selectedMode === 'matching' ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số cặp thẻ ghép:
              </span>
              <div className="flex items-center gap-2">
                {[6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPairCount(n)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      pairCount === n
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {n} cặp ({n * 2} ô)
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số câu hỏi:
              </span>
              <div className="flex items-center gap-1.5">
                {[10, 20, activePool.length].map((n, i) => {
                  const label = i === 2 ? 'Tất cả' : `${n} câu`;
                  const isChosen = questionCount === n || (i === 2 && questionCount >= activePool.length);

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setQuestionCount(n)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        isChosen
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {activePool.length} từ vựng
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedMode === 'builder'
                ? 'Ghép ký tự'
                : selectedMode === 'choice'
                ? 'Trắc nghiệm 4 đáp án'
                : 'Ghép thẻ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu làm bài</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonQuizModal;
