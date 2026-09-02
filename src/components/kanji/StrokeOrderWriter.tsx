'use client';

import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  Play,
  RotateCcw,
  Pencil,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { speakJapanese } from '@/lib/tts';

export interface StrokeOrderWriterProps {
  character: string;
  size?: number;
  className?: string;
}

export const StrokeOrderWriter: React.FC<StrokeOrderWriterProps> = ({
  character,
  size = 260,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isQuiz, setIsQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizMessage, setQuizMessage] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !character) return;

    // Reset state
    setLoading(true);
    setError(false);
    setIsAnimating(false);
    setIsQuiz(false);
    setQuizCompleted(false);
    setQuizMessage('');
    setMistakes(0);

    // Clear previous SVG content inside container
    containerRef.current.innerHTML = '';

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: 16,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 180,
        strokeColor: '#4f46e5', // Indigo 600
        radicalColor: '#e11d48', // Rose 600
        outlineColor: '#cbd5e1', // Slate 300
        drawingColor: '#2563eb', // Blue 600
        drawingWidth: 20,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onLoadCharDataError: () => {
          setError(true);
          setLoading(false);
        },
        onLoadCharDataSuccess: () => {
          setLoading(false);
          setError(false);
        },
      });

      writerRef.current = writer;
    } catch (err) {
      console.error('Failed to initialize HanziWriter:', err);
      setError(true);
      setLoading(false);
    }

    return () => {
      if (writerRef.current) {
        try {
          writerRef.current.cancelQuiz?.();
        } catch {}
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [character, size]);

  const handleAnimate = () => {
    if (!writerRef.current || error) return;
    setIsQuiz(false);
    setQuizCompleted(false);
    setIsAnimating(true);
    setQuizMessage('Đang phát thứ tự nét viết...');

    writerRef.current.cancelQuiz?.();
    writerRef.current.showCharacter();
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false);
        setQuizMessage('');
      },
    });
  };

  const handleStartQuiz = () => {
    if (!writerRef.current || error) return;
    setIsAnimating(false);
    setIsQuiz(true);
    setQuizCompleted(false);
    setMistakes(0);
    setCurrentStroke(1);
    setQuizMessage('Dùng chuột hoặc ngón tay để vẽ từng nét theo thứ tự!');

    writerRef.current.quiz({
      onMistake: (strokeData: any) => {
        setMistakes((m) => m + 1);
        setQuizMessage(
          `Nét chưa chính xác (Sai ${strokeData.mistakesOnStroke} lần). Hãy thử lại!`
        );
      },
      onCorrectStroke: (strokeData: any) => {
        setCurrentStroke(strokeData.strokeNum + 2);
        setTotalStrokes(strokeData.totalStrokes);
        setQuizMessage(
          `Chính xác! Nét ${strokeData.strokeNum + 1}/${strokeData.totalStrokes}`
        );
      },
      onComplete: (summaryData: any) => {
        setIsQuiz(false);
        setQuizCompleted(true);
        setQuizMessage(
          `Xuất sắc! Bạn đã viết đúng chữ Hán với ${summaryData.totalMistakes} lỗi.`
        );
      },
    });
  };

  const handleReset = () => {
    if (!writerRef.current || error) return;
    try {
      writerRef.current.cancelQuiz?.();
      writerRef.current.showCharacter();
      writerRef.current.showOutline();
    } catch {}
    setIsAnimating(false);
    setIsQuiz(false);
    setQuizCompleted(false);
    setQuizMessage('');
    setMistakes(0);
  };

  const handlePronounce = () => {
    speakJapanese(character);
  };

  return (
    <div
      className={`flex flex-col items-center bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      {/* Canvas Area with Kanji practice grid lines */}
      <div
        className="relative flex items-center justify-center rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 overflow-hidden select-none"
        style={{ width: size, height: size }}
      >
        {/* Traditional Kanji Grid Lines (Mễ tự cách / Điền tự cách) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="1"
          strokeDasharray="4,4"
        >
          {/* Horizontal center */}
          <line x1="0" y1={size / 2} x2={size} y2={size / 2} />
          {/* Vertical center */}
          <line x1={size / 2} y1="0" x2={size / 2} y2={size} />
          {/* Diagonals */}
          <line
            x1="0"
            y1="0"
            x2={size}
            y2={size}
            className="stroke-slate-100 dark:stroke-slate-800/60"
          />
          <line
            x1={size}
            y1="0"
            x2="0"
            y2={size}
            className="stroke-slate-100 dark:stroke-slate-800/60"
          />
        </svg>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs z-10">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* HanziWriter target div */}
        <div
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center ${
            error ? 'hidden' : 'block'
          }`}
        />

        {/* Fallback Graceful SVG Render if character stroke data is not available */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span
              className="font-serif text-8xl text-indigo-600 dark:text-indigo-400 select-none drop-shadow-sm"
              style={{ fontSize: size * 0.55 }}
            >
              {character}
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              (Hiển thị nét chuẩn)
            </span>
          </div>
        )}
      </div>

      {/* Quiz / Animation Status Banner */}
      {(quizMessage || quizCompleted) && (
        <div
          className={`w-full mt-3.5 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
            quizCompleted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
              : isQuiz
              ? mistakes > 0
                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60'
          }`}
        >
          {quizCompleted ? (
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : mistakes > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          <span className="flex-1 leading-tight">{quizMessage}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full">
        {/* Animate Button */}
        <button
          type="button"
          onClick={handleAnimate}
          disabled={loading || error || isAnimating}
          className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Hoạt họa</span>
        </button>

        {/* Quiz Mode Button */}
        <button
          type="button"
          onClick={handleStartQuiz}
          disabled={loading || error}
          className={`flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
            isQuiz
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800/80'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Tập viết</span>
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={loading || error}
          title="Xem lại / Đặt lại"
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Pronounce Button */}
        <button
          type="button"
          onClick={handlePronounce}
          title="Phát âm chữ này"
          className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800/80 transition-all active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default StrokeOrderWriter;
