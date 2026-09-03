'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSRSStore } from '@/stores/srsStore';
import {
  BookOpen,
  Languages,
  RotateCcw,
  Sparkles,
  Flame,
  Settings,
  Menu,
  X,
  Dices,
  Home,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { stats, getDueCount } = useSRSStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dueCount = mounted ? getDueCount() : 0;
  const streak = mounted ? stats.streak : 0;
  const totalXp = mounted ? stats.totalXp : 0;

  const navLinks = [
    {
      href: '/',
      label: 'Trang chủ',
      icon: <Home className="w-4 h-4" />,
      exact: true,
    },
    {
      href: '/kanji',
      label: 'Hán tự (Kanji)',
      icon: <Languages className="w-4 h-4" />,
      exact: false,
    },
    {
      href: '/tango',
      label: 'Từ vựng (Tango)',
      icon: <BookOpen className="w-4 h-4" />,
      exact: false,
    },
    {
      href: '/review',
      label: 'Ôn tập (SRS)',
      icon: <RotateCcw className="w-4 h-4" />,
      badge: dueCount > 0 ? dueCount : undefined,
      exact: true,
    },
    {
      href: '/review/quiz',
      label: 'Quizlet',
      icon: <Dices className="w-4 h-4" />,
      exact: false,
    },
    {
      href: '/settings',
      label: 'Cài đặt',
      icon: <Settings className="w-4 h-4" />,
      exact: false,
    },
  ];

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  日
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                      Nihongo Master
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                      日本語マスター
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/30">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Header Indicators (Streak, XP) & Mobile menu button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Streak Badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-semibold shadow-xs"
                title={`Chuỗi học liên tục: ${streak} ngày`}
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
                <span>{streak} ngày</span>
              </div>

              {/* XP Badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold shadow-xs"
                title={`Tổng kinh nghiệm: ${totalXp} XP`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                <span>{totalXp} XP</span>
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Mobile hamburger toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="Mở menu điều hướng"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full">
                      {link.badge} thẻ đến hạn
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Mobile Theme Switcher Row */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Chế độ giao diện:</span>
              <ThemeToggle variant="segmented" />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <nav aria-label="Điều hướng nhanh" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center">
        {navLinks.slice(0, 5).map((link) => {
          const active = isLinkActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="relative">
                {link.icon}
                {link.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <span className="mt-0.5 truncate max-w-[60px]">
                {link.href === '/' ? 'Trang chủ' : link.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
