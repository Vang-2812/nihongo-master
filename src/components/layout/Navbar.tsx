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
      icon: <Home className="w-4 h-4" strokeWidth={1.5} />,
      exact: true,
    },
    {
      href: '/kanji',
      label: 'Kanji',
      icon: <Languages className="w-4 h-4" strokeWidth={1.5} />,
      exact: false,
    },
    {
      href: '/tango',
      label: 'Từ vựng',
      icon: <BookOpen className="w-4 h-4" strokeWidth={1.5} />,
      exact: false,
    },
    {
      href: '/review',
      label: 'Ôn tập',
      icon: <RotateCcw className="w-4 h-4" strokeWidth={1.5} />,
      badge: dueCount > 0 ? dueCount : undefined,
      exact: true,
    },
    {
      href: '/review/quiz',
      label: 'Quiz',
      icon: <Dices className="w-4 h-4" strokeWidth={1.5} />,
      exact: false,
    },
    {
      href: '/settings',
      label: 'Cài đặt',
      icon: <Settings className="w-4 h-4" strokeWidth={1.5} />,
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
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                <img
                  src="/favicon.svg"
                  alt="Nihongo Master Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-none border border-stone-800 shadow-xs shrink-0 object-contain group-hover:border-stone-600 transition-colors"
                />
                <div className="flex items-center">
                  <span className="font-serif text-stone-900 font-extrabold tracking-tight text-xl sm:text-2xl">
                    NIHONGO MASTER
                  </span>
                  <span className="bg-stone-100 text-stone-700 border border-stone-300 font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 ml-2">
                    ARCHIVE
                  </span>
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
                    className={`font-sans text-xs uppercase tracking-wider font-semibold px-3 py-1.5 transition-colors duration-100 flex items-center gap-1.5 ${
                      active
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono border px-1 py-0.5 ml-1 ${
                          active ? 'border-white/30 text-white' : 'border-stone-300 text-stone-700 bg-stone-100'
                        }`}
                      >
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
                className="flex items-center gap-1.5 px-2.5 py-1 border border-stone-200 bg-white text-stone-700 font-mono text-xs uppercase tracking-wider"
                title={`Chuỗi học liên tục: ${streak} ngày`}
              >
                <Flame className="w-3.5 h-3.5 stroke-[1.5] text-amber-600" />
                <span>{streak} NGÀY</span>
              </div>

              {/* XP Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 border border-stone-200 bg-white text-stone-700 font-mono text-xs uppercase tracking-wider"
                title={`Tổng kinh nghiệm: ${totalXp} XP`}
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[1.5] text-amber-600" />
                <span>{totalXp} XP</span>
              </div>

              {/* Mobile hamburger toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-stone-400"
                aria-label="Mở menu điều hướng"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown drawer menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 font-sans text-xs uppercase tracking-wider font-semibold transition-colors duration-100 ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono border px-1.5 py-0.5 ${
                        active ? 'border-white/30 text-white' : 'border-stone-300 text-stone-700 bg-stone-100'
                      }`}
                    >
                      {link.badge} ĐẾN HẠN
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <nav aria-label="Điều hướng nhanh" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-stone-200 px-1 py-1.5 flex justify-around items-center">
        {navLinks.slice(0, 5).map((link) => {
          const active = isLinkActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 font-sans text-[10px] uppercase tracking-wider font-semibold transition-colors duration-100 ${
                active
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <div className="relative">
                {link.icon}
                {link.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1.5 w-2 h-2 border ${active ? 'bg-white border-stone-900' : 'bg-rose-500 border-white'}`} />
                )}
              </div>
              <span className="mt-0.5 truncate max-w-[64px]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
