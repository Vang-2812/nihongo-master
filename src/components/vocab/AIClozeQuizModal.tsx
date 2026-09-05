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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-white border-2 sm:border-4 border-black rounded-none shadow-none flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 border-b-2 border-black flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-mono font-bold text-black uppercase tracking-wider truncate">
              BÀI TẬP AI: {lessonTitle}
            </h3>
            {!isComplete && (
              <p className="text-[11px] font-mono text-mutedForeground uppercase tracking-wider">
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
                className={`px-2.5 py-1 font-mono text-xs uppercase font-bold border border-black transition-colors duration-100 rounded-none ${
                  isTranslationVisible
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-muted'
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
              className="border border-black px-2.5 py-1 font-mono text-xs font-bold text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
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
              <div className="p-5 sm:p-7 border-2 border-black bg-white text-center relative rounded-none shadow-none">
                {/* Audio button */}
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio(
                      isAnswered ? currentExercise.fullSentence : currentExercise.sentence.replace('（　　）', '...')
                    )
                  }
                  className="absolute right-3.5 top-3.5 p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
                  title="Nghe phát âm (Phím R)"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-widest text-mutedForeground mb-3">
                  ĐIỀN TỪ THÍCH HỢP VÀO CHỖ TRỐNG
                </span>

                {/* Japanese Sentence */}
                <div className="text-xl sm:text-3xl font-serif font-black text-black leading-relaxed tracking-wide my-3 px-2">
                  {currentExercise.sentence.split('（　　）').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {index < arr.length - 1 && (
                        <span
                          className={`inline-block px-3 py-0.5 mx-1 font-mono font-bold transition-all ${
                            isAnswered
                              ? selectedOptionIndex === currentExercise.correctIndex
                                ? 'bg-black text-white border-2 border-black'
                                : 'bg-white text-black border-4 border-black line-through'
                              : 'border-b-4 border-black text-black'
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
                    <p className="font-sans text-xs sm:text-sm text-black italic">
                      "{currentExercise.translation}"
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTranslationVisible(true)}
                      className="font-mono text-xs text-mutedForeground hover:text-black border border-black px-2 py-0.5 rounded-none uppercase transition-colors"
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
                    'border-2 border-black bg-white text-black hover:bg-muted cursor-pointer';

                  let badgeStyle = 'bg-white text-black border-black';
                  let feedbackLabel = null;

                  if (isAnswered) {
                    if (isCorrect) {
                      buttonStyle = 'border-2 border-black bg-black text-white';
                      badgeStyle = 'bg-white text-black border-white';
                      feedbackLabel = 'CHÍNH XÁC ✓';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'border-4 border-black bg-white text-black line-through font-bold';
                      badgeStyle = 'bg-black text-white border-black';
                      feedbackLabel = 'CHƯA ĐÚNG ✕';
                    } else {
                      buttonStyle = 'border-2 border-black bg-white text-mutedForeground opacity-40';
                      badgeStyle = 'border-black text-mutedForeground';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`flex items-center justify-between p-4 border-2 text-left font-mono transition-colors duration-100 rounded-none shadow-none active:scale-[0.99] ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 border text-xs font-black flex items-center justify-center flex-shrink-0 ${badgeStyle}`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-serif truncate">
                          {option}
                        </span>
                      </div>

                      {feedbackLabel && (
                        <span className="font-mono text-xs font-bold shrink-0 ml-2">
                          {feedbackLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box (Revealed upon answer) */}
              {isAnswered && (
                <div className="p-4 border-2 border-black bg-muted text-black rounded-none shadow-none space-y-1 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-1 text-black">
                        {selectedOptionIndex === currentExercise.correctIndex
                          ? 'CHÍNH XÁC! (+5 XP)'
                          : `CHƯA CHÍNH XÁC · ĐÁP ÁN ĐÚNG: ${currentExercise.targetWord}`}
                      </h4>
                      <p className="font-sans text-xs sm:text-sm text-black leading-relaxed">
                        {currentExercise.explanation}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentExercise.fullSentence)}
                      className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none flex-shrink-0"
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
              <div className="space-y-2 pb-6 border-b-4 border-black">
                <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
                  HOÀN THÀNH BỘ BÀI TẬP ĐIỀN TỪ AI
                </div>
                <h3 className="font-serif font-black text-3xl sm:text-5xl text-black tracking-tight uppercase">
                  AI CLOZE EXERCISES COMPLETED
                </h3>
                <p className="font-serif text-lg sm:text-2xl text-black tracking-widest">
                  AI練習完了
                </p>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 border-2 border-black divide-x-2 divide-black max-w-sm mx-auto text-center">
                <div className="p-3.5 bg-white">
                  <span className="block font-serif text-2xl font-black text-black">
                    {score}/{total}
                  </span>
                  <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider font-bold">
                    ĐÚNG
                  </span>
                </div>
                <div className="p-3.5 bg-white">
                  <span className="block font-serif text-2xl font-black text-black">
                    {accuracyPercent}%
                  </span>
                  <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider font-bold">
                    CHÍNH XÁC
                  </span>
                </div>
                <div className="p-3.5 bg-white">
                  <span className="block font-serif text-2xl font-black text-black">
                    +{score * 5}
                  </span>
                  <span className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider font-bold">
                    XP
                  </span>
                </div>
              </div>

              {/* Missed questions review */}
              {wrongAnswers.length > 0 && (
                <div className="text-left mt-6 pt-4 border-t-2 border-black max-h-48 overflow-y-auto space-y-2">
                  <h4 className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                    CÁC CÂU CẦN ÔN LẠI ({wrongAnswers.length}):
                  </h4>
                  <div className="space-y-2">
                    {wrongAnswers.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-black bg-muted text-xs flex items-center justify-between gap-3 rounded-none"
                      >
                        <div>
                          <p className="font-serif font-bold text-black text-sm">
                            {item.fullSentence}
                          </p>
                          <p className="font-sans text-mutedForeground mt-0.5">
                            Đáp án: <strong className="font-mono text-black">{item.targetWord}</strong> — {item.translation}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.fullSentence)}
                          className="p-1.5 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none shrink-0"
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
          <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-3">
            {!isComplete ? (
              <button
                type="button"
                disabled={!isAnswered}
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
              >
                <span>{currentIndex + 1 === total ? 'XEM KẾT QUẢ TỔNG KẾT' : 'CÂU TIẾP THEO'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>LUYỆN LẠI BÀI NÀY</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase font-bold tracking-widest transition-colors duration-100 rounded-none shadow-none active:scale-[0.98]"
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

