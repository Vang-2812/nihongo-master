'use client';

import React, { useState, useMemo } from 'react';
import { KanjiItem, parseKanjiMeaning } from '@/lib/kanjiData';
import { KanjiLevel } from '@/stores/kanjiStore';
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
  Languages,
} from 'lucide-react';

export type KanjiQuizMode = 'choice' | 'matching' | 'builder';
export type KanjiQuizScope = 'all' | 'filtered' | 'selected';

export interface KanjiQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: KanjiLevel;
  filteredKanji: KanjiItem[];
  allLevelKanji: KanjiItem[];
  selectedKanjiChars: Set<string>;
  onClearSelection?: () => void;
}

export const KanjiQuizModal: React.FC<KanjiQuizModalProps> = ({
  isOpen,
  onClose,
  level,
  filteredKanji,
  allLevelKanji,
  selectedKanjiChars,
  onClearSelection,
}) => {
  const [selectedMode, setSelectedMode] = useState<KanjiQuizMode>('choice');
  const [selectedScope, setSelectedScope] = useState<KanjiQuizScope>(
    selectedKanjiChars.size >= 4 ? 'selected' : 'all'
  );
  const [direction, setDirection] = useState<'ja_to_vi' | 'vi_to_ja' | 'mixed'>('ja_to_vi');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [showKana, setShowKana] = useState<boolean>(true);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [pairCount, setPairCount] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync default scope when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      if (selectedKanjiChars.size >= 4) {
        setSelectedScope('selected');
      } else {
        setSelectedScope('all');
      }
    }
  }, [isOpen, selectedKanjiChars.size]);

  // Convert KanjiItem to QuizItem for Choice & Matching
  const mapToQuizItem = (k: KanjiItem, mode: KanjiQuizMode): QuizItem => {
    const parsed = parseKanjiMeaning(k.meaning_vi, k.character);

    const onList = k.onyomi?.slice(0, 2).join('・') || '';
    const kunList = k.kunyomi?.slice(0, 2).join('・') || '';
    const readingList = [kunList, onList].filter(Boolean).join(' / ');

    const meaningLabel = parsed.sinoVietnamese
      ? `${parsed.sinoVietnamese}${parsed.meaning ? ` (${parsed.meaning})` : ''}`
      : parsed.meaning || k.meaning_vi;

    // In Reading Builder mode: user constructs the primary reading (Kunyomi or Onyomi)
    if (mode === 'builder') {
      const targetReading =
        k.kunyomi && k.kunyomi.length > 0 && k.kunyomi[0]
          ? k.kunyomi[0]
          : k.onyomi && k.onyomi.length > 0 && k.onyomi[0]
          ? k.onyomi[0]
          : k.character;

      return {
        id: k.character,
        word: targetReading,
        reading: k.character,
        meaning: `${k.character} 【${parsed.sinoVietnamese || ''}】: ${parsed.meaning || k.meaning_vi}`,
        sinoVietnamese: parsed.sinoVietnamese,
        level: k.level || level,
        type: 'kanji',
      };
    }

    return {
      id: k.character,
      word: k.character,
      reading: readingList || k.character,
      meaning: meaningLabel,
      sinoVietnamese: parsed.sinoVietnamese,
      level: k.level || level,
      type: 'kanji',
    };
  };

  // Pre-mapped items for active mode
  const allLevelQuizItems = useMemo(
    () => allLevelKanji.map((k) => mapToQuizItem(k, selectedMode)),
    [allLevelKanji, selectedMode, level]
  );

  const filteredQuizItems = useMemo(
    () => filteredKanji.map((k) => mapToQuizItem(k, selectedMode)),
    [filteredKanji, selectedMode, level]
  );

  const selectedQuizItems = useMemo(
    () =>
      allLevelKanji
        .filter((k) => selectedKanjiChars.has(k.character))
        .map((k) => mapToQuizItem(k, selectedMode)),
    [allLevelKanji, selectedKanjiChars, selectedMode, level]
  );

  // Determine active item pool based on scope
  const activePool = useMemo(() => {
    if (selectedScope === 'selected' && selectedQuizItems.length >= 4) {
      return selectedQuizItems;
    }
    if (selectedScope === 'filtered' && filteredQuizItems.length >= 4) {
      return filteredQuizItems;
    }
    return allLevelQuizItems;
  }, [selectedScope, selectedQuizItems, filteredQuizItems, allLevelQuizItems]);

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
    const titleText = `Kanji ${level} - ${
      selectedScope === 'selected'
        ? `Các chữ chỉ định (${quizItems.length} chữ)`
        : selectedScope === 'filtered'
        ? `Theo bộ lọc (${quizItems.length} chữ)`
        : `Toàn bộ cấp độ (${quizItems.length} chữ)`
    }`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col">
        {/* Sticky top control bar */}
        <div className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
              JLPT {level}
            </span>
            <span className="text-xs sm:text-base font-semibold text-white truncate max-w-[160px] sm:max-w-md">
              Hán tự Kanji {level}
            </span>
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {selectedScope === 'selected'
                ? `Đang luyện ${quizItems.length} chữ chọn lọc`
                : selectedScope === 'filtered'
                ? `Đang luyện ${quizItems.length} chữ theo bộ lọc`
                : `Đang luyện toàn bộ ${quizItems.length} chữ`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát ra danh mục</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>

        {/* Embedded Quiz Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
          {selectedMode === 'choice' && (
            <MultipleChoiceQuiz
              items={quizItems}
              allPool={allLevelQuizItems}
              title={`Trắc Nghiệm Hán Tự ${level}`}
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
              title={`Ghép Thẻ Hán Tự ${level}`}
              subtitle={titleText}
              showKana={showKana}
              onExit={() => setIsPlaying(false)}
            />
          )}

          {selectedMode === 'builder' && (
            <WordBuilderQuiz
              items={quizItems}
              title={`Ghép Âm Đọc Hán Tự ${level}`}
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
  const isSelectedScopeDisabled = selectedKanjiChars.size < 4;
  const isFilteredScopeDisabled = filteredKanji.length < 4;

  const modesConfig = [
    {
      id: 'choice' as KanjiQuizMode,
      title: 'Trắc nghiệm 4 đáp án',
      description: 'Nhận diện mặt chữ Hán, âm Hán Việt và nghĩa nhanh chóng.',
      icon: Dices,
      badge: 'Phổ biến nhất',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-500/40',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'matching' as KanjiQuizMode,
      title: 'Ghép thẻ Match Pairs',
      description: 'Nối cặp chữ Hán tương ứng với nghĩa và âm Hán Việt để rèn phản xạ.',
      icon: Sparkles,
      badge: 'Phản xạ nhanh',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-500/40',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'builder' as KanjiQuizMode,
      title: 'Ghép âm đọc Furigana',
      description: 'Lắp ráp các ô ký tự Hiragana để tạo nên cách đọc On/Kun của chữ Hán.',
      icon: Layers,
      badge: 'Học phát âm',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-500/40',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slideUp sm:animate-scaleUp">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Luyện tập Quizlet Kanji
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  JLPT {level}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ôn luyện và kiểm tra kiến thức Hán tự {level}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Step 1: Chọn phạm vi Hán tự */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Phạm vi chữ Hán cần luyện:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedScope === 'all'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Toàn bộ cấp độ
                  </span>
                  {selectedScope === 'all' && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {allLevelKanji.length} chữ {level}
                </span>
              </button>

              <button
                type="button"
                disabled={isFilteredScopeDisabled}
                onClick={() => setSelectedScope('filtered')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isFilteredScopeDisabled
                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    : selectedScope === 'filtered'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Theo bộ lọc
                  </span>
                  {selectedScope === 'filtered' && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredKanji.length} chữ đang lọc
                </span>
              </button>

              <button
                type="button"
                disabled={isSelectedScopeDisabled}
                onClick={() => setSelectedScope('selected')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelectedScopeDisabled
                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                    : selectedScope === 'selected'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Chữ đã chọn
                  </span>
                  {selectedScope === 'selected' && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedKanjiChars.size} chữ chọn lọc
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Chọn Chế độ Luyện tập */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Chọn Chế độ Quizlet:
            </label>
            <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
              {modesConfig.map((mode) => {
                const IconComponent = mode.icon;
                const isSelected = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`group relative p-2.5 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${mode.bg} ${mode.color}`}>
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate">
                            {mode.title}
                          </h3>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${mode.badgeColor}`}>
                            {mode.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {mode.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Tùy chọn học tập (Chiều câu hỏi, Trộn câu & Phiên âm) */}
          <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            {selectedMode !== 'builder' && (
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
                    <span className="truncate">Hán tự → Nghĩa</span>
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
                    <span className="truncate">Nghĩa → Hán tự</span>
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
            )}

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
                  <span className="truncate">Theo bảng chữ</span>
                  {!shuffleQuestions && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Hiển thị âm đọc On/Kun:
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
                  <span className="truncate">Bật âm On/Kun</span>
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
                  <span className="truncate">Ẩn âm (Chỉ Hán tự)</span>
                  {!showKana && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Số lượng câu / thẻ */}
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
                {[10, 20, 50, activePool.length].map((n, i) => {
                  const label = i === 3 ? 'Tất cả' : `${n} câu`;
                  const isChosen =
                    questionCount === n || (i === 3 && questionCount >= activePool.length);

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
              {activePool.length} chữ Kanji {level}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedMode === 'choice'
                ? 'Trắc nghiệm 4 đáp án'
                : selectedMode === 'matching'
                ? 'Ghép thẻ Match Pairs'
                : 'Ghép âm đọc Furigana'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={activePool.length === 0}
              onClick={() => setIsPlaying(true)}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default KanjiQuizModal;
