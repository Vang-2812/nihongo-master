'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import { exportBackupData, validateAndParseBackup } from '@/lib/storage';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import {
  Flame,
  Sparkles,
  BookOpen,
  Languages,
  RotateCcw,
  Dices,
  ArrowRight,
  Download,
  Upload,
  Layers,
  Trophy,
  CheckCircle2,
  Clock,
  Settings,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';

export default function HomePage() {
  const { stats, cards, getDueCards, exportData, importData } = useSRSStore();
  const [mounted, setMounted] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const importJsonTextareaId = useId();

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Safe SSR defaults
  const streak = mounted ? stats.streak : 0;
  const totalXp = mounted ? stats.totalXp : 0;
  const totalReviews = mounted ? stats.totalReviews : 0;
  const dueCardsList = mounted ? getDueCards() : [];
  const dueCount = dueCardsList.length;

  const vocabDueCount = dueCardsList.filter((c) => c.cardType === 'vocab').length;
  const kanjiDueCount = dueCardsList.filter((c) => c.cardType === 'kanji').length;

  const allCardsList = mounted ? Object.values(cards) : [];
  const totalCards = allCardsList.length;
  const learningCount = allCardsList.filter((c) => c.status === 'learning').length;
  const reviewCount = allCardsList.filter((c) => c.status === 'review').length;
  const newCount = allCardsList.filter((c) => c.status === 'new').length;

  // Level computation: Level 1 starts at 0 XP, each level requires 100 XP
  const currentLevel = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;
  const nextLevelXp = 100;

  const handleExport = () => {
    try {
      const data = exportData();
      const dateStr = new Date().toISOString().split('T')[0];
      exportBackupData(data, `nihongo_master_backup_${dateStr}.json`);
      toast.success('Đã tải xuống bản sao lưu dữ liệu thành công!');
    } catch {
      toast.error('Lỗi khi xuất dữ liệu sao lưu.');
    }
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) {
      toast.error('Vui lòng dán nội dung JSON sao lưu.');
      return;
    }

    const res = validateAndParseBackup(importJsonText);
    if (!res.success || !res.data) {
      toast.error(res.error || 'Dữ liệu sao lưu không hợp lệ.');
      return;
    }

    try {
      importData(res.data);
      toast.success('Khôi phục dữ liệu tiến độ học tập thành công!');
      setIsBackupModalOpen(false);
      setImportJsonText('');
    } catch {
      toast.error('Không thể áp dụng dữ liệu sao lưu.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* 1. Hero SRS Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 p-6 sm:p-10">
        {/* Background ambient glowing shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-300" />
              <span>Hệ thống Ôn tập Lặp lại Ngắt quãng (SM-2 SRS)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {dueCount > 0 ? (
                <>
                  Hôm nay cần ôn:{' '}
                  <span className="text-amber-300 underline decoration-amber-400/60 decoration-wavy underline-offset-8">
                    {dueCount} thẻ
                  </span>
                </>
              ) : (
                <>Tuyệt vời! Bạn đã hoàn thành hết thẻ ôn tập hôm nay 🎉</>
              )}
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              {dueCount > 0
                ? 'Ôn tập đúng thời điểm giúp củng cố vùng nhớ dài hạn và tăng 300% hiệu quả ghi nhớ Hán tự & Từ vựng.'
                : 'Hiện không có thẻ nào đến hạn cần ôn tập. Hãy học thêm thẻ mới hoặc thử thách bản thân với phòng Quizlet!'}
            </p>

            {/* SRS Breakdown badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs sm:text-sm font-medium text-white">
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Từ vựng đến hạn:</span>
                <span className="font-bold text-emerald-300">{vocabDueCount}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs sm:text-sm font-medium text-white">
                <Languages className="w-4 h-4 text-purple-300" />
                <span>Kanji đến hạn:</span>
                <span className="font-bold text-purple-300">{kanjiDueCount}</span>
              </div>
              {newCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs sm:text-sm font-medium text-white">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Thẻ mới:</span>
                  <span className="font-bold text-amber-300">{newCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            {dueCount > 0 ? (
              <Link
                href="/review"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base sm:text-lg shadow-lg shadow-amber-400/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                <RotateCcw className="w-5 h-5 animate-spin-slow" />
                <span>Bắt đầu ôn tập ngay</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/tango"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-sm transition-all text-center"
                >
                  <BookOpen className="w-4 h-4 text-emerald-300" />
                  <span>Khám phá Từ vựng</span>
                </Link>
                <Link
                  href="/kanji"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-sm transition-all text-center"
                >
                  <Languages className="w-4 h-4 text-purple-300" />
                  <span>Khám phá Kanji</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Stats Grid (Thống kê cá nhân) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>Tiến độ & Thống kê cá nhân</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tự động đồng bộ trên thiết bị
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Streak */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-400/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Chuỗi học tập
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {streak}{' '}
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">ngày</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {streak > 0 ? 'Duy trì đều đặn để giữ vững phong độ!' : 'Hãy hoàn thành 1 bài ôn hôm nay để bắt đầu chuỗi!'}
              </p>
            </div>
          </div>

          {/* Card 2: Level & Total XP */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-400/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cấp độ & Kinh nghiệm
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5 fill-indigo-500 text-indigo-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  Cấp {currentLevel}
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {totalXp} XP
                </span>
              </div>
              <ProgressBar
                value={xpInCurrentLevel}
                max={nextLevelXp}
                size="sm"
                variant="primary"
                showPercentage={false}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Còn {nextLevelXp - xpInCurrentLevel} XP lên Cấp {currentLevel + 1}</span>
              </p>
            </div>
          </div>

          {/* Card 3: SRS Cards Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-400/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kho thẻ SRS
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalCards}{' '}
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">thẻ</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {reviewCount} Đã thuộc
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {learningCount} Đang học
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Reviews */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-purple-400/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tổng lượt ôn
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalReviews}{' '}
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">lượt</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Đã ghi nhận qua thuật toán SM-2 thông minh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Quick Actions Grid (Lối tắt hành động nhanh) */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-500" />
          <span>Lối tắt hành động nhanh</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Action 1: Kanji */}
          <Link
            href="/kanji"
            className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                字
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Kho Hán tự (Kanji)
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  Học 2,136 Hán tự từ N5 đến N1 kèm thứ tự nét, âm Hán Việt và bộ thủ.
                </p>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {['N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
                  <span
                    key={lvl}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 2: Tango / Vocab */}
          <Link
            href="/tango"
            className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                語
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Kho Từ vựng (Tango)
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  Bộ từ vựng Minna no Nihongo, Mimikara Oboeru, Somatome kèm audio.
                </p>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {['Minna', 'Mimikara', 'Somatome'].map((b) => (
                  <span
                    key={b}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Học từ vựng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 3: Quizlet */}
          <Link
            href="/review/quiz"
            className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Dices className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Luyện Quizlet
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  Trắc nghiệm 4 đáp án, Ghép thẻ tốc độ và Ghép ký tự Kanji trực quan.
                </p>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {['Trắc nghiệm', 'Ghép thẻ', 'Ghép chữ'].map((m) => (
                  <span
                    key={m}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Vào phòng Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 4: Backup & Settings */}
          <div className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Sao lưu dữ liệu
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Xuất hoặc nhập dữ liệu học tập ra tệp JSON để bảo toàn tiến độ cá nhân.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Nhập bản sao lưu"
                aria-label="Nhập dữ liệu sao lưu"
              >
                <Upload className="w-4 h-4" />
              </button>
              <Link
                href="/settings"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Cài đặt hệ thống"
                aria-label="Cài đặt hệ thống"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Backup / Restore Modal */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Sao lưu & Khôi phục dữ liệu"
        description="Nhập hoặc dán nội dung tệp JSON sao lưu để khôi phục toàn bộ tiến độ học tập."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportJson}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              Áp dụng khôi phục
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tải lên tệp JSON từ máy tính:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor={importJsonTextareaId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Hoặc dán nội dung JSON vào đây:
            </label>
            <textarea
              id={importJsonTextareaId}
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"cards": {...}, "stats": {...}}'
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
