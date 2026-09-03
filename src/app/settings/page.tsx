'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSRSStore } from '@/stores/srsStore';
import { useKanjiStore } from '@/stores/kanjiStore';
import { useVocabStore } from '@/stores/vocabStore';
import { useThemeStore } from '@/stores/themeStore';
import { toast } from '@/stores/toastStore';
import { exportBackupData, validateAndParseBackup, BackupData } from '@/lib/storage';
import Modal from '@/components/ui/Modal';
import {
  Settings,
  Download,
  Upload,
  FileJson,
  Trash2,
  AlertTriangle,
  Check,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Database,
  Flame,
  Sparkles,
  Languages,
  ShieldAlert,
  Info,
  Layers,
  Calendar,
  Sliders,
  Palette,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useThemeStore();

  // SRS Store
  const {
    cards,
    stats: srsStats,
    dailyNewLimit,
    autoPlayAudio,
    soundEffects,
    setDailyNewLimit,
    setAutoPlayAudio,
    setSoundEffects,
    importData: importSRSData,
    resetProgress: resetSRSProgress,
  } = useSRSStore();

  // Kanji & Vocab Stores
  const { kanjiStatus, importKanjiProgress, resetKanjiProgress } = useKanjiStore();
  const {
    lessonProgress,
    vocabStatus,
    importVocabProgress,
    resetVocabProgress,
  } = useVocabStore();

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  // Reset / Danger Zone State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute Current Stats
  const cardCount = mounted ? Object.keys(cards).length : 0;
  const kanjiCount = mounted ? Object.keys(kanjiStatus).length : 0;
  const vocabCount = mounted ? Object.keys(vocabStatus).length : 0;
  const streak = mounted ? srsStats.streak : 0;
  const totalXp = mounted ? srsStats.totalXp : 0;

  // ==================== EXPORT BACKUP ====================
  const handleExportBackup = () => {
    try {
      const backupPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        stats: srsStats,
        cards,
        kanjiProgress: kanjiStatus,
        lessonProgress,
        vocabProgress: vocabStatus,
        settings: {
          dailyNewLimit,
          autoPlayAudio,
          soundEffects,
        },
      };

      exportBackupData(backupPayload, 'jp_study_backup.json');
      toast.success('Đã xuất file sao lưu jp_study_backup.json thành công!');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Có lỗi xảy ra khi tạo tệp sao lưu.');
    }
  };

  // ==================== IMPORT BACKUP ====================
  const handleTriggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          toast.error('Không thể đọc nội dung tệp.');
          return;
        }

        const validation = validateAndParseBackup(content);
        if (!validation.success || !validation.data) {
          toast.error(validation.error || 'Tệp sao lưu không hợp lệ.');
          return;
        }

        setPendingBackup(validation.data);
        setIsImportModalOpen(true);
      } catch (err: any) {
        toast.error(`Lỗi phân tích tệp: ${err?.message || 'Không xác định'}`);
      }
    };

    reader.onerror = () => {
      toast.error('Có lỗi xảy ra khi đọc tệp từ thiết bị.');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!pendingBackup) return;

    try {
      // 1. Import SRS Cards & Stats
      importSRSData({
        cards: pendingBackup.cards,
        stats: pendingBackup.stats,
        dailyNewLimit:
          pendingBackup.settings?.dailyNewLimit ?? pendingBackup.dailyNewLimit,
        autoPlayAudio:
          pendingBackup.settings?.autoPlayAudio ?? pendingBackup.autoPlayAudio,
        soundEffects:
          pendingBackup.settings?.soundEffects ?? pendingBackup.soundEffects,
      });

      // 2. Import Kanji Progress
      if (pendingBackup.kanjiProgress) {
        importKanjiProgress(pendingBackup.kanjiProgress);
      }

      // 3. Import Vocab & Lesson Progress
      const vocabData = pendingBackup.vocabProgress || pendingBackup.vocabStatus;
      if (pendingBackup.lessonProgress || vocabData) {
        importVocabProgress({
          lessonProgress: pendingBackup.lessonProgress,
          vocabStatus: vocabData,
        });
      }

      toast.success('Khôi phục dữ liệu thành công!');
      setIsImportModalOpen(false);
      setPendingBackup(null);
    } catch (err: any) {
      console.error('Import confirmation error:', err);
      toast.error(`Có lỗi xảy ra khi khôi phục: ${err?.message || 'Lỗi không xác định'}`);
    }
  };

  // ==================== DANGER ZONE RESET ====================
  const handleConfirmReset = () => {
    const trimmed = resetConfirmInput.trim().toUpperCase();
    if (trimmed !== 'XÓA' && trimmed !== 'RESET') {
      toast.error('Vui lòng nhập chính xác "XÓA" hoặc "RESET" để xác nhận.');
      return;
    }

    try {
      // Reset all Zustand stores
      resetSRSProgress();
      resetKanjiProgress();
      resetVocabProgress();

      // Clean storage keys if available
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nihongo_srs_storage');
        localStorage.removeItem('nihongo_kanji_storage');
        localStorage.removeItem('nihongo_vocab_storage');
      }

      toast.success('Đã xóa toàn bộ dữ liệu học tập thành công.');
      setIsResetModalOpen(false);
      setResetConfirmInput('');
    } catch (err: any) {
      toast.error(`Lỗi khi đặt lại dữ liệu: ${err?.message || 'Lỗi không xác định'}`);
    }
  };

  // Daily new limit choices
  const limitOptions = [10, 20, 30, 50];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Cài Đặt & Quản Lý Dữ Liệu
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tùy chỉnh thông số học tập, sao lưu dự phòng và khôi phục tiến độ trên thiết bị.
            </p>
          </div>
        </div>

        {/* Current Storage Snapshot Bar */}
        {mounted && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Thẻ SRS trong kho
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {cardCount}
                </span>
                <span className="text-xs text-slate-400">thẻ</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Chuỗi học liên tục
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {streak}
                </span>
                <span className="text-xs text-slate-400">ngày</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Tổng kinh nghiệm
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {totalXp}
                </span>
                <span className="text-xs text-slate-400">XP</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Hán tự & Từ vựng
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Languages className="w-4 h-4 text-purple-500" />
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {kanjiCount + vocabCount}
                </span>
                <span className="text-xs text-slate-400">mục</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== THEME & APPEARANCE SECTION ==================== */}
      <section
        aria-labelledby="theme-appearance-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="theme-appearance-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Giao Diện & Chủ Đề (Appearance)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Tùy chỉnh chế độ hiển thị Sáng / Tối để bảo vệ mắt và tối ưu trải nghiệm học tập.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Theme Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success('Đã chuyển sang Giao diện Sáng (Light Mode)');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-slate-800 shadow-md ring-2 ring-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Giao diện Sáng
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nền trắng xám dịu mắt, độ tương phản cao, tối ưu khi học ban ngày hoặc không gian sáng.
                </p>
              </div>
            </button>

            {/* Dark Theme Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.success('Đã chuyển sang Giao diện Tối (Dark Mode)');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-slate-800 shadow-md ring-2 ring-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800">
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Giao diện Tối
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tông màu slate tối mượt mà, giảm mỏi mắt khi học ban đêm hoặc phòng tối.
                </p>
              </div>
            </button>

            {/* System Theme Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('system');
                toast.success('Đã đặt chế độ Giao diện theo thiết bị');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                theme === 'system'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-slate-800 shadow-md ring-2 ring-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  {theme === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Theo thiết bị (System)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tự động đồng bộ theo cài đặt giao diện Sáng/Tối của hệ điều hành trên máy.
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 1: STUDY PREFERENCES ==================== */}
      <section
        aria-labelledby="study-preferences-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="study-preferences-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Cài Đặt Học Tập (Study Preferences)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Cấu hình thuật toán lặp lại ngắt quãng SM-2 và trải nghiệm ôn tập.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Daily New Limit */}
          <div className="pt-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Số thẻ mới mỗi ngày (Daily New Cards)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Giới hạn số lượng thẻ mới xuất hiện trong mỗi phiên ôn tập để tránh quá tải.
                </p>
              </div>

              {/* Segmented Radio Pills */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                {limitOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDailyNewLimit(opt);
                      toast.info(`Đã đổi giới hạn thẻ mới sang ${opt} thẻ/ngày`);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dailyNewLimit === opt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt} thẻ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Play Audio Toggle */}
          <div className="pt-6 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label
                htmlFor="toggle-autoplay"
                className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
              >
                Tự động phát âm thanh khi lật thẻ
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động đọc to từ vựng/kanji tiếng Nhật qua Web Speech API khi bạn bấm lật sang mặt sau.
              </p>
            </div>

            <button
              id="toggle-autoplay"
              type="button"
              role="switch"
              aria-checked={autoPlayAudio}
              onClick={() => {
                const nextVal = !autoPlayAudio;
                setAutoPlayAudio(nextVal);
                toast.info(
                  nextVal
                    ? 'Đã bật tự động phát âm thanh khi lật thẻ'
                    : 'Đã tắt tự động phát âm thanh'
                );
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                autoPlayAudio ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className="sr-only">Tự động phát âm thanh</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  autoPlayAudio ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {autoPlayAudio ? (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
              </span>
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="pt-6 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label
                htmlFor="toggle-soundeffects"
                className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
              >
                Âm thanh thông báo khi làm đúng/sai
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phát hiệu ứng âm thanh phản hồi trong các bài trắc nghiệm Quizlet và ghép thẻ.
              </p>
            </div>

            <button
              id="toggle-soundeffects"
              type="button"
              role="switch"
              aria-checked={soundEffects}
              onClick={() => {
                const nextVal = !soundEffects;
                setSoundEffects(nextVal);
                toast.info(
                  nextVal
                    ? 'Đã bật âm thanh phản hồi quiz'
                    : 'Đã tắt âm thanh phản hồi quiz'
                );
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                soundEffects ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className="sr-only">Âm thanh thông báo khi làm đúng/sai</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  soundEffects ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {soundEffects ? (
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                )}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: BACKUP & RESTORE ==================== */}
      <section
        aria-labelledby="backup-restore-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="backup-restore-heading"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Xuất tệp JSON để lưu trữ ngoại tuyến hoặc nhập tệp sao lưu từ thiết bị khác.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Export Backup */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Xuất tệp sao lưu JSON</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tải về tệp <code className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">jp_study_backup.json</code> chứa toàn bộ thẻ SRS, lịch sử ôn tập, chuỗi streak, kinh nghiệm XP, tiến độ Hán tự và cài đặt học tập.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/10 transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file sao lưu (JSON)</span>
              </button>
              <span className="text-[11px] text-slate-400 text-center">
                Định dạng JSON tiêu chuẩn • Không giới hạn số lần xuất
              </span>
            </div>
          </div>

          {/* Card 2: Import Backup */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>Nhập dữ liệu sao lưu</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Khôi phục hoặc đồng bộ tiến độ học tập từ tệp JSON đã lưu trước đây. Hệ thống sẽ tự động kiểm tra tính toàn vẹn và hiển thị bảng xem trước chi tiết trước khi áp dụng.
              </p>
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Chọn tệp JSON sao lưu để nhập"
            />

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTriggerFilePicker}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/10 transition-all active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn tệp sao lưu (.json)</span>
              </button>
              <span className="text-[11px] text-slate-400 text-center">
                Tự động kiểm tra cú pháp và schema trước khi khôi phục
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: DANGER ZONE ==================== */}
      <section
        aria-labelledby="danger-zone-heading"
        className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="danger-zone-heading"
              className="text-lg font-bold text-rose-900 dark:text-rose-200"
            >
              Vùng Nguy Hiểm (Danger Zone)
            </h2>
            <p className="text-xs sm:text-sm text-rose-700/80 dark:text-rose-400">
              Các thao tác nhạy cảm có thể ảnh hưởng vĩnh viễn tới dữ liệu học tập của bạn.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Xóa toàn bộ dữ liệu học tập (Reset Everything)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Xóa sạch tất cả thẻ Flashcard SRS, chuỗi ngày streak ({streak} ngày), điểm kinh nghiệm ({totalXp} XP), tiến độ Hán tự và từ vựng về trạng thái ban đầu. Thao tác này không thể hoàn tác.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetConfirmInput('');
              setIsResetModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/10 transition-all active:scale-98 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa toàn bộ dữ liệu</span>
          </button>
        </div>
      </section>

      {/* ==================== SECTION 4: ABOUT & TIPS ==================== */}
      <section
        aria-labelledby="about-app-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
          <Info className="w-5 h-5 text-indigo-500" />
          <h2 id="about-app-heading" className="text-base sm:text-lg">
            Giới Thiệu Nihongo Master & Hướng Dẫn Lưu Trữ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Kiến trúc Offline-First (Không cần Server)</span>
            </div>
            <p>
              Nihongo Master hoạt động 100% trên trình duyệt của bạn với công nghệ Static Web và LocalStorage. Ứng dụng không thu thập thông tin cá nhân và hoàn toàn có thể sử dụng khi không có mạng Internet.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Mẹo Bảo Vệ Chuỗi Học Tập</span>
            </div>
            <p>
              Do dữ liệu nằm tại trình duyệt thiết bị, việc dọn dẹp cache hoặc đổi trình duyệt có thể làm mất dữ liệu. Hãy bấm <strong>Xuất file sao lưu (JSON)</strong> định kỳ để lưu trữ an toàn trên Google Drive hoặc máy tính cá nhân.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 gap-2">
          <span>Nihongo Master • Phiên bản v1.0.0 (Release)</span>
          <span>Thuật toán SM-2 Spaced Repetition • Hỗ trợ JLPT N5 ~ N1</span>
        </div>
      </section>

      {/* ==================== IMPORT CONFIRMATION MODAL ==================== */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setPendingBackup(null);
        }}
        title={
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <FileJson className="w-5 h-5" />
            <span>Xác Nhận Khôi Phục Dữ Liệu</span>
          </div>
        }
        description="Kiểm tra thông tin chi tiết của bản sao lưu trước khi tiến hành cập nhật vào hệ thống."
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setPendingBackup(null);
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-500/20 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận khôi phục</span>
            </button>
          </>
        }
      >
        {pendingBackup && (
          <div className="space-y-4">
            {/* Backup Timestamp Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">Thời gian xuất sao lưu:</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                {pendingBackup.exportedAt
                  ? new Date(pendingBackup.exportedAt).toLocaleString('vi-VN')
                  : 'Không rõ'}
              </span>
            </div>

            {/* Backup Statistics Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Số thẻ SRS
                </span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {pendingBackup.cards
                    ? Array.isArray(pendingBackup.cards)
                      ? pendingBackup.cards.length
                      : Object.keys(pendingBackup.cards).length
                    : 0}{' '}
                  thẻ
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Chuỗi Streak
                </span>
                <span className="text-base font-bold text-amber-500 mt-0.5 block">
                  {pendingBackup.stats?.streak ?? 0} ngày
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Tổng điểm XP
                </span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {pendingBackup.stats?.totalXp ?? pendingBackup.stats?.totalXP ?? 0} XP
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Lượt ôn tập
                </span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {pendingBackup.stats?.totalReviews ?? 0} lượt
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Hán tự (Kanji)
                </span>
                <span className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
                  {Object.keys(pendingBackup.kanjiProgress || {}).length} chữ
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Từ vựng (Tango)
                </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {Object.keys(
                    pendingBackup.vocabProgress || pendingBackup.vocabStatus || {}
                  ).length}{' '}
                  từ
                </span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Dữ liệu hiện có trên trình duyệt này sẽ được cập nhật đồng bộ với bản sao lưu. Các thẻ SRS và tiến độ trong tệp sao lưu sẽ được áp dụng vào hệ thống.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== DANGER ZONE RESET MODAL ==================== */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetConfirmInput('');
        }}
        title={
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Xác Nhận Xóa Toàn Bộ Dữ Liệu</span>
          </div>
        }
        description="Thao tác này sẽ xóa vĩnh viễn toàn bộ tiến trình học tập trên thiết bị này."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsResetModalOpen(false);
                setResetConfirmInput('');
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={
                resetConfirmInput.trim().toUpperCase() !== 'XÓA' &&
                resetConfirmInput.trim().toUpperCase() !== 'RESET'
              }
              onClick={handleConfirmReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa vĩnh viễn dữ liệu</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            <p className="font-bold">⚠️ Bạn chuẩn bị xóa:</p>
            <ul className="list-disc list-inside mt-1.5 space-y-1">
              <li>{cardCount} thẻ Spaced Repetition (SRS)</li>
              <li>Chuỗi streak {streak} ngày và {totalXp} XP</li>
              <li>Toàn bộ {kanjiCount} Hán tự và {vocabCount} từ vựng đã học</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reset-confirm-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
            >
              Để xác nhận, vui lòng nhập <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-rose-600 dark:text-rose-400 font-mono">XÓA</code> hoặc <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-rose-600 dark:text-rose-400 font-mono">RESET</code> vào ô bên dưới:
            </label>
            <input
              id="reset-confirm-input"
              type="text"
              value={resetConfirmInput}
              onChange={(e) => setResetConfirmInput(e.target.value)}
              placeholder='Nhập "XÓA" hoặc "RESET"'
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors font-medium"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
