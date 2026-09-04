'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClozeExerciseItem } from '@/types/ai';
import { useAIStore } from '@/stores/aiStore';
import { useSRSStore } from '@/stores/srsStore';
import { speakJapanese } from '@/lib/tts';
import {
  X,
  Eye,
  EyeOff,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                Bài tập AI: {lessonTitle}
              </h3>
              {!isComplete && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Câu {currentIndex + 1} / {total}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Translation Toggle Button */}
            {!isComplete && (
              <button
                type="button"
                onClick={() => setIsTranslationVisible((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  isTranslationVisible
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title={isTranslationVisible ? 'Đang hiện nghĩa tiếng Việt' : 'Đang ẩn nghĩa tiếng Việt'}
              >
                {isTranslationVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isTranslationVisible ? 'Dịch: BẬT' : 'Dịch: TẮT'}
                </span>
              </button>
            )}

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!isComplete && (
          <div className="px-5 pt-2">
            <ProgressBar value={progressPercent} size="sm" variant="purple" />
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-between">
          {!isComplete && currentExercise ? (
            <div className="space-y-6">
              {/* Question Card */}
              <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-100 dark:border-purple-900/30 text-center relative">
                {/* Audio button */}
                <button
                  type="button"
                  onClick={() =>
                    handlePlayAudio(
                      isAnswered ? currentExercise.fullSentence : currentExercise.sentence.replace('（　　）', '...')
                    )
                  }
                  className="absolute right-3.5 top-3.5 p-2 rounded-xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100 dark:border-purple-900/40 hover:scale-105 active:scale-95 transition-all"
                  title="Nghe phát âm (Phím R)"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-purple-500' : ''}`} />
                </button>

                <span className="inline-block text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 mb-3">
                  Điền từ thích hợp vào chỗ trống
                </span>

                {/* Japanese Sentence */}
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed tracking-wide my-2 px-2">
                  {currentExercise.sentence.split('（　　）').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {index < arr.length - 1 && (
                        <span
                          className={`inline-block px-3 py-0.5 mx-1.5 rounded-lg border-2 font-black transition-all ${
                            isAnswered
                              ? selectedOptionIndex === currentExercise.correctIndex
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                              : 'bg-purple-100/90 dark:bg-purple-900/60 border-purple-400 text-purple-700 dark:text-purple-300 animate-pulse'
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
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium italic transition-opacity">
                      "{currentExercise.translation}"
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTranslationVisible(true)}
                      className="text-xs text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Bấm để xem nghĩa tiếng Việt</span>
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
                    'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700';

                  if (isAnswered) {
                    if (isCorrect) {
                      buttonStyle =
                        'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle =
                        'bg-rose-600 dark:bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20';
                    } else {
                      buttonStyle =
                        'opacity-40 bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center flex-shrink-0 ${
                            isAnswered && isCorrect
                              ? 'bg-white text-emerald-600'
                              : isAnswered && isSelected
                              ? 'bg-white text-rose-600'
                              : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base sm:text-lg font-bold truncate">
                          {option}
                        </span>
                      </div>

                      {isAnswered && (
                        <div>
                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                          {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box (Revealed upon answer) */}
              {isAnswered && (
                <div
                  className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
                    selectedOptionIndex === currentExercise.correctIndex
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4
                        className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${
                          selectedOptionIndex === currentExercise.correctIndex
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {selectedOptionIndex === currentExercise.correctIndex
                          ? 'Chính xác! (+5 XP)'
                          : `Chưa chính xác (Đáp án đúng: ${currentExercise.targetWord})`}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {currentExercise.explanation}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentExercise.fullSentence)}
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors flex-shrink-0"
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
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-4 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-2">
                {accuracyPercent >= 80 ? (
                  <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
                ) : (
                  <Award className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                )}
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {accuracyPercent >= 80 ? 'Hoàn thành xuất sắc!' : 'Hoàn thành bài luyện tập!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Bạn đã hoàn thành bộ bài tập điền từ bằng AI cho bài học này
                </p>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-slate-900 dark:text-white">
                    {score}/{total}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Đúng
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-purple-600 dark:text-purple-400">
                    {accuracyPercent}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Chính xác
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-amber-500">
                    +{score * 5}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    XP nhận
                  </span>
                </div>
              </div>

              {/* Missed questions review */}
              {wrongAnswers.length > 0 && (
                <div className="text-left mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Các câu cần ôn lại ({wrongAnswers.length}):
                  </h4>
                  <div className="space-y-2">
                    {wrongAnswers.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {item.fullSentence}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                            Đáp án: <span className="text-emerald-600 font-bold">{item.targetWord}</span> — {item.translation}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.fullSentence)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600"
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
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {!isComplete ? (
              <button
                type="button"
                disabled={!isAnswered}
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 active:scale-98 transition-all"
              >
                <span>{currentIndex + 1 === total ? 'Xem kết quả tổng kết' : 'Câu tiếp theo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-98 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Luyện lại bài này</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 active:scale-98 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Quay về bài học</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
