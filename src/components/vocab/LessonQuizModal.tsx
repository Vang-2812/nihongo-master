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
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
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
      <div className="fixed inset-0 z-50 bg-[#FAFAF9] overflow-y-auto flex flex-col">
        {/* Sticky top control bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="px-2 py-0.5 text-xs font-mono font-medium bg-stone-100 text-stone-700 border border-stone-300 shrink-0 rounded-none">
              {lesson.bookTitle}
            </span>
            <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 truncate max-w-[160px] sm:max-w-md">
              {lesson.title}
            </span>
            <span className="hidden sm:inline-flex text-xs font-mono px-2 py-0.5 bg-stone-50 text-stone-500 border border-stone-200 rounded-none">
              {selectedScope === 'selected'
                ? `Đang luyện ${quizItems.length} từ chọn lọc`
                : `Đang luyện toàn bộ ${quizItems.length} từ`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 transition-colors rounded-none shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát ra bài học</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>

        {/* Embedded Quiz Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
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
              autoPlayAudio={autoPlayAudio}
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
      title: 'Ghép Ký Tự',
      badge: 'BUILDER',
      description: 'Ghép ô moras thành từ',
      icon: Sparkles,
    },
    {
      id: 'choice' as LessonQuizMode,
      title: 'Trắc Nghiệm',
      badge: '4 ĐÁP ÁN',
      description: 'Chọn 1 trong 4 đáp án',
      icon: CheckCircle2,
    },
    {
      id: 'matching' as LessonQuizMode,
      title: 'Ghép Thẻ',
      badge: 'MATCH',
      description: 'Nối cặp từ & ý nghĩa',
      icon: Dices,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white border border-stone-300 rounded-none shadow-xl max-w-xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Modal Sticky Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-0.5">
              <Dices className="w-3.5 h-3.5 shrink-0" />
              <span>LUYỆN TẬP QUIZLET</span>
              <span>·</span>
              <span className="text-stone-700 font-medium truncate">{lesson.bookTitle}</span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 truncate">
              {lesson.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1 font-mono text-xs transition-colors rounded-none shrink-0"
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 overscroll-contain">
          {/* Step 1: Chọn Phạm vi từ vựng */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              1. Phạm vi từ vựng:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option A: Full Lesson */}
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`flex items-center justify-between p-2.5 border text-left transition-all rounded-none ${
                  selectedScope === 'all'
                    ? 'border-stone-900 bg-stone-100 text-stone-900 font-medium shadow-xs'
                    : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-stone-600 shrink-0" />
                  <span className="font-sans text-xs sm:text-sm font-semibold truncate">
                    Toàn bài ({lesson.items.length} từ)
                  </span>
                </div>
                {selectedScope === 'all' && (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                )}
              </button>

              {/* Option B: Selected Words */}
              <button
                type="button"
                disabled={isSelectedScopeDisabled}
                onClick={() => setSelectedScope('selected')}
                className={`flex items-center justify-between p-2.5 border text-left transition-all rounded-none ${
                  isSelectedScopeDisabled
                    ? 'opacity-50 cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-stone-400'
                    : selectedScope === 'selected'
                    ? 'border-stone-900 bg-stone-100 text-stone-900 font-medium shadow-xs'
                    : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckSquare className="w-4 h-4 text-stone-600 shrink-0" />
                  <span className="font-sans text-xs sm:text-sm font-semibold truncate">
                    Từ chỉ định ({selectedItemIds.size} từ)
                  </span>
                </div>
                {selectedScope === 'selected' && !isSelectedScopeDisabled && (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Chọn Chế độ Quizlet */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              2. Chế độ luyện tập:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {modeCards.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-2.5 border text-left transition-all rounded-none flex flex-col justify-between min-h-[64px] ${
                      isSelected
                        ? 'border-stone-900 bg-stone-100/80 text-stone-900 shadow-xs ring-1 ring-stone-900'
                        : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                        <h3 className="font-sans font-bold text-xs sm:text-sm truncate">
                          {mode.title}
                        </h3>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-stone-500 truncate">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Tùy chọn học tập (Chiều câu hỏi, Trộn câu, Kana, Phát âm & Số lượng) */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-none space-y-2.5">
            {/* Chiều câu hỏi / đáp án */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                Chiều câu hỏi:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ja_to_vi', label: 'Nhật → Việt' },
                  { id: 'vi_to_ja', label: 'Việt → Nhật' },
                  { id: 'mixed', label: 'Lộn xộn' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDirection(d.id as any)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      direction === d.id
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">{d.label}</span>
                    {direction === d.id && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid 2 cột cho các tùy chọn cặp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-stone-200/70">
              {/* Thứ tự câu hỏi */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Thứ tự câu hỏi:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShuffleQuestions(true)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      shuffleQuestions
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Trộn ngẫu nhiên</span>
                    {shuffleQuestions && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShuffleQuestions(false)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      !shuffleQuestions
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Theo bài học</span>
                    {!shuffleQuestions && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Hiển thị Kana */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Hiển thị Kana:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowKana(true)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      showKana
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Bật Kana</span>
                    {showKana && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKana(false)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      !showKana
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Tắt Kana</span>
                    {!showKana && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Tự động phát âm */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Tự động phát âm:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoPlayAudio(true)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      autoPlayAudio
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Bật âm</span>
                    {autoPlayAudio && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoPlayAudio(false)}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      !autoPlayAudio
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>Tắt âm</span>
                    {!autoPlayAudio && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Số lượng câu / Số cặp thẻ */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  {selectedMode === 'matching' ? 'Số cặp thẻ:' : 'Số câu hỏi:'}
                </label>
                {selectedMode === 'matching' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[6, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPairCount(n)}
                        className={`px-2 py-1.5 font-mono text-xs border text-center transition-colors rounded-none ${
                          pairCount === n
                            ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {n} cặp ({n * 2} ô)
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {[10, 20, activePool.length].map((n, i) => {
                      const label = i === 2 ? 'Tất cả' : `${n} câu`;
                      const isChosen = questionCount === n || (i === 2 && questionCount >= activePool.length);

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setQuestionCount(n)}
                          className={`px-2 py-1.5 font-mono text-xs border text-center transition-colors rounded-none ${
                            isChosen
                              ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="px-5 py-3 border-t border-stone-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs font-bold text-stone-900 truncate">
              {activePool.length} từ vựng
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider truncate">
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
              className="px-3.5 py-2 border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-mono text-xs uppercase font-medium tracking-wider transition-colors rounded-none"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 border border-stone-900 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase font-medium tracking-wider transition-colors rounded-none shadow-xs active:scale-[0.98] shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Bắt đầu làm bài</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonQuizModal;
