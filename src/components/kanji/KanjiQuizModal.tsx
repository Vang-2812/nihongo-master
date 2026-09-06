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
  const [builderAnswerType, setBuilderAnswerType] = useState<'word' | 'kana'>('kana');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
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

    // In Reading Builder mode: user constructs the primary reading (Kunyomi or Onyomi) or character
    if (mode === 'builder') {
      const targetReading =
        k.kunyomi && k.kunyomi.length > 0 && k.kunyomi[0]
          ? k.kunyomi[0]
          : k.onyomi && k.onyomi.length > 0 && k.onyomi[0]
          ? k.onyomi[0]
          : k.character;

      return {
        id: k.character,
        word: k.character,
        reading: targetReading,
        meaning: `${parsed.sinoVietnamese ? `【${parsed.sinoVietnamese}】 ` : ''}${parsed.meaning || k.meaning_vi}`,
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
      <div className="fixed inset-0 z-50 bg-[#FAFAF9] overflow-y-auto flex flex-col">
        {/* Sticky top control bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
            <span className="px-2 py-0.5 text-xs font-mono font-medium bg-stone-100 text-stone-700 border border-stone-300 shrink-0 rounded-none">
              JLPT {level}
            </span>
            <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 truncate max-w-[160px] sm:max-w-md">
              Hán tự Kanji {level}
            </span>
            <span className="hidden sm:inline-flex text-xs font-mono px-2 py-0.5 bg-stone-50 text-stone-500 border border-stone-200 rounded-none">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 transition-colors rounded-none shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát ra danh mục</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>

        {/* Embedded Quiz Component */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
          {selectedMode === 'choice' && (
            <MultipleChoiceQuiz
              items={quizItems}
              allPool={allLevelQuizItems}
              title={`Trắc Nghiệm Hán Tự ${level}`}
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
              initialAnswerType={builderAnswerType}
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
      title: 'Trắc nghiệm',
      subtitle: '4 Đáp án',
      description: 'Nhận diện chữ Hán & nghĩa',
      icon: Dices,
    },
    {
      id: 'matching' as KanjiQuizMode,
      title: 'Ghép thẻ',
      subtitle: 'Matching',
      description: 'Nối Hán tự với ý nghĩa',
      icon: Sparkles,
    },
    {
      id: 'builder' as KanjiQuizMode,
      title: 'Ghép âm đọc',
      subtitle: 'Furigana',
      description: 'Ghép cách đọc On / Kun',
      icon: Layers,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white border border-stone-300 rounded-none shadow-xl max-w-xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Modal Sticky Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-0.5">
              <Languages className="w-3.5 h-3.5 shrink-0" />
              <span>LUYỆN TẬP KANJI</span>
              <span>·</span>
              <span className="text-stone-700 font-medium">JLPT {level}</span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 truncate">
              Hán tự Kanji {level}
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
          {/* Step 1: Chọn phạm vi Hán tự */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              1. Phạm vi Hán tự:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope('all')}
                className={`p-2.5 border text-left transition-all rounded-none flex items-center justify-between min-h-[44px] ${
                  selectedScope === 'all'
                    ? 'border-stone-900 bg-stone-100 text-stone-900 font-medium shadow-xs'
                    : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-sans text-xs sm:text-sm font-semibold truncate block">
                    Toàn bộ
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 truncate block">
                    {allLevelKanji.length} chữ
                  </span>
                </div>
                {selectedScope === 'all' && (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                )}
              </button>

              <button
                type="button"
                disabled={isFilteredScopeDisabled}
                onClick={() => setSelectedScope('filtered')}
                className={`p-2.5 border text-left transition-all rounded-none flex items-center justify-between min-h-[44px] ${
                  isFilteredScopeDisabled
                    ? 'opacity-50 cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-stone-400'
                    : selectedScope === 'filtered'
                    ? 'border-stone-900 bg-stone-100 text-stone-900 font-medium shadow-xs'
                    : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-sans text-xs sm:text-sm font-semibold truncate block">
                    Theo bộ lọc
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 truncate block">
                    {filteredKanji.length} chữ
                  </span>
                </div>
                {selectedScope === 'filtered' && (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                )}
              </button>

              <button
                type="button"
                disabled={isSelectedScopeDisabled}
                onClick={() => setSelectedScope('selected')}
                className={`p-2.5 border text-left transition-all rounded-none flex items-center justify-between min-h-[44px] ${
                  isSelectedScopeDisabled
                    ? 'opacity-50 cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-stone-400'
                    : selectedScope === 'selected'
                    ? 'border-stone-900 bg-stone-100 text-stone-900 font-medium shadow-xs'
                    : 'border-stone-300 bg-white hover:border-stone-400 text-stone-700'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-sans text-xs sm:text-sm font-semibold truncate block">
                    Đã chọn
                  </span>
                  <span className="font-mono text-[11px] text-stone-500 truncate block">
                    {selectedKanjiChars.size} chữ
                  </span>
                </div>
                {selectedScope === 'selected' && !isSelectedScopeDisabled && (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-stone-900 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Chọn Chế độ Luyện tập */}
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              2. Chế độ luyện tập:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {modesConfig.map((mode) => {
                const IconComponent = mode.icon;
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
                        <IconComponent className="w-3.5 h-3.5 text-stone-700 shrink-0" />
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

          {/* Step 3: Tùy chọn học tập */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-none space-y-2.5">
            {selectedMode !== 'builder' && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Chiều câu hỏi:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDirection('ja_to_vi')}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      direction === 'ja_to_vi'
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">Hán tự → Nghĩa</span>
                    {direction === 'ja_to_vi' && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirection('vi_to_ja')}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      direction === 'vi_to_ja'
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">Nghĩa → Hán tự</span>
                    {direction === 'vi_to_ja' && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirection('mixed')}
                    className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                      direction === 'mixed'
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">Lộn xộn</span>
                    {direction === 'mixed' && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                </div>
              </div>
            )}

            {/* Grid 2 cột cho các tùy chọn */}
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
                    <span>Theo bảng chữ</span>
                    {!shuffleQuestions && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Hiển thị âm On/Kun hoặc Kiểu đáp án ghép */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-1">
                  {selectedMode === 'builder' ? 'Đáp án ghép:' : 'Âm đọc On/Kun:'}
                </label>
                {selectedMode === 'builder' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBuilderAnswerType('kana')}
                      className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                        builderAnswerType === 'kana'
                          ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>Âm đọc Kana</span>
                      {builderAnswerType === 'kana' && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderAnswerType('word')}
                      className={`px-2 py-1.5 font-mono text-xs border text-center transition-all flex items-center justify-center gap-1 rounded-none ${
                        builderAnswerType === 'word'
                          ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>Chữ Hán tự</span>
                      {builderAnswerType === 'word' && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                    </button>
                  </div>
                ) : (
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
                      <span>Bật On/Kun</span>
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
                      <span>Tắt On/Kun</span>
                      {!showKana && <Check className="w-3 h-3 stroke-[2.5] shrink-0" />}
                    </button>
                  </div>
                )}
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

              {/* Số lượng câu / cặp thẻ */}
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
                  <div className="grid grid-cols-4 gap-1">
                    {[10, 20, 50, activePool.length].map((n, i) => {
                      const label = i === 3 ? 'Tất cả' : `${n}`;
                      const isChosen =
                        questionCount === n || (i === 3 && questionCount >= activePool.length);

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setQuestionCount(n)}
                          className={`px-1.5 py-1.5 font-mono text-xs border text-center transition-colors rounded-none ${
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
              {activePool.length} chữ Kanji {level}
            </span>
            <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider truncate">
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
              className="px-3.5 py-2 border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 font-mono text-xs uppercase font-medium tracking-wider transition-colors rounded-none"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={activePool.length === 0}
              onClick={() => setIsPlaying(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 border border-stone-900 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase font-medium tracking-wider transition-colors rounded-none shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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

export default KanjiQuizModal;
