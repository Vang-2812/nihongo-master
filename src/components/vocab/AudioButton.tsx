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
    sm: 'w-6 h-6 p-1 text-xs',
    md: 'w-7 h-7 sm:w-8 sm:h-8 p-1.5 text-sm',
    lg: 'w-9 h-9 p-2 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const variantClasses = {
    primary: 'bg-black text-white hover:bg-white hover:text-black border-black',
    subtle: 'bg-white text-black hover:bg-black hover:text-white border-black',
    ghost: 'bg-transparent text-black hover:bg-black hover:text-white border-transparent hover:border-black',
    outline: 'bg-white text-black hover:bg-black hover:text-white border-black',
  }[variant];

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={disabled}
      title={title}
      aria-label={`${title}: ${text}`}
      className={`relative inline-flex items-center justify-center border rounded-none transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${
        isPlaying ? 'bg-black text-white border-black' : variantClasses
      } ${className}`}
    >
      {disabled ? (
        <VolumeX className={`${iconSizes} opacity-50`} />
      ) : (
        <Volume2 className={`${iconSizes} stroke-[1.5]`} />
      )}
    </button>
  );
};

export default AudioButton;
