'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore, ThemeMode } from '@/stores/themeStore';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'button' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`} />
    );
  }

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Giao diện Sáng', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: 'Giao diện Tối', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
    { mode: 'system', label: 'Theo thiết bị', icon: <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" /> },
  ];

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 ${className}`}>
        {options.map((opt) => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title={`Chủ đề: ${theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Theo thiết bị'}`}
        aria-label="Đổi chế độ giao diện"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400 transition-transform hover:scale-110" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform hover:scale-110" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-1.5 z-50 animate-pop">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Chế độ hiển thị
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
