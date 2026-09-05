'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Home,
  Undo2,
  Trash2,
  Dices,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';
import { useSRSStore } from '@/stores/srsStore';
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
            particleCount: 70,
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
      <div className="max-w-md mx-auto p-6 text-center space-y-4 border-2 border-black bg-white rounded-none shadow-none">
        <p className="font-sans text-sm text-black">KHÔNG CÓ CÂU HỎI NÀO TRONG BỘ BÀI NÀY</p>
        <Link
          href="/review/quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-black bg-black text-white font-sans text-xs uppercase font-bold hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none"
        >
          <Dices className="w-4 h-4" />
          <span>QUAY LẠI MENU QUIZ</span>
        </Link>
      </div>
    );
  }

  // ==================== SUMMARY SCREEN ====================
  if (isFinished) {
    const accuracy = Math.round((score / items.length) * 100);

    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn ${className}`}>
        {/* High-Fashion Editorial Title Banner */}
        <div className="text-center space-y-2 pb-6 border-b-4 border-black">
          <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            HOÀN THÀNH GHÉP KÝ TỰ WORD BUILDER
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-6xl text-black tracking-tight uppercase">
            WORD BUILDER COMPLETED
          </h1>
          <p className="font-serif text-lg sm:text-2xl text-black tracking-widest">
            文字組み立て完了
          </p>
          <p className="font-sans text-xs uppercase tracking-wider text-mutedForeground mt-1 font-medium">
            BẠN ĐÃ GHÉP ĐÚNG {score}/{items.length} TỪ VỰNG
          </p>
        </div>

        {/* 4 Core Stats Grid with 4px black rules and 6xl serif numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b-4 border-black divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black text-center">
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐÚNG
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {score}/{items.length}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              TỪ VỰNG
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐỘ CHÍNH XÁC
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {accuracy}%
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              CHÍNH XÁC
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              CHUỖI CAO NHẤT
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              {maxStreak}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              LIÊN TIẾP
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-white">
            <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              ĐIỂM THƯỞNG
            </span>
            <span className="font-serif text-4xl sm:text-6xl font-black text-black my-1">
              +{earnedXp}
            </span>
            <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              XP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestartInternal}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>LUYỆN LẠI BỘ NÀY</span>
          </button>

          <Link
            href="/review/quiz"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-white text-black font-sans text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Dices className="w-4 h-4" />
            <span>ĐỔI CHẾ ĐỘ QUIZ</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>TRANG CHỦ</span>
          </Link>
        </div>

        {/* Question Review List */}
        <div className="border-2 border-black bg-white p-5 sm:p-6 rounded-none shadow-none space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black">
              CHI TIẾT CÂU GHÉP TỪ · {history.length} CÂU
            </h2>
          </div>

          <div className="divide-y divide-black max-h-72 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={`${h.item.id}-${idx}`}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 font-sans text-xs font-bold uppercase shrink-0 border border-black ${
                      h.isCorrect
                        ? 'bg-black text-white'
                        : 'bg-white text-black line-through'
                    }`}
                  >
                    {h.isCorrect ? 'ĐÚNG ✓' : 'SAI ✕'}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-serif font-bold text-black text-base">
                        {h.item.word}
                      </span>
                      {h.item.reading && h.item.reading !== h.item.word && (
                        <span className="text-xs font-mono text-mutedForeground">
                          {h.item.reading}
                        </span>
                      )}
                      {h.item.sinoVietnamese && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-black text-white border border-black uppercase">
                          {h.item.sinoVietnamese}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-mutedForeground truncate mt-0.5">
                      {h.item.meaning}
                    </p>
                    {!h.isCorrect && (
                      <p className="font-sans text-[11px] text-black font-semibold mt-0.5">
                        Bạn ghép: {h.constructedWord}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakJapanese(h.item.word)}
                    className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
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
            <span className="text-xs font-mono font-bold px-2.5 py-1 border border-black bg-white text-black rounded-none uppercase">
              CÂU {currentIndex + 1}/{items.length}
            </span>
            {currentItem.level && (
              <span className="text-xs font-mono font-bold px-2 py-1 bg-black text-white border border-black rounded-none">
                {currentItem.level}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Streak Counter */}
            <div className="flex items-center gap-1 px-3 py-1 border border-black bg-white text-black font-mono text-xs font-bold rounded-none uppercase">
              <span>CHUỖI: {streak}</span>
            </div>

            {/* XP Earned */}
            <div className="flex items-center gap-1 px-3 py-1 border border-black bg-black text-white font-mono text-xs font-bold rounded-none uppercase">
              <span>+{earnedXp} XP</span>
            </div>
          </div>
        </div>

        <ProgressBar
          value={currentIndex}
          max={items.length}
          size="sm"
          className="transition-all"
        />
      </div>

      {/* Main Prompt Card (Vietnamese Meaning in high-contrast sans) */}
      <div className="relative border-2 border-black bg-white p-6 sm:p-8 text-center rounded-none shadow-none space-y-3">
        <div className="flex justify-between items-center absolute top-4 left-4 right-4">
          <div className="text-xs font-sans font-semibold text-mutedForeground uppercase tracking-wider">
            GHÉP TỪ CHO NGHĨA
          </div>

          {/* Hint Button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`px-2 py-1 border border-black text-xs font-sans font-medium transition-colors duration-100 rounded-none ${
              showHint ? 'bg-black text-white' : 'bg-white text-black'
            }`}
            title="Xem gợi ý Furigana / Âm Hán Việt"
          >
            {showHint ? 'GỢI Ý: BẬT' : 'GỢI Ý'}
          </button>
        </div>

        {/* Vietnamese Meaning Prompt */}
        <div className="pt-6 pb-2">
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-black tracking-tight leading-snug">
            {currentItem.meaning}
          </h2>

          {/* Hint / Sino-Vietnamese Display */}
          <div className="min-h-[1.75rem] flex items-center justify-center gap-2 mt-3">
            {(showHint || isChecked) && (
              <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-center font-mono">
                {currentItem.reading && currentItem.reading !== currentItem.word && (
                  <span className="text-sm font-bold text-mutedForeground">
                    CÁCH ĐỌC: {currentItem.reading}
                  </span>
                )}
                {currentItem.sinoVietnamese && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-black text-white border border-black uppercase">
                    ÂM HÁN: {currentItem.sinoVietnamese}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Construction Line (Slots) */}
      <div
        className={`border-2 p-4 sm:p-6 bg-white flex flex-col items-center justify-center min-h-[7rem] transition-all space-y-3 rounded-none shadow-none ${
          isShaking
            ? 'border-4 border-black bg-muted animate-shake'
            : isChecked && isCorrect
            ? 'border-2 border-black bg-muted'
            : isChecked && !isCorrect
            ? 'border-4 border-black bg-white'
            : 'border-dashed border-2 border-black'
        }`}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap min-h-[3.5rem]">
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
                  className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center font-serif font-bold text-xl sm:text-2xl transition-all select-none rounded-none shadow-none active:scale-95 ${
                    isChecked && isCorrect
                      ? 'border-black bg-black text-white'
                      : isChecked && !isCorrect
                      ? 'border-4 border-black bg-white text-black line-through'
                      : 'border-black bg-white text-black hover:bg-black hover:text-white'
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
                className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-dashed border-black bg-muted flex items-center justify-center select-none rounded-none"
                title={`Vị trí ký tự thứ ${idx + 1}`}
              >
                <span className="text-xs font-mono font-bold text-mutedForeground">
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Construction Line Controls: Undo & Reset */}
        {!isChecked && selectedTileIds.length > 0 && (
          <div className="flex items-center gap-2 pt-1 animate-fadeIn font-sans text-xs">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none uppercase font-semibold"
              title="Gỡ ký tự cuối (Backspace)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>GỠ Ô CUỐI</span>
            </button>
            <button
              type="button"
              onClick={handleResetTiles}
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none uppercase font-semibold"
              title="Xóa hết làm lại"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>LÀM LẠI</span>
            </button>
          </div>
        )}
      </div>

      {/* Scrambled Character Tiles Bank: Sharp square letter blocks */}
      <div className="p-4 sm:p-6 border-2 border-black bg-white rounded-none shadow-none space-y-3">
        <div className="text-xs font-sans font-semibold uppercase tracking-wider text-mutedForeground text-center">
          KHO KÝ TỰ GỢI Ý
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pt-2">
          {tilePool.map((tile) => {
            const isUsed = selectedTileIds.includes(tile.id);

            return (
              <button
                key={tile.id}
                type="button"
                disabled={isUsed || isChecked}
                onClick={() => handleSelectTile(tile.id)}
                className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center font-serif font-bold text-2xl transition-colors duration-100 select-none rounded-none shadow-none active:scale-95 ${
                  isUsed
                    ? 'border-borderLight bg-muted text-transparent opacity-25 cursor-default'
                    : 'border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer'
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
            <span
              className={`inline-flex items-center justify-center px-3 py-1.5 font-sans text-xs font-bold uppercase border-2 border-black ${
                isCorrect
                  ? 'bg-black text-white'
                  : 'bg-white text-black line-through'
              }`}
            >
              {isCorrect ? 'CHÍNH XÁC ✓ (+15 XP)' : `CHƯA ĐÚNG ✕ (ĐÁP ÁN: ${targetWord})`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-sans text-xs uppercase font-bold tracking-wider transition-colors duration-100 rounded-none shadow-none active:scale-[0.98] ml-auto"
          >
            <span>{currentIndex < items.length - 1 ? 'CÂU TIẾP THEO' : 'XEM KẾT QUẢ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WordBuilderQuiz;