'use client';

import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  Play,
  RotateCcw,
  Pencil,
  Volume2,
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
        strokeColor: '#000000',
        radicalColor: '#000000',
        outlineColor: '#E5E5E5',
        drawingColor: '#000000',
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
    setQuizMessage('[ ĐANG PHÁT THỨ TỰ NÉT VIẾT... ]');

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
    setQuizMessage('[ DÙNG CHUỘT HOẶC CẢM ỨNG ĐỂ VẼ TỪNG NÉT THEO THỨ TỰ ]');

    writerRef.current.quiz({
      onMistake: (strokeData: any) => {
        setMistakes((m) => m + 1);
        setQuizMessage(
          `[ NÉT CHƯA CHÍNH XÁC (LỖI: ${strokeData.mistakesOnStroke}). THỬ LẠI ]`
        );
      },
      onCorrectStroke: (strokeData: any) => {
        setCurrentStroke(strokeData.strokeNum + 2);
        setTotalStrokes(strokeData.totalStrokes);
        setQuizMessage(
          `[ CHÍNH XÁC: NÉT ${strokeData.strokeNum + 1}/${strokeData.totalStrokes} ]`
        );
      },
      onComplete: (summaryData: any) => {
        setIsQuiz(false);
        setQuizCompleted(true);
        setQuizMessage(
          `[ HOÀN THÀNH: ĐÃ VIẾT ĐÚNG CHỮ HÁN VỚI ${summaryData.totalMistakes} LỖI ]`
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
      className={`flex flex-col items-center bg-white p-5 border-2 border-black rounded-none shadow-none ${className}`}
    >
      {/* Canvas Area with Kanji practice grid lines */}
      <div
        className="relative flex items-center justify-center border-2 border-black bg-white rounded-none shadow-none overflow-hidden select-none"
        style={{ width: size, height: size }}
      >
        {/* Traditional Kanji Grid Lines in #E5E5E5 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-[#E5E5E5]"
          strokeWidth="1"
          strokeDasharray="4,4"
        >
          {/* Horizontal center */}
          <line x1="0" y1={size / 2} x2={size} y2={size / 2} />
          {/* Vertical center */}
          <line x1={size / 2} y1="0" x2={size / 2} y2={size} />
          {/* Diagonals */}
          <line x1="0" y1="0" x2={size} y2={size} />
          <line x1={size} y1="0" x2="0" y2={size} />
        </svg>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
          </div>
        )}

        {/* HanziWriter target div */}
        <div
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center ${
            error ? 'hidden' : 'block'
          }`}
        />

        {/* Fallback Graceful Render if character stroke data is not available */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span
              className="font-serif text-black select-none"
              style={{ fontSize: size * 0.55 }}
            >
              {character}
            </span>
            <span className="font-mono text-[10px] text-mutedForeground uppercase mt-2">
              [ HIỂN THỊ NÉT CHUẨN ]
            </span>
          </div>
        )}
      </div>

      {/* Quiz / Animation Status Banner */}
      {(quizMessage || quizCompleted) && (
        <div className="w-full mt-3.5 p-3 border border-black bg-white text-black font-mono text-xs uppercase tracking-wide rounded-none flex items-center gap-2">
          <span className="flex-1 leading-tight text-center">{quizMessage}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full">
        {/* Animate Button */}
        <button
          type="button"
          onClick={handleAnimate}
          disabled={loading || error || isAnimating}
          className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider rounded-none transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>HOẠT HỌA</span>
        </button>

        {/* Quiz Mode Button */}
        <button
          type="button"
          onClick={handleStartQuiz}
          disabled={loading || error}
          className={`flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-black font-mono text-xs uppercase tracking-wider rounded-none transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed ${
            isQuiz
              ? 'bg-black text-white hover:bg-white hover:text-black'
              : 'bg-white hover:bg-black hover:text-white'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>TẬP VIẾT</span>
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={loading || error}
          title="Xem lại / Đặt lại"
          className="p-2 border border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider rounded-none transition-colors duration-100 disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Pronounce Button */}
        <button
          type="button"
          onClick={handlePronounce}
          title="Phát âm chữ này"
          className="p-2 border border-black bg-white hover:bg-black hover:text-white font-mono text-xs uppercase tracking-wider rounded-none transition-colors duration-100"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default StrokeOrderWriter;
