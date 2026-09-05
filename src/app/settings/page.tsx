'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSRSStore } from '@/stores/srsStore';
import { useKanjiStore } from '@/stores/kanjiStore';
import { useVocabStore } from '@/stores/vocabStore';
import { useThemeStore } from '@/stores/themeStore';
import { toast } from '@/stores/toastStore';
import { exportBackupData, validateAndParseBackup, BackupData } from '@/lib/storage';
import Modal from '@/components/ui/Modal';
import SyncSettingsSection from '@/components/sync/SyncSettingsSection';
import AISettingsSection from '@/components/settings/AISettingsSection';
import {
  Download,
  Upload,
  FileJson,
  Trash2,
  AlertTriangle,
  Check,
  Database,
  ShieldAlert,
  Info,
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
    <div className="min-h-[calc(100vh-4rem)] py-10 sm:py-16 px-4 max-w-5xl mx-auto space-y-10 animate-fadeIn">
      {/* ==================== EDITORIAL PAGE HEADER ==================== */}
      <section>
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <span className="font-mono text-xs uppercase tracking-widest text-stone-600 border border-stone-300 bg-stone-100/60 px-2 py-0.5">
            ARCHIVE CONTROL
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
            SM-2 ENGINE CONFIGURATION & REPOSITORY
          </span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-stone-900 uppercase leading-tight">
          PREFERENCES & ARCHIVE MANAGEMENT
          <span className="block font-serif text-3xl sm:text-5xl lg:text-6xl mt-2 tracking-normal text-stone-800">
            設定と管理
          </span>
        </h1>

        <p className="font-mono text-xs sm:text-sm tracking-widest text-stone-500 uppercase mt-4 max-w-2xl">
          TÙY CHỈNH HỆ THỐNG · LƯU TRỮ DỮ LIỆU NỘI BỘ · ĐỒNG BỘ ĐÁM MÂY & BẢO MẬT
        </p>

        {/* Hairline stone section rule */}
        <div className="h-px bg-stone-300 w-full my-8 sm:my-10" />

        {/* Current Storage Snapshot Bar */}
        {mounted && (
          <div className="border border-stone-200 bg-white shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-stone-200 grid grid-cols-2 sm:grid-cols-4 mb-10">
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 block">
                SRS CARDS
              </span>
              <div className="my-3">
                <span className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight leading-none">
                  {cardCount}
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Thẻ SRS trong kho
              </span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 block">
                STREAK
              </span>
              <div className="my-3">
                <span className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight leading-none">
                  {streak}
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Ngày liên tục
              </span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 block">
                EXPERIENCE
              </span>
              <div className="my-3">
                <span className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight leading-none">
                  {totalXp}
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Tổng điểm XP
              </span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 block">
                KANJI & VOCAB
              </span>
              <div className="my-3">
                <span className="font-serif text-3xl sm:text-4xl font-light text-stone-900 tracking-tight leading-none">
                  {kanjiCount + vocabCount}
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Mục đã học
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ==================== THEME & APPEARANCE SECTION ==================== */}
      <section
        aria-labelledby="theme-appearance-heading"
        className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm"
      >
        <div className="pb-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                INTERFACE
              </span>
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                MUTED CONTRAST
              </span>
            </div>
            <h2
              id="theme-appearance-heading"
              className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900 flex items-center gap-2"
            >
              <Palette className="w-5 h-5 text-stone-700" />
              Giao Diện & Chủ Đề (Appearance)
            </h2>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500 mt-1">
              Tùy chỉnh chế độ hiển thị Sáng / Tối để tối ưu tương phản thị giác
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Theme Card */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success('Đã chuyển sang Giao diện Sáng (Light Mode)');
              }}
              className={`p-5 text-left transition-all duration-150 flex flex-col justify-between border ${
                theme === 'light'
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-white' : 'text-stone-700'}`} />
                  {theme === 'light' ? (
                    <span className="border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                      CHỌN
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-medium uppercase tracking-tight">
                  Giao Diện Sáng
                </h3>
                <p className={`font-sans text-xs mt-2 leading-relaxed ${theme === 'light' ? 'text-stone-300' : 'text-stone-500'}`}>
                  Nền giấy trắng cao cấp, độ tương phản dịu mắt, tối ưu khi học tập ban ngày.
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
              className={`p-5 text-left transition-all duration-150 flex flex-col justify-between border ${
                theme === 'dark'
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-stone-700'}`} />
                  {theme === 'dark' ? (
                    <span className="border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                      CHỌN
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-medium uppercase tracking-tight">
                  Giao Diện Tối
                </h3>
                <p className={`font-sans text-xs mt-2 leading-relaxed ${theme === 'dark' ? 'text-stone-300' : 'text-stone-500'}`}>
                  Tông màu trầm ấm, giảm mỏi mắt khi học tập trong không gian tối.
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
              className={`p-5 text-left transition-all duration-150 flex flex-col justify-between border ${
                theme === 'system'
                  ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Laptop className={`w-5 h-5 ${theme === 'system' ? 'text-white' : 'text-stone-700'}`} />
                  {theme === 'system' ? (
                    <span className="border border-white/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
                      CHỌN
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-medium uppercase tracking-tight">
                  Theo Thiết Bị
                </h3>
                <p className={`font-sans text-xs mt-2 leading-relaxed ${theme === 'system' ? 'text-stone-300' : 'text-stone-500'}`}>
                  Tự động đồng bộ theo cấu hình giao diện Sáng / Tối của hệ điều hành.
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 1: STUDY PREFERENCES ==================== */}
      <section
        aria-labelledby="study-preferences-heading"
        className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm"
      >
        <div className="pb-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                SM-2 ENGINE
              </span>
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                REPETITION PARAMS
              </span>
            </div>
            <h2
              id="study-preferences-heading"
              className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900 flex items-center gap-2"
            >
              <Sliders className="w-5 h-5 text-stone-700" />
              Cài Đặt Học Tập (Study Preferences)
            </h2>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500 mt-1">
              Cấu hình thuật toán lặp lại ngắt quãng SM-2 và hành vi ôn tập
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6 divide-y divide-stone-200">
          {/* Daily New Limit */}
          <div className="pt-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="font-serif text-base font-medium uppercase tracking-tight text-stone-900 block">
                  Số Thẻ Mới Mỗi Ngày (Daily New Cards)
                </label>
                <p className="font-sans text-xs text-stone-500 mt-0.5">
                  Giới hạn số lượng thẻ mới xuất hiện trong mỗi phiên ôn tập để tránh quá tải.
                </p>
              </div>

              {/* Muted Stone Rectangular Buttons */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {limitOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDailyNewLimit(opt);
                      toast.info(`Đã đổi giới hạn thẻ mới sang ${opt} thẻ/ngày`);
                    }}
                    className={`border px-3 py-1.5 font-mono text-xs uppercase transition-colors duration-100 ${
                      dailyNewLimit === opt
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                    }`}
                  >
                    {opt} THẺ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Play Audio Toggle */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="font-serif text-base font-medium uppercase tracking-tight text-stone-900 block">
                Tự Động Phát Âm Thanh Khi Lật Thẻ
              </label>
              <p className="font-sans text-xs text-stone-500 mt-0.5">
                Tự động đọc to từ vựng/kanji tiếng Nhật qua Web Speech API khi lật sang mặt sau.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setAutoPlayAudio(true);
                  toast.info('Đã bật tự động phát âm thanh khi lật thẻ');
                }}
                className={`border px-4 py-1.5 font-mono text-xs uppercase font-medium transition-colors duration-100 ${
                  autoPlayAudio
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                BẬT
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoPlayAudio(false);
                  toast.info('Đã tắt tự động phát âm thanh');
                }}
                className={`border px-4 py-1.5 font-mono text-xs uppercase font-medium transition-colors duration-100 ${
                  !autoPlayAudio
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                TẮT
              </button>
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="font-serif text-base font-medium uppercase tracking-tight text-stone-900 block">
                Âm Thanh Thông Báo Khi Làm Đúng/Sai
              </label>
              <p className="font-sans text-xs text-stone-500 mt-0.5">
                Phát hiệu ứng âm thanh phản hồi trong các bài trắc nghiệm Quiz và ghép thẻ.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSoundEffects(true);
                  toast.info('Đã bật âm thanh phản hồi quiz');
                }}
                className={`border px-4 py-1.5 font-mono text-xs uppercase font-medium transition-colors duration-100 ${
                  soundEffects
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                BẬT
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundEffects(false);
                  toast.info('Đã tắt âm thanh phản hồi quiz');
                }}
                className={`border px-4 py-1.5 font-mono text-xs uppercase font-medium transition-colors duration-100 ${
                  !soundEffects
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                TẮT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== AI ASSISTANT CONFIGURATION SECTION ==================== */}
      <AISettingsSection />

      {/* ==================== MULTI-DEVICE CLOUD SYNC SECTION ==================== */}
      <SyncSettingsSection />

      {/* ==================== SECTION 2: BACKUP & RESTORE ==================== */}
      <section
        aria-labelledby="backup-restore-heading"
        className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm"
      >
        <div className="pb-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                REPOSITORY
              </span>
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
                LOCAL SNAPSHOT ARCHIVE
              </span>
            </div>
            <h2
              id="backup-restore-heading"
              className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900 flex items-center gap-2"
            >
              <Database className="w-5 h-5 text-stone-700" />
              Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore)
            </h2>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500 mt-1">
              Xuất tệp JSON để lưu trữ ngoại tuyến hoặc khôi phục tiến độ từ tệp sao lưu
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Export Backup */}
          <div className="border border-stone-200 p-6 bg-white flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600 block w-fit">
                EXPORT ARCHIVE
              </span>
              <h3 className="font-serif text-lg font-medium uppercase tracking-tight text-stone-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-stone-700" />
                Xuất Tệp Sao Lưu JSON
              </h3>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Tải về tệp <code className="px-1.5 py-0.5 border border-stone-300 bg-stone-100 font-mono text-xs text-stone-800 font-medium">jp_study_backup.json</code> chứa toàn bộ thẻ SRS, lịch sử ôn tập, chuỗi streak, kinh nghiệm XP, tiến độ Hán tự và cài đặt học tập.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 w-full shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File Sao Lưu (JSON)</span>
              </button>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider text-center">
                ĐỊNH DẠNG JSON TIÊU CHUẨN • KHÔNG GIỚI HẠN SỐ LẦN
              </span>
            </div>
          </div>

          {/* Card 2: Import Backup */}
          <div className="border border-stone-200 p-6 bg-white flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-2">
              <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600 block w-fit">
                IMPORT ARCHIVE
              </span>
              <h3 className="font-serif text-lg font-medium uppercase tracking-tight text-stone-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-stone-700" />
                Nhập Dữ Liệu Sao Lưu
              </h3>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
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

            <div className="pt-4 border-t border-stone-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTriggerFilePicker}
                className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400 px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 w-full shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn Tệp Sao Lưu (.json)</span>
              </button>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider text-center">
                TỰ ĐỘNG KIỂM TRA CÚ PHÁP VÀ SCHEMA TRƯỚC KHI KHÔI PHỤC
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: DANGER ZONE ==================== */}
      <section
        aria-labelledby="danger-zone-heading"
        className="border border-rose-200 bg-rose-50/40 p-6 sm:p-8 shadow-sm"
      >
        <div className="pb-5 border-b border-rose-200/80 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="border border-rose-300 bg-rose-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-rose-700">
                CRITICAL OPERATION
              </span>
              <span className="border border-rose-300 bg-rose-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-rose-700">
                IRREVERSIBLE
              </span>
            </div>
            <h2
              id="danger-zone-heading"
              className="font-serif text-2xl font-light uppercase tracking-tight text-rose-900 flex items-center gap-2"
            >
              <ShieldAlert className="w-6 h-6 text-rose-700" />
              Vùng Nguy Hiểm (Danger Zone)
            </h2>
            <p className="font-sans text-sm text-rose-700 mt-1">
              Các thao tác nhạy cảm có thể ảnh hưởng vĩnh viễn tới dữ liệu học tập của bạn.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-serif text-base sm:text-lg font-medium uppercase tracking-tight text-stone-900">
              Xóa Toàn Bộ Dữ Liệu Học Tập (Reset Everything)
            </h3>
            <p className="font-sans text-sm text-stone-600 leading-relaxed">
              Xóa sạch tất cả thẻ Flashcard SRS, chuỗi ngày streak ({streak} ngày), điểm kinh nghiệm ({totalXp} XP), tiến độ Hán tự và từ vựng về trạng thái ban đầu. Thao tác này không thể hoàn tác.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setResetConfirmInput('');
              setIsResetModalOpen(true);
            }}
            className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors duration-100 shrink-0 inline-flex items-center justify-center gap-2 shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa Toàn Bộ Dữ Liệu</span>
          </button>
        </div>
      </section>

      {/* ==================== SECTION 4: ABOUT & TIPS ==================== */}
      <section
        aria-labelledby="about-app-heading"
        className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm space-y-6"
      >
        <div className="pb-4 border-b border-stone-200 flex items-center gap-2.5">
          <Info className="w-5 h-5 text-stone-700" />
          <h2 id="about-app-heading" className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900">
            Kiến Trúc Offline-First & Hướng Dẫn Lưu Trữ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-stone-200 p-5 bg-stone-50/50 space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-medium block">
              01 · OFFLINE-FIRST ARCHITECTURE
            </span>
            <h3 className="font-serif text-base font-medium text-stone-900 uppercase">
              Không Cần Máy Chủ Lưu Trữ Riêng
            </h3>
            <p className="font-sans text-xs text-stone-500 leading-relaxed">
              Nihongo Master hoạt động 100% trên trình duyệt của bạn với công nghệ Static Web và LocalStorage. Ứng dụng không thu thập thông tin cá nhân và hoàn toàn có thể sử dụng khi không có mạng Internet.
            </p>
          </div>

          <div className="border border-stone-200 p-5 bg-stone-50/50 space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500 font-medium block">
              02 · DATA PRESERVATION POLICY
            </span>
            <h3 className="font-serif text-base font-medium text-stone-900 uppercase">
              Mẹo Bảo Vệ Chuỗi Học Tập
            </h3>
            <p className="font-sans text-xs text-stone-500 leading-relaxed">
              Do dữ liệu nằm tại trình duyệt thiết bị, việc dọn dẹp cache hoặc đổi trình duyệt có thể làm mất dữ liệu. Hãy bấm <strong>Xuất File Sao Lưu (JSON)</strong> định kỳ để lưu trữ an toàn trên Google Drive hoặc máy tính cá nhân.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 font-mono text-xs uppercase tracking-wider text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NIHONGO MASTER · PHIÊN BẢN V1.0.0 (MUTED JAPANESE ARCHIVE)</span>
          <span>THUẬT TOÁN SM-2 SPACED REPETITION · HỖ TRỢ JLPT N5 ~ N1</span>
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
          <div className="flex items-center gap-2 text-stone-900">
            <FileJson className="w-5 h-5 text-stone-700" />
            <span className="font-serif font-medium uppercase tracking-tight">Xác Nhận Khôi Phục Dữ Liệu</span>
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
              className="border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 hover:border-stone-400 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Khôi Phục</span>
            </button>
          </>
        }
      >
        {pendingBackup && (
          <div className="space-y-4">
            {/* Backup Timestamp Info */}
            <div className="border border-stone-200 p-3.5 bg-stone-50 flex items-center justify-between font-mono text-xs text-stone-800">
              <span className="uppercase tracking-wider text-stone-500">
                THỜI GIAN XUẤT SAO LƯU:
              </span>
              <span className="font-bold">
                {pendingBackup.exportedAt
                  ? new Date(pendingBackup.exportedAt).toLocaleString('vi-VN')
                  : 'Không rõ'}
              </span>
            </div>

            {/* Backup Statistics Table Grid */}
            <div className="border border-stone-200 divide-x divide-y divide-stone-200 grid grid-cols-2 sm:grid-cols-3 bg-white">
              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Số Thẻ SRS
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {pendingBackup.cards
                    ? Array.isArray(pendingBackup.cards)
                    ? pendingBackup.cards.length
                    : Object.keys(pendingBackup.cards).length
                    : 0}
                </span>
              </div>

              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Chuỗi Streak
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {pendingBackup.stats?.streak ?? 0} ngày
                </span>
              </div>

              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Tổng Điểm XP
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {pendingBackup.stats?.totalXp ?? pendingBackup.stats?.totalXP ?? 0} XP
                </span>
              </div>

              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Lượt Ôn Tập
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {pendingBackup.stats?.totalReviews ?? 0} lượt
                </span>
              </div>

              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Hán Tự (Kanji)
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {Object.keys(pendingBackup.kanjiProgress || {}).length} chữ
                </span>
              </div>

              <div className="p-3 text-center">
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block">
                  Từ Vựng (Tango)
                </span>
                <span className="font-serif text-2xl font-light text-stone-900 mt-0.5 block">
                  {Object.keys(
                    pendingBackup.vocabProgress || pendingBackup.vocabStatus || {}
                  ).length}{' '}
                  từ
                </span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="border border-amber-200 bg-amber-50/60 p-3.5 font-mono text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>LƯU Ý:</strong> Dữ liệu hiện có trên trình duyệt này sẽ được cập nhật đồng bộ với bản sao lưu. Các thẻ SRS và tiến độ trong tệp sao lưu sẽ được áp dụng vào hệ thống.
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
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="font-serif font-medium uppercase tracking-tight">Xác Nhận Xóa Toàn Bộ Dữ Liệu</span>
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
              className="border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 hover:border-stone-400 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              disabled={
                resetConfirmInput.trim().toUpperCase() !== 'XÓA' &&
                resetConfirmInput.trim().toUpperCase() !== 'RESET'
              }
              onClick={handleConfirmReset}
              className="border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa Vĩnh Viễn Dữ Liệu</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="border border-rose-200 bg-rose-50/70 p-4 font-mono text-xs text-rose-900 leading-relaxed space-y-2">
            <p className="font-bold">CẢNH BÁO: BẠN CHUẨN BỊ XÓA TOÀN BỘ:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>{cardCount} thẻ Spaced Repetition (SRS)</li>
              <li>Chuỗi streak {streak} ngày và {totalXp} XP</li>
              <li>Toàn bộ {kanjiCount} Hán tự và {vocabCount} từ vựng đã học</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reset-confirm-input"
              className="font-mono text-xs font-medium text-stone-800 uppercase tracking-wider block"
            >
              Để xác nhận, vui lòng nhập <code className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-bold font-mono text-stone-800">XÓA</code> hoặc <code className="border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-bold font-mono text-stone-800">RESET</code> vào ô bên dưới:
            </label>
            <input
              id="reset-confirm-input"
              type="text"
              value={resetConfirmInput}
              onChange={(e) => setResetConfirmInput(e.target.value)}
              placeholder='NHẬP "XÓA" HOẶC "RESET"'
              className="border border-stone-300 p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 w-full text-stone-900 bg-white"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
