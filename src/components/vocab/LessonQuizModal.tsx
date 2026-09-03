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
  const [direction, setDirection] = useState<'ja_to_vi' | 'vi_to_ja'>('ja_to_vi');
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

  if (!isOpen) return null;

  // Active playing view (Fullscreen overlay)
  if (isPlaying) {
    const titleText = `${lesson.title} - ${
      selectedScope === 'selected'
        ? `Các từ chỉ định (${activePool.length} từ)`
        : `Toàn bài (${activePool.length} từ)`
    }`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col">
        {/* Sticky top control bar */}
        <div className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              {lesson.bookTitle}
            </span>
            <span className="text-sm sm:text-base font-semibold text-white truncate max-w-[240px] sm:max-w-md">
              {lesson.title}
            </span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {selectedScope === 'selected'
                ? `Đang luyện ${activePool.length} từ chọn lọc`
                : `Đang luyện toàn bộ ${activePool.length} từ`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Thoát ra bài học</span>
          </button>
        </div>

        {/* Embedded Quiz Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
          {selectedMode === 'builder' && (
            <WordBuilderQuiz
              items={activePool}
              title="Ghép Ký Tự Tạo Từ"
              subtitle={titleText}
              showKana={showKana}
              onExit={() => setIsPlaying(false)}
            />
          )}

          {selectedMode === 'choice' && (
            <MultipleChoiceQuiz
              items={activePool}
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
              items={activePool}
              pairCount={Math.min(activePool.length, pairCount)}
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Dices className="w-4 h-4" />
            <span>Luyện tập Quizlet cho bài học</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {lesson.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lesson.bookTitle} • Tổng số {lesson.items.length} từ vựng
          </p>
        </div>

        {/* Step 1: Chọn Phạm vi từ vựng */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            1. Chọn phạm vi từ vựng muốn luyện:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: Full Lesson */}
            <button
              type="button"
              onClick={() => setSelectedScope('all')}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                selectedScope === 'all'
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  selectedScope === 'all'
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedScope === 'all' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Toàn bộ từ trong bài</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Luyện tập toàn bộ <strong className="text-slate-700 dark:text-slate-200">{lesson.items.length} từ</strong> trong bài học này.
                </p>
              </div>
            </button>

            {/* Option B: Selected Words */}
            <button
              type="button"
              disabled={isSelectedScopeDisabled}
              onClick={() => setSelectedScope('selected')}
              className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                isSelectedScopeDisabled
                  ? 'opacity-60 cursor-not-allowed border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'
                  : selectedScope === 'selected'
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  selectedScope === 'selected' && !isSelectedScopeDisabled
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedScope === 'selected' && !isSelectedScopeDisabled && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Các từ chỉ định</span>
                  {selectedItemIds.size > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                      {selectedItemIds.size} từ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isSelectedScopeDisabled
                    ? `(Bạn đã chọn ${selectedItemIds.size}/4 từ tối thiểu. Hãy tick chọn các từ trong danh sách)`
                    : `Chỉ luyện ${selectedItemIds.size} từ bạn đã tick chọn thủ công.`}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Chọn Chế độ Quizlet */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            2. Chọn chế độ Quizlet:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {modeCards.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `border-2 ${mode.accentColor} bg-indigo-50/20 dark:bg-slate-800 shadow-md`
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${mode.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${mode.badgeColor}`}>
                        {mode.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {mode.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Tùy chọn học tập (Chiều câu hỏi & Phiên âm Kana) */}
        <div className="mb-6 space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              3. Chiều câu hỏi / đáp án:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('ja_to_vi')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border text-left transition-all flex items-center justify-between ${
                  direction === 'ja_to_vi'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🇯🇵 Tiếng Nhật → 🇻🇳 Tiếng Việt</span>
                {direction === 'ja_to_vi' && <Check className="w-4 h-4 stroke-[3]" />}
              </button>

              <button
                type="button"
                onClick={() => setDirection('vi_to_ja')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border text-left transition-all flex items-center justify-between ${
                  direction === 'vi_to_ja'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🇻🇳 Tiếng Việt → 🇯🇵 Tiếng Nhật</span>
                {direction === 'vi_to_ja' && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Hiển thị phiên âm Kana (Furigana):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowKana(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border text-left transition-all flex items-center justify-between ${
                  showKana
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Bật Kana (Có cách đọc Furigana)</span>
                {showKana && <Check className="w-4 h-4 stroke-[3]" />}
              </button>

              <button
                type="button"
                onClick={() => setShowKana(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border text-left transition-all flex items-center justify-between ${
                  !showKana
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Tắt Kana (Chỉ hiện Kanji thực chiến)</span>
                {!showKana && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Step 4: Tùy chỉnh số lượng câu / thẻ */}
        {selectedMode === 'matching' ? (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số cặp thẻ ghép (Grid):
            </span>
            <div className="flex items-center gap-2">
              {[6, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPairCount(n)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
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
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số lượng câu hỏi:
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
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

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Bắt đầu làm bài</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonQuizModal;
