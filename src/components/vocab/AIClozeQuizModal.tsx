'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClozeExerciseItem, ClozeQuizMode } from '@/types/ai';
import { useAIStore } from '@/stores/aiStore';
import { useSRSStore } from '@/stores/srsStore';
import { speakJapanese } from '@/lib/tts';
import { breakdownJapaneseWord } from '@/components/quiz/WordBuilderQuiz';
import {
  Volume2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  X,
  Undo2,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';

interface TileItem {
  id: string;
  char: string;
  isDistractor: boolean;
}

const HIRAGANA_DISTRACTORS = [
  'あ', 'い', 'う', 'え', 'お',
  'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ',
  'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の',
  'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も',
  'や', 'ゆ', 'よ', 'ら', 'り',
  'る', 'れ', 'ろ', 'わ', 'を', 'ん',
  'っ', 'ゃ', 'ゅ', 'ょ'
];

const KATAKANA_DISTRACTORS = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
  'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
  'ー', 'ッ', 'ャ', 'ュ', 'ョ'
];

const KANJI_DISTRACTORS = [
  '日', '本', '人', '大', '学', '生', '先', '年', '私', '何',
  '行', '来', '見', '食', '飲', '買', '聞', '話', '出', '入',
  '友', '達', '車', '電', '気', '天', '雨', '今', '時', '分',
];

interface AIClozeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ClozeExerciseItem[];
  lessonTitle: string;
  sourceType?: 'global' | 'custom';
  quizMode?: ClozeQuizMode;
  shuffleQuestions?: boolean;
  onSwitchSource?: () => void;
  onRegenerate?: () => void;
}

export default function AIClozeQuizModal({
  isOpen,
  onClose,
  exercises,
  lessonTitle,
  sourceType = 'global',
  quizMode = 'choice',
  shuffleQuestions = false,
  onSwitchSource,
  onRegenerate,
}: AIClozeQuizModalProps) {
  const { config } = useAIStore();
  const { addXp } = useSRSStore();

  const [activeQueue, setActiveQueue] = useState<ClozeExerciseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<ClozeExerciseItem[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isTranslationVisible, setIsTranslationVisible] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Initialize and shuffle exercises when modal opens
  useEffect(() => {
    if (isOpen) {
      let list = [...exercises];
      if (shuffleQuestions) {
        // Fisher-Yates shuffle
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      setActiveQueue(list);
      setIsTranslationVisible(config.showTranslationInQuiz);
      setCurrentIndex(0);
      setSelectedOptionIndex(null);
      setSelectedTileIds([]);
      setIsAnswered(false);
      setIsCorrectAnswer(false);
      setScore(0);
      setWrongAnswers([]);
      setIsComplete(false);
    }
  }, [isOpen, exercises, shuffleQuestions, config.showTranslationInQuiz]);

  const currentExercise = useMemo(() => {
    if (!activeQueue || activeQueue.length === 0) return null;
    return activeQueue[currentIndex] || null;
  }, [activeQueue, currentIndex]);

  const handlePlayAudio = useCallback((text: string) => {
    if (!text) return;
    setIsPlayingAudio(true);
    speakJapanese(text);
    setTimeout(() => setIsPlayingAudio(false), 1500);
  }, []);

  // Auto-play audio when entering a question in audio_builder mode
  useEffect(() => {
    if (isOpen && currentExercise && quizMode === 'audio_builder' && !isAnswered && !isComplete) {
      handlePlayAudio(currentExercise.fullSentence);
    }
  }, [isOpen, currentExercise, currentIndex, quizMode, isAnswered, isComplete, handlePlayAudio]);

  // Target word characters breakdown for Audio Builder mode
  const targetChars = useMemo(() => {
    if (!currentExercise) return [];
    return breakdownJapaneseWord(currentExercise.targetWord);
  }, [currentExercise]);

  // Generate Tile Pool for Audio Builder mode
  const tilePool = useMemo(() => {
    if (!currentExercise || targetChars.length === 0) return [];

    const correctTiles: TileItem[] = targetChars.map((char, idx) => ({
      id: `tile_c_${idx}_${char}`,
      char,
      isDistractor: false,
    }));

    const isAllKatakana = /^[\u30A0-\u30FF\u30FC]+$/.test(currentExercise.targetWord);
    const hasKanji = /[\u4E00-\u9FAF]/.test(currentExercise.targetWord);

    let distractorSource = HIRAGANA_DISTRACTORS;
    if (isAllKatakana) {
      distractorSource = KATAKANA_DISTRACTORS;
    } else if (hasKanji && targetChars.length <= 3) {
      distractorSource = KANJI_DISTRACTORS;
    }

    const existingCharsSet = new Set(targetChars);
    const available = distractorSource.filter((c) => !existingCharsSet.has(c));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const distractorCount = targetChars.length <= 3 ? 3 : 2;
    const chosen = shuffled.slice(0, distractorCount);

    const distractorTiles: TileItem[] = chosen.map((char, idx) => ({
      id: `tile_d_${idx}_${char}`,
      char,
      isDistractor: true,
    }));

    return [...correctTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
  }, [currentExercise, targetChars]);

  // Placed string from selected tiles
  const placedString = useMemo(() => {
    return selectedTileIds
      .map((id) => tilePool.find((t) => t.id === id)?.char || '')
      .join('');
  }, [selectedTileIds, tilePool]);

  // Handle Tile Selection in Audio Builder mode
  const handleSelectTile = (tileId: string) => {
    if (isAnswered || isComplete) return;
    if (selectedTileIds.includes(tileId)) return;
    if (selectedTileIds.length >= targetChars.length) return;
    setSelectedTileIds((prev) => [...prev, tileId]);
  };

  const handleRemovePlacedTile = (idx: number) => {
    if (isAnswered || isComplete) return;
    setSelectedTileIds((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUndo = () => {
    if (isAnswered || isComplete || selectedTileIds.length === 0) return;
    setSelectedTileIds((prev) => prev.slice(0, -1));
  };

  const handleResetTiles = () => {
    if (isAnswered || isComplete) return;
    setSelectedTileIds([]);
  };

  // Check Audio Builder Answer
  const handleCheckWordBuilder = () => {
    if (isAnswered || !currentExercise || selectedTileIds.length === 0) return;

    const isCorrect = placedString === currentExercise.targetWord;
    setIsAnswered(true);
    setIsCorrectAnswer(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      addXp(10); // +10 XP for building correct word
    } else {
      setWrongAnswers((prev) => [...prev, currentExercise]);
    }

    handlePlayAudio(currentExercise.fullSentence);
  };

  // Handle Multiple Choice Option Click
  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentExercise) return;

    setSelectedOptionIndex(index);
    setIsAnswered(true);

    const isCorrect = index === currentExercise.correctIndex;
    setIsCorrectAnswer(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      addXp(5); // +5 XP for correct cloze question
    } else {
      setWrongAnswers((prev) => [...prev, currentExercise]);
    }

    handlePlayAudio(currentExercise.fullSentence);
  };

  // Handle Next Question
  const handleNext = () => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setSelectedTileIds([]);
      setIsAnswered(false);
      setIsCorrectAnswer(false);
    } else {
      setIsComplete(true);
    }
  };

  // Restart Quiz
  const handleRestart = () => {
    let list = [...exercises];
    if (shuffleQuestions) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    setActiveQueue(list);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setSelectedTileIds([]);
    setIsAnswered(false);
    setIsCorrectAnswer(false);
    setScore(0);
    setWrongAnswers([]);
    setIsComplete(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizMode === 'choice') {
        if (['1', '2', '3', '4'].includes(e.key) && !isAnswered && currentExercise) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx < currentExercise.options.length) {
            handleSelectOption(idx);
          }
        }
      } else if (quizMode === 'audio_builder') {
        if (e.key === 'Backspace' && !isAnswered) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'Enter' && !isAnswered && selectedTileIds.length > 0) {
          e.preventDefault();
          handleCheckWordBuilder();
        }
      }

      if ((e.key === 'Enter' || e.key === ' ') && isAnswered) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentExercise) {
          handlePlayAudio(currentExercise.fullSentence);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isComplete,
    isAnswered,
    currentExercise,
    quizMode,
    selectedTileIds.length,
    handleNext,
    handlePlayAudio,
  ]);

  if (!isOpen) return null;

  const total = activeQueue.length;
  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const accuracyPercent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAF9] overflow-y-auto flex flex-col animate-in fade-in duration-150 text-stone-900">
      {/* Sticky Top Control Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2 flex-wrap">
          <span className="px-2 py-0.5 text-xs font-mono font-medium bg-stone-100 text-stone-700 border border-stone-300 shrink-0 rounded-none">
            {sourceType === 'global' ? 'CHUẨN CLOUD' : 'AI CÁ NHÂN'}
          </span>
          <span className="text-xs sm:text-sm font-serif font-bold text-stone-900 truncate max-w-[160px] sm:max-w-md">
            {lessonTitle}
          </span>
          <span className="hidden sm:inline-flex text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-none font-bold">
            {quizMode === 'choice' ? 'TRẮC NGHIỆM' : 'NGHE & GHÉP TỪ'}
          </span>
          {shuffleQuestions && (
            <span className="hidden md:inline-flex text-[11px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-none font-medium">
              TRỘN CÂU
            </span>
          )}
          {!isComplete && (
            <span className="text-xs font-mono font-bold text-stone-500">
              CÂU {currentIndex + 1} / {total}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Switch Source Button */}
          {onSwitchSource && (
            <button
              type="button"
              onClick={onSwitchSource}
              className="px-2.5 py-1 font-mono text-xs uppercase font-medium border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors duration-100 rounded-none"
              title="Đổi nguồn bài tập hoặc chế độ"
            >
              <span>ĐỔI NGUỒN</span>
            </button>
          )}

          {/* Translation Toggle Button */}
          {!isComplete && (
            <button
              type="button"
              onClick={() => setIsTranslationVisible((prev) => !prev)}
              className={`px-2.5 py-1 font-mono text-xs uppercase font-bold border transition-colors duration-100 rounded-none ${
                isTranslationVisible
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              title={isTranslationVisible ? 'Đang hiện nghĩa tiếng Việt' : 'Đang ẩn nghĩa tiếng Việt'}
            >
              <span>{isTranslationVisible ? 'DỊCH: BẬT' : 'DỊCH: TẮT'}</span>
            </button>
          )}

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 transition-colors rounded-none shrink-0"
            title="Thoát ra bài học"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát ra bài học</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {!isComplete && (
        <div className="w-full">
          <ProgressBar value={progressPercent} size="xs" />
        </div>
      )}

      {/* Fullscreen Centered Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        {!isComplete && currentExercise ? (
          <div className="space-y-6">
            {/* Audio Builder Big Audio Banner */}
            {quizMode === 'audio_builder' && (
              <div className="flex items-center justify-between p-3.5 border border-indigo-200 bg-indigo-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-none border border-indigo-300 bg-white text-indigo-700 flex items-center justify-center">
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <span className="block font-mono text-xs font-bold uppercase tracking-wider text-indigo-950">
                      CHẾ ĐỘ: NGHE VÀ GHÉP TỪ VỰNG
                    </span>
                    <span className="block text-[11px] font-sans text-indigo-700">
                      Nghe câu voice rồi bấm chọn các ô chữ bên dưới để ghép từ chính xác
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlayAudio(currentExercise.fullSentence)}
                  className="px-3 py-1.5 border border-indigo-400 bg-white text-indigo-900 hover:bg-indigo-100 font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-100 rounded-none shrink-0"
                >
                  NGHE LẠI (PHÍM R)
                </button>
              </div>
            )}

            {/* Main Question Card */}
            <div className="p-5 sm:p-7 border border-stone-300 bg-white text-center relative rounded-none shadow-xs">
              {/* Quick Audio Button in Corner */}
              <button
                type="button"
                onClick={() =>
                  handlePlayAudio(
                    isAnswered ? currentExercise.fullSentence : currentExercise.sentence.replace('（　　）', '...')
                  )
                }
                className="absolute right-3.5 top-3.5 p-1.5 border border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors duration-100 rounded-none"
                title="Nghe phát âm (Phím R)"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-3">
                {quizMode === 'audio_builder'
                  ? 'NGHE VOICE VÀ GHÉP TỪ VÀO CHỖ TRỐNG'
                  : 'ĐIỀN TỪ THÍCH HỢP VÀO CHỖ TRỐNG'}
              </span>

              {/* Japanese Sentence with Blank */}
              <div className="text-xl sm:text-3xl font-serif font-bold text-stone-900 leading-relaxed tracking-wide my-3 px-2">
                {currentExercise.sentence.split('（　　）').map((part, index, arr) => (
                  <React.Fragment key={index}>
                    <span>{part}</span>
                    {index < arr.length - 1 && (
                      <span
                        className={`inline-block px-3 py-0.5 mx-1 font-mono font-bold transition-all ${
                          isAnswered
                            ? isCorrectAnswer
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-300 line-through'
                            : quizMode === 'audio_builder' && selectedTileIds.length > 0
                            ? 'border-b-2 border-indigo-600 text-indigo-900 bg-indigo-50/60'
                            : 'border-b-2 border-stone-800 text-stone-900'
                        }`}
                      >
                        {isAnswered
                          ? currentExercise.targetWord
                          : quizMode === 'audio_builder' && selectedTileIds.length > 0
                          ? placedString
                          : '（　？　）'}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Vietnamese Translation (Toggleable) */}
              <div className="mt-3 min-h-[24px]">
                {isTranslationVisible ? (
                  <p className="font-sans text-xs sm:text-sm text-stone-700 italic">
                    "{currentExercise.translation}"
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsTranslationVisible(true)}
                    className="font-mono text-xs text-stone-500 hover:text-stone-800 border border-stone-300 px-2 py-0.5 rounded-none uppercase transition-colors"
                  >
                    XEM NGHĨA TIẾNG VIỆT
                  </button>
                )}
              </div>
            </div>

            {/* MODE 1: MULTIPLE CHOICE (4 OPTIONS) */}
            {quizMode === 'choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentExercise.options.map((option, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrect = idx === currentExercise.correctIndex;

                  let buttonStyle =
                    'border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 hover:border-stone-400 cursor-pointer';
                  let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-300';
                  let feedbackLabel = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      buttonStyle = 'bg-emerald-50 text-emerald-900 border-2 border-emerald-500';
                      badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                      feedbackLabel = 'CHÍNH XÁC ✓';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'bg-rose-50 text-rose-900 border-2 border-rose-400 line-through';
                      badgeStyle = 'bg-rose-600 text-white border-rose-600';
                      feedbackLabel = 'CHƯA ĐÚNG ✕';
                    } else {
                      buttonStyle = 'border border-stone-200 bg-white text-stone-400 opacity-40';
                      badgeStyle = 'border-stone-200 text-stone-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`flex items-center justify-between p-4 border text-left font-mono transition-all duration-150 rounded-none shadow-none active:scale-[0.99] ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 border text-xs font-bold flex items-center justify-center flex-shrink-0 ${badgeStyle}`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-serif truncate">
                          {option}
                        </span>
                      </div>

                      {feedbackLabel && (
                        <span
                          className={`font-mono text-xs font-bold shrink-0 ml-2 ${
                            isCorrect ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {feedbackLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MODE 2: AUDIO & WORD BUILDER */}
            {quizMode === 'audio_builder' && (
              <div className="space-y-4">
                {/* Placed Tiles Assembly Row */}
                <div className="p-3 border border-stone-300 bg-white min-h-[64px] flex items-center justify-center gap-2 flex-wrap">
                  {selectedTileIds.length === 0 ? (
                    <span className="text-xs font-mono text-stone-400">
                      Chọn các ký tự trong ngân hàng bên dưới để ghép từ...
                    </span>
                  ) : (
                    selectedTileIds.map((tileId, idx) => {
                      const tile = tilePool.find((t) => t.id === tileId);
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => handleRemovePlacedTile(idx)}
                          className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-stone-900 bg-stone-50 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-800 text-stone-900 font-serif font-bold text-xl flex items-center justify-center transition-colors rounded-none shadow-xs"
                          title="Nhấn để gỡ ô ký tự"
                        >
                          {tile?.char}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Tile Bank (Only visible when not answered) */}
                {!isAnswered && (
                  <div className="p-4 border border-stone-200 bg-white space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                      {tilePool.map((tile) => {
                        const isUsed = selectedTileIds.includes(tile.id);
                        return (
                          <button
                            key={tile.id}
                            type="button"
                            disabled={isUsed}
                            onClick={() => handleSelectTile(tile.id)}
                            className={`w-11 h-11 sm:w-12 sm:h-12 border font-serif font-bold text-xl flex items-center justify-center transition-all duration-100 rounded-none shadow-xs ${
                              isUsed
                                ? 'border-stone-200 bg-stone-100 text-stone-300 opacity-25 cursor-not-allowed'
                                : 'border-stone-300 bg-white hover:border-stone-900 hover:bg-stone-100 text-stone-900 active:scale-95 cursor-pointer'
                            }`}
                          >
                            {tile.char}
                          </button>
                        );
                      })}
                    </div>

                    {/* Builder Controls */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                      <button
                        type="button"
                        disabled={selectedTileIds.length === 0}
                        onClick={handleUndo}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-mono text-xs uppercase font-medium disabled:opacity-30 rounded-none transition-colors"
                        title="Gỡ ký tự vừa ghép (Backspace)"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Hoàn tác</span>
                      </button>

                      <button
                        type="button"
                        disabled={selectedTileIds.length === 0}
                        onClick={handleResetTiles}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-mono text-xs uppercase font-medium disabled:opacity-30 rounded-none transition-colors"
                        title="Xoá sạch toàn bộ ô chữ đã ghép"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Làm lại</span>
                      </button>

                      <button
                        type="button"
                        disabled={selectedTileIds.length === 0}
                        onClick={handleCheckWordBuilder}
                        className="inline-flex items-center gap-1.5 px-5 py-2 border border-stone-900 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase font-bold tracking-wider disabled:opacity-30 rounded-none transition-colors shadow-xs active:scale-98"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>KIỂM TRA ĐÁP ÁN (ENTER)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Explanation Box (Revealed upon answer) */}
            {isAnswered && (
              <div
                className={`p-4 border rounded-none shadow-none space-y-1 animate-fadeIn ${
                  isCorrectAnswer
                    ? 'border-emerald-200 bg-emerald-50/70 text-stone-900'
                    : 'border-rose-200 bg-rose-50/70 text-stone-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4
                      className={`font-mono text-xs font-bold uppercase tracking-wider mb-1 ${
                        isCorrectAnswer ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {isCorrectAnswer
                        ? `CHÍNH XÁC! (+${quizMode === 'audio_builder' ? '10' : '5'} XP)`
                        : `CHƯA CHÍNH XÁC · ĐÁP ÁN ĐÚNG: ${currentExercise.targetWord}`}
                    </h4>
                    <p className="font-sans text-xs sm:text-sm text-stone-700 leading-relaxed">
                      {currentExercise.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentExercise.fullSentence)}
                    className="p-1.5 border border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors duration-100 rounded-none flex-shrink-0"
                    title="Nghe lại câu hoàn chỉnh"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : isComplete ? (
          /* Summary View */
          <div className="py-6 text-center space-y-6 animate-fadeIn">
            <div className="space-y-2 pb-6 border-b border-stone-200">
              <div className="font-mono text-xs uppercase tracking-widest text-stone-500">
                HOÀN THÀNH BỘ BÀI TẬP ĐIỀN TỪ
              </div>
              <h3 className="font-serif font-normal text-3xl sm:text-5xl text-stone-900 tracking-tight uppercase">
                EXERCISES COMPLETED
              </h3>
              <p className="font-serif text-lg sm:text-2xl text-stone-600 tracking-widest">
                練習完了 · {quizMode === 'audio_builder' ? 'NGHE & GHÉP TỪ' : 'TRẮC NGHIỆM'}
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 border border-stone-200 divide-x divide-stone-200 max-w-sm mx-auto text-center">
              <div className="p-3.5 bg-stone-50">
                <span className="block font-serif text-2xl font-light text-stone-900">
                  {score}/{total}
                </span>
                <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                  ĐÚNG
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50">
                <span className="block font-serif text-2xl font-light text-emerald-800">
                  {accuracyPercent}%
                </span>
                <span className="font-mono text-[11px] text-emerald-700 uppercase tracking-wider font-bold">
                  CHÍNH XÁC
                </span>
              </div>
              <div className="p-3.5 bg-stone-50">
                <span className="block font-serif text-2xl font-light text-stone-900">
                  +{score * (quizMode === 'audio_builder' ? 10 : 5)}
                </span>
                <span className="font-mono text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                  XP
                </span>
              </div>
            </div>

            {/* Missed questions review */}
            {wrongAnswers.length > 0 && (
              <div className="text-left mt-6 pt-4 border-t border-stone-200 max-h-48 overflow-y-auto space-y-2">
                <h4 className="font-mono text-xs font-bold text-rose-800 uppercase tracking-wider">
                  CÁC CÂU CẦN ÔN LẠI ({wrongAnswers.length}):
                </h4>
                <div className="space-y-2">
                  {wrongAnswers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-rose-200 bg-rose-50/50 text-xs flex items-center justify-between gap-3 rounded-none"
                    >
                      <div>
                        <p className="font-serif font-bold text-stone-900 text-sm">
                          {item.fullSentence}
                        </p>
                        <p className="font-sans text-stone-600 mt-0.5">
                          Đáp án: <strong className="font-mono text-rose-900">{item.targetWord}</strong> — {item.translation}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(item.fullSentence)}
                        className="p-1.5 border border-stone-300 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors duration-100 rounded-none shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Bottom Action Controls */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
          {!isComplete ? (
            <button
              type="button"
              disabled={!isAnswered}
              onClick={handleNext}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
            >
              <span>{currentIndex + 1 === total ? 'XEM KẾT QUẢ TỔNG KẾT' : 'CÂU TIẾP THEO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>LUYỆN LẠI BÀI NÀY</span>
              </button>
              {onSwitchSource && (
                <button
                  type="button"
                  onClick={onSwitchSource}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200 font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
                >
                  <span>ĐỔI NGUỒN BÀI TẬP</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" />
                <span>QUAY VỀ BÀI HỌC</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
