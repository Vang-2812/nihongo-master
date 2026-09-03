'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Volume2,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Trophy,
  Home,
  Check,
  X,
  Undo2,
  Trash2,
  Dices,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';
import { useSRSStore } from '@/stores/srsStore';
import { AudioButton } from '@/components/vocab/AudioButton';
import ProgressBar from '@/components/ui/ProgressBar';
import { QuizItem } from './MultipleChoiceQuiz';

export interface TileItem {
  id: string; // unique tile identifier (e.g. "tile_0", "tile_distractor_1")
  char: string;
  isDistractor: boolean;
}

export interface WordBuilderQuizProps {
  items: QuizItem[];
  title?: string;
  subtitle?: string;
  showKana?: boolean;
  onRestart?: () => void;
  onExit?: () => void;
  className?: string;
}

interface QuestionHistory {
  item: QuizItem;
  constructedWord: string;
  targetWord: string;
  isCorrect: boolean;
}

// Common Hiragana & Katakana moras pool for generating realistic distractor tiles
const HIRAGANA_MORAS = [
  'あ', 'い', 'う', 'え', 'お',
  'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ',
  'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の',
  'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も',
  'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ',
  'わ', 'を', 'ん',
  'が', 'ぎ', 'ぐ', 'げ', 'ご',
  'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
  'だ', 'ぢ', 'づ', 'で', 'ど',
  'ば', 'び', 'ぶ', 'べ', 'ぼ',
  'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
  'っ', 'ゃ', 'ゅ', 'ょ',
];

const KATAKANA_MORAS = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', 'ユ', 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', 'ヲ', 'ン',
  'ガ', 'ギ', 'グ', 'ゲ', 'ゴ',
  'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ',
  'ダ', 'デ', 'ド',
  'バ', 'ビ', 'ブ', 'ベ', 'ボ',
  'パ', 'ピ', 'プ', 'ペ', 'ポ',
  'ー', 'ッ', 'ャ', 'ュ', 'ョ',
];

const KANJI_DISTRACTORS = [
  '日', '本', '人', '大', '学', '生', '先', '年', '私', '何',
  '行', '来', '見', '食', '飲', '買', '聞', '話', '出', '入',
  '友', '達', '車', '電', '気', '天', '雨', '今', '時', '分',
];

/**
 * Breakdown a Japanese word into an array of characters/moras.
 * Supports Hiragana compounds (きゃ, しゃ, ちょ, etc.), Katakana, and Kanji.
 */
function breakdownJapaneseWord(word: string): string[] {
  const chars: string[] = [];
  const smallKana = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ']);

  for (let i = 0; i < word.length; i++) {
    const currentChar = word[i];
    const nextChar = word[i + 1];

    if (nextChar && smallKana.has(nextChar)) {
      chars.push(currentChar + nextChar);
      i++; // Skip small kana as it is combined
    } else {
      chars.push(currentChar);
    }
  }

  return chars;
}

export const WordBuilderQuiz: React.FC<WordBuilderQuizProps> = ({
  items,
  title = 'Ghép Ký Tự (Word Builder)',
  subtitle = 'Xếp các ký tự thành từ tiếng Nhật chính xác theo nghĩa',
  showKana = true,
  onRestart,
  onExit,
  className = '',
}) => {
  const { addXp } = useSRSStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentItem = items[currentIndex];

  // Target answer can be the Kanji word or Reading
  const targetWord = currentItem ? currentItem.word : '';
  const targetChars = useMemo(() => {
    return breakdownJapaneseWord(targetWord);
  }, [targetWord]);

  // Generate Tile Pool: Correct Characters + 2-3 Distractor Tiles
  const tilePool = useMemo(() => {
    if (!currentItem || targetChars.length === 0) return [];

    const correctTiles: TileItem[] = targetChars.map((char, idx) => ({
      id: `tile_c_${idx}_${char}`,
      char,
      isDistractor: false,
    }));

    // Choose distractor type based on word type
    const isAllKatakana = /^[\u30A0-\u30FF\u30FC]+$/.test(targetWord);
    const hasKanji = /[\u4E00-\u9FAF]/.test(targetWord);

    let distractorSource = HIRAGANA_MORAS;
    if (isAllKatakana) {
      distractorSource = KATAKANA_MORAS;
    } else if (hasKanji && targetChars.length <= 3) {
      distractorSource = KANJI_DISTRACTORS;
    }

    // Pick 2-3 unique distractors not already in the target
    const existingCharsSet = new Set(targetChars);
    const availableDistractors = distractorSource.filter((c) => !existingCharsSet.has(c));
    const shuffledDistractors = [...availableDistractors].sort(() => Math.random() - 0.5);

    const distractorCount = targetChars.length <= 3 ? 3 : 2;
    const chosenDistractors = shuffledDistractors.slice(0, distractorCount);

    const distractorTiles: TileItem[] = chosenDistractors.map((char, idx) => ({
      id: `tile_d_${idx}_${char}`,
      char,
      isDistractor: true,
    }));

    // Combine and shuffle tiles
    const allTiles = [...correctTiles, ...distractorTiles].sort(() => Math.random() - 0.5);
    return allTiles;
  }, [currentItem, targetChars, targetWord]);

  // Handle Tile Click in Bank -> Append to Answer
  const handleSelectTile = (tileId: string) => {
    if (isChecked || isFinished) return;
    if (selectedTileIds.includes(tileId)) return; // already placed
    if (selectedTileIds.length >= targetChars.length) return; // cannot exceed target word length

    setSelectedTileIds((prev) => [...prev, tileId]);
  };

  // Handle Placed Tile Click in Construction Line -> Remove back to Bank
  const handleRemovePlacedTile = (index: number) => {
    if (isChecked || isFinished) return;
    setSelectedTileIds((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reset Tiles
  const handleResetTiles = () => {
    if (isChecked || isFinished) return;
    setSelectedTileIds([]);
  };

  // Undo Last Tile
  const handleUndo = () => {
    if (isChecked || isFinished || selectedTileIds.length === 0) return;
    setSelectedTileIds((prev) => prev.slice(0, -1));
  };

  // Check Constructed Word
  const handleCheck = useCallback(() => {
    if (isChecked || !currentItem || selectedTileIds.length === 0) return;

    // Assemble constructed string
    const constructedWord = selectedTileIds
      .map((id) => tilePool.find((t) => t.id === id)?.char || '')
      .join('');

    const correct = constructedWord === targetWord;

    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));
      setScore((prev) => prev + 1);
      setEarnedXp((prev) => prev + 15);
      addXp(15); // +15 XP for Word Builder
      speakJapanese(currentItem.word);
    } else {
      setStreak(0);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    // Unified SRS SM-2 Record & sync to vocabStore
    try {
      useSRSStore
        .getState()
        .recordReview(
          currentItem.type || 'vocab',
          currentItem.id,
          correct ? 3 : 1,
          (currentItem.level as any) || 'N5'
        );
    } catch (err) {
      // ignore
    }

    setHistory((prev) => [
      ...prev,
      {
        item: currentItem,
        constructedWord,
        targetWord,
        isCorrect: correct,
      },
    ]);
  }, [isChecked, currentItem, selectedTileIds, tilePool, targetWord, streak, addXp]);

  // Auto-check when all required characters are placed
  useEffect(() => {
    if (!isChecked && selectedTileIds.length === targetChars.length && targetChars.length > 0) {
      handleCheck();
    }
  }, [selectedTileIds, targetChars.length, isChecked, handleCheck]);

  // Next Question
  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedTileIds([]);
      setIsChecked(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      if (typeof window !== 'undefined') {
        try {
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Keyboard Shortcuts (Backspace = undo, Enter = next/check)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Enter' || e.code === 'Space') {
        if (isChecked) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChecked, selectedTileIds]);

  // Restart Quiz
  const handleRestartInternal = () => {
    setCurrentIndex(0);
    setSelectedTileIds([]);
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
    setStreak(0);
    setScore(0);
    setEarnedXp(0);
    setHistory([]);
    setIsFinished(false);
    if (onRestart) onRestart();
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Không có câu hỏi nào trong bộ bài này.</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          <Dices className="w-4 h-4" />
          <span>Quay lại Menu Quiz</span>
        </Link>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isFinished) {
    const accuracy = Math.round((score / items.length) * 100);

    return (
      <div className={`w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn ${className}`}>
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-amber-500/20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 ring-4 ring-white/10">
            <Trophy className="w-8 h-8 text-amber-300 fill-amber-300" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hoàn Thành Word Builder!
          </h1>
          <p className="text-amber-100 text-sm sm:text-base mt-1">
            Bạn đã ghép đúng {score}/{items.length} từ vựng.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-amber-200">Đúng</span>
              <span className="text-2xl font-black mt-0.5 text-emerald-300">
                {score}/{items.length}
              </span>
              <span className="text-[11px] text-amber-200/80">từ</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-amber-200">Độ chính xác</span>
              <span className="text-2xl font-black mt-0.5">{accuracy}%</span>
              <span className="text-[11px] text-amber-200/80">chính xác</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-amber-200">Chuỗi cao nhất</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-2xl font-black">{maxStreak}</span>
              </div>
              <span className="text-[11px] text-amber-200/80">liên tiếp</span>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15 flex flex-col items-center">
              <span className="text-xs text-amber-200">Điểm thưởng</span>
              <span className="text-2xl font-black mt-0.5 text-amber-300">+{earnedXp}</span>
              <span className="text-[11px] text-amber-200/80">XP</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleRestartInternal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Luyện Lại Bộ Này</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-all active:scale-98"
          >
            <Dices className="w-4 h-4 text-amber-500" />
            <span>Đổi Chế Độ Quiz</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Trang Chủ</span>
          </Link>
        </div>

        {/* Question Review List */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base pb-3 border-b border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <span>Chi tiết câu ghép từ ({history.length})</span>
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.item.id}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      h.isCorrect
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {h.isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-900 dark:text-white font-japanese">
                        {h.item.word}
                      </span>
                      {h.item.reading && h.item.reading !== h.item.word && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-japanese">
                          {h.item.reading}
                        </span>
                      )}
                      {h.item.sinoVietnamese && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                          {h.item.sinoVietnamese}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      {h.item.meaning}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakJapanese(h.item.word)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE GAMEPLAY SCREEN ====================
  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              Câu {currentIndex + 1}/{items.length}
            </span>
            {currentItem.level && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentItem.level}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Counter */}
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
                streak > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>{streak} chuỗi</span>
            </div>

            {/* XP Earned */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+{earnedXp} XP</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={currentIndex}
          max={items.length}
          variant="primary"
          size="sm"
          className="transition-all"
        />
      </div>

      {/* Main Prompt Card (Vietnamese Meaning Prompt) */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-lg space-y-3">
        <div className="flex justify-between items-center absolute top-4 left-4 right-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ghép từ tiếng Nhật cho nghĩa:
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`p-2 rounded-full border text-xs font-medium transition-colors ${
              showHint
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-transparent hover:border-slate-200'
            }`}
            title="Xem gợi ý Furigana / Âm Hán Việt"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Vietnamese Meaning Prompt */}
        <div className="pt-5 pb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentItem.meaning}
          </h2>

          {/* Hint / Sino-Vietnamese Display */}
          <div className="min-h-[1.75rem] flex items-center justify-center gap-2 mt-2">
            {(showHint || isChecked) && (
              <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center">
                {currentItem.reading && currentItem.reading !== currentItem.word && (
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 font-japanese">
                    Cách đọc: {currentItem.reading}
                  </span>
                )}
                {currentItem.sinoVietnamese && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-mono">
                    Âm Hán: {currentItem.sinoVietnamese}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Construction Line (Slots) */}
      <div
        className={`rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col items-center justify-center min-h-[6.5rem] sm:min-h-[7.5rem] transition-all space-y-2 sm:space-y-3 ${
          isShaking ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30' : ''
        } ${
          isChecked && isCorrect
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500'
            : isChecked && !isCorrect
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
            : 'border-dashed border-slate-300 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap min-h-[3rem] sm:min-h-[3.5rem]">
          {targetChars.map((_, idx) => {
            const tileId = selectedTileIds[idx];
            const tile = tileId ? tilePool.find((t) => t.id === tileId) : null;

            if (tile) {
              return (
                <button
                  key={`placed-${tile.id}-${idx}`}
                  type="button"
                  disabled={isChecked}
                  onClick={() => handleRemovePlacedTile(idx)}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-japanese font-bold text-lg sm:text-2xl shadow-sm transition-all select-none active:scale-90 ${
                    isChecked && isCorrect
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/20'
                      : isChecked && !isCorrect
                      ? 'border-rose-500 bg-rose-500 text-white'
                      : 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:border-rose-400 hover:text-rose-500 animate-pop'
                  }`}
                  title="Nhấn để gỡ ký tự này"
                >
                  {tile.char}
                </button>
              );
            }

            // Empty slot placeholder
            return (
              <div
                key={`empty-slot-${idx}`}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-800/30 flex items-center justify-center transition-all select-none"
                title={`Vị trí ký tự thứ ${idx + 1}`}
              >
                <span className="text-xs font-semibold text-slate-300 dark:text-slate-600 font-mono">
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Construction Line Controls: Undo & Reset */}
        {!isChecked && selectedTileIds.length > 0 && (
          <div className="flex items-center gap-2 pt-1 animate-fadeIn">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Gỡ ký tự cuối (Backspace)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Gỡ ô cuối</span>
            </button>
            <button
              type="button"
              onClick={handleResetTiles}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Xóa hết làm lại"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Làm lại</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrambled Character Tiles Bank */}
      <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5 sm:space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
          Kho Ký Tự Gợi Ý
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pt-1 sm:pt-2">
          {tilePool.map((tile) => {
            const isUsed = selectedTileIds.includes(tile.id);

            return (
              <button
                key={tile.id}
                type="button"
                disabled={isUsed || isChecked}
                onClick={() => handleSelectTile(tile.id)}
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-japanese font-bold text-lg sm:text-2xl transition-all select-none ${
                  isUsed
                    ? 'border-transparent bg-slate-100 dark:bg-slate-800/40 text-transparent opacity-25 cursor-default'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 shadow-sm active:scale-95'
                }`}
              >
                {tile.char}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback & Next Button */}
      {isChecked && (
        <div className="pt-2 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCorrect
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isCorrect ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 stroke-[3]" />}
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {isCorrect ? 'Chính xác! (+15 XP)' : 'Chưa chính xác!'}
              </span>
              {!isCorrect && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Đáp án đúng: <span className="font-bold font-japanese">{targetWord}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-98 ml-auto"
          >
            <span>{currentIndex < items.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WordBuilderQuiz;