'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClozeExerciseItem } from '@/types/ai';
import { useAIStore } from '@/stores/aiStore';
import { useSRSStore } from '@/stores/srsStore';
import { speakJapanese } from '@/lib/tts';
import {
  Volume2,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';

interface AIClozeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ClozeExerciseItem[];
  lessonTitle: string;
  onRegenerate?: () => void;
}

export default function AIClozeQuizModal({
  isOpen,
  onClose,
  exercises,
  lessonTitle,
  onRegenerate,
}: AIClozeQuizModalProps) {
  const { config } = useAIStore();
  const { addXp } = useSRSStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<ClozeExerciseItem[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isTranslationVisible, setIsTranslationVisible] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync translation visibility preference on open
  useEffect(() => {
    if (isOpen) {
      setIsTranslationVisible(config.showTranslationInQuiz);
      setCurrentIndex(0);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setScore(0);
      setWrongAnswers([]);
      setIsComplete(false);
    }
  }, [isOpen, config.showTranslationInQuiz]);

  const currentExercise = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;
    return exercises[currentIndex] || null;
  }, [exercises, currentIndex]);

  const handlePlayAudio = useCallback((text: string) => {
    if (!text) return;
    setIsPlayingAudio(true);
    speakJapanese(text);
    setTimeout(() => setIsPlayingAudio(false), 1500);
  }, []);

  // Handle Option Click
  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentExercise) return;

    setSelectedOptionIndex(index);
    setIsAnswered(true);

    const isCorrect = index === currentExercise.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      addXp(5); // +5 XP for correct cloze question
    } else {
      setWrongAnswers((prev) => [...prev, currentExercise]);
    }

    // Auto-play audio of the full sentence
    handlePlayAudio(currentExercise.fullSentence);
  };

  // Handle Next Question
  const handleNext = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  // Restart Quiz
  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setWrongAnswers([]);
    setIsComplete(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || isComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key) && !isAnswered && currentExercise) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < currentExercise.options.length) {
          handleSelectOption(idx);
        }
      } else if ((e.key === 'Enter' || e.key === ' ') && isAnswered) {
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
  }, [isOpen, isComplete, isAnswered, currentExercise, handleNext, handlePlayAudio]);

  if (!isOpen) return null;

  const total = exercises.length;
  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const accuracyPercent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-white border border-stone-300 rounded-none shadow-xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-mono font-bold text-stone-900 uppercase tracking-wider truncate">
              BÀI TẬP AI: {lessonTitle}
            </h3>
            {!isComplete && (
              <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                CÂU {currentIndex + 1} / {total}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              className="border border-stone-300 text-stone-600 hover:bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold transition-colors duration-100 rounded-none"
              title="Đóng cửa sổ"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!isComplete && (
          <div className="px-5 pt-2">
            <ProgressBar value={progressPercent} size="sm" />
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-between">
          {!isComplete && currentExercise ? (
            <div className="space-y-6">
              {/* Question Card */}
              <div className="p-5 sm:p-7 border border-stone-300 bg-white text-center relative rounded-none shadow-none">
                {/* Audio button */}
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
                  ĐIỀN TỪ THÍCH HỢP VÀO CHỖ TRỐNG
                </span>

                {/* Japanese Sentence */}
                <div className="text-xl sm:text-3xl font-serif font-bold text-stone-900 leading-relaxed tracking-wide my-3 px-2">
                  {currentExercise.sentence.split('（　　）').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {index < arr.length - 1 && (
                        <span
                          className={`inline-block px-3 py-0.5 mx-1 font-mono font-bold transition-all ${
                            isAnswered
                              ? selectedOptionIndex === currentExercise.correctIndex
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-300 line-through'
                              : 'border-b-2 border-stone-800 text-stone-900'
                          }`}
                        >
                          {isAnswered ? currentExercise.targetWord : '（　？　）'}
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

              {/* 4 Options Grid */}
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

              {/* Explanation Box (Revealed upon answer) */}
              {isAnswered && (
                <div
                  className={`p-4 border rounded-none shadow-none space-y-1 animate-fadeIn ${
                    selectedOptionIndex === currentExercise.correctIndex
                      ? 'border-emerald-200 bg-emerald-50/70 text-stone-900'
                      : 'border-rose-200 bg-rose-50/70 text-stone-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4
                        className={`font-mono text-xs font-bold uppercase tracking-wider mb-1 ${
                          selectedOptionIndex === currentExercise.correctIndex
                            ? 'text-emerald-800'
                            : 'text-rose-800'
                        }`}
                      >
                        {selectedOptionIndex === currentExercise.correctIndex
                          ? 'CHÍNH XÁC! (+5 XP)'
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
                  HOÀN THÀNH BỘ BÀI TẬP ĐIỀN TỪ AI
                </div>
                <h3 className="font-serif font-normal text-3xl sm:text-5xl text-stone-900 tracking-tight uppercase">
                  AI CLOZE EXERCISES COMPLETED
                </h3>
                <p className="font-serif text-lg sm:text-2xl text-stone-600 tracking-widest">
                  AI練習完了
                </p>
              </div>

              {/* Score breakdown */}
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
                    +{score * 5}
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
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>LUYỆN LẠI BÀI NÀY</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>QUAY VỀ BÀI HỌC</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

