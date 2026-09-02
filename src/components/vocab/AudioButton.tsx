'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakJapanese } from '@/lib/tts';

export interface AudioButtonProps {
  text: string;
  rate?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'subtle' | 'ghost' | 'outline';
  className?: string;
  title?: string;
  disabled?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  rate = 1.0,
  size = 'md',
  variant = 'subtle',
  className = '',
  title = 'Phát âm tiếng Nhật',
  disabled = false,
  onPlayStart,
  onPlayEnd,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || !text || text.trim() === '') return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsPlaying(true);
    if (onPlayStart) onPlayStart();

    speakJapanese(text, rate);

    // Approximate speech duration based on text length with a minimum duration for visual feedback
    const estimatedDuration = Math.max(1000, Math.min(4000, text.length * 220));

    timerRef.current = setTimeout(() => {
      setIsPlaying(false);
      if (onPlayEnd) onPlayEnd();
    }, estimatedDuration);
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs p-1',
    md: 'w-8 h-8 text-sm p-1.5',
    lg: 'w-10 h-10 text-base p-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const variantClasses = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-500/20',
    subtle:
      'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 border border-indigo-200/60 dark:border-indigo-800/60',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95',
    outline:
      'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95',
  }[variant];

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={disabled}
      title={title}
      aria-label={`${title}: ${text}`}
      className={`relative inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${
        isPlaying ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''
      } ${className}`}
    >
      {/* Playing pulse waves animation */}
      {isPlaying && (
        <>
          <span className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-full bg-indigo-500/20 animate-pulse pointer-events-none" />
        </>
      )}

      {disabled ? (
        <VolumeX className={`${iconSizes} opacity-50`} />
      ) : (
        <Volume2
          className={`${iconSizes} ${
            isPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-bounce' : ''
          }`}
        />
      )}
    </button>
  );
};

export default AudioButton;
