'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import { exportBackupData, validateAndParseBackup } from '@/lib/storage';
import Modal from '@/components/ui/Modal';
import {
  ArrowRight,
  Download,
  Upload,
  Settings,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* 1. Editorial Hero Section */}
      <section>
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground border border-black px-2 py-0.5">
            [ ARCHIVE EDITION 2026 ]
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            SM-2 SPACED REPETITION ENGINE
          </span>
        </div>

        <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tighter text-black leading-none uppercase">
          NIHONGO ARCHIVE
          <span className="block font-serif text-5xl sm:text-7xl lg:text-8xl mt-2 tracking-normal">
            日本語マスター
          </span>
        </h1>

        <p className="font-mono text-xs sm:text-sm tracking-widest text-mutedForeground uppercase mt-4 max-w-xl">
          [ REPOSITORY OF JAPANESE VOCABULARY & KANJI · SPACED REPETITION SYSTEM · JLPT N5–N1 ]
        </p>

        {/* Heavy 4px black section rule */}
        <div className="h-1 bg-black w-full my-10 sm:my-14" />
      </section>

      {/* 2. High-Impact Statistics Grid */}
      <section aria-label="Thống kê học tập">
        <div className="border-t-2 border-b-2 border-black divide-y sm:divide-y-0 sm:divide-x divide-black py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Reviews Due */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-mutedForeground">
              [ REVIEWS DUE ]
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-black tracking-tight leading-none">
                {dueCount}
              </div>
            </div>
            <div className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              {dueCount > 0 ? `${vocabDueCount} vocab · ${kanjiDueCount} kanji` : 'All reviews done'}
            </div>
          </div>

          {/* Card 2: Day Streak */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-mutedForeground">
              [ DAY STREAK ]
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-black tracking-tight leading-none">
                {streak}
              </div>
            </div>
            <div className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              {streak > 0 ? 'Consecutive days active' : 'Start streak today'}
            </div>
          </div>

          {/* Card 3: Total XP */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-mutedForeground">
              [ XP ACCUMULATED ]
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-black tracking-tight leading-none">
                {totalXp}
              </div>
            </div>
            <div className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              Level {currentLevel} · {xpInCurrentLevel}/100 XP
            </div>
          </div>

          {/* Card 4: Cards in SRS */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-mutedForeground">
              [ CARDS IN SRS ]
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-black tracking-tight leading-none">
                {totalCards}
              </div>
            </div>
            <div className="font-mono text-[11px] text-mutedForeground uppercase tracking-wider">
              {reviewCount} reviewed · {learningCount} learning
            </div>
          </div>
        </div>
      </section>

      {/* 3. Primary Action Callout */}
      {dueCount > 0 ? (
        <section className="border-2 border-black bg-black text-white p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-none shadow-none">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              [ ACTION REQUIRED · SM-2 INTERVAL ]
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight uppercase">
              HÔM NAY CÓ {dueCount} THẺ CẦN ÔN TẬP
            </h2>
            <p className="font-body text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
              Ôn tập đúng thời điểm giúp củng cố vùng nhớ dài hạn và tăng hiệu quả ghi nhớ Hán tự và Từ vựng theo thuật toán SM-2.
            </p>
            <div className="font-mono text-xs text-neutral-400 pt-1">
              Từ vựng: {vocabDueCount} · Hán tự: {kanjiDueCount} {newCount > 0 ? `· Thẻ mới: ${newCount}` : ''}
            </div>
          </div>
          <Link
            href="/review"
            className="border border-white bg-white text-black hover:bg-black hover:text-white px-8 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-3 shrink-0 rounded-none shadow-none"
          >
            <span>BẮT ĐẦU ÔN TẬP NGAY</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      ) : (
        <section className="border-2 border-black bg-white text-black p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-none shadow-none">
          <div className="space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              [ STATUS · COMPLETED ]
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight uppercase">
              ĐÃ HOÀN THÀNH TẤT CẢ ÔN TẬP HÔM NAY
            </h2>
            <p className="font-body text-sm sm:text-base text-mutedForeground max-w-2xl leading-relaxed">
              Hiện không có thẻ nào đến hạn ôn tập. Hãy khám phá kho kiến thức để bổ sung thẻ mới hoặc thử thách bản thân trong phòng Quizlet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/tango"
              className="border border-black bg-white text-black hover:bg-black hover:text-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 rounded-none shadow-none"
            >
              <span>TỪ VỰNG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/kanji"
              className="border border-black bg-white text-black hover:bg-black hover:text-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 rounded-none shadow-none"
            >
              <span>KANJI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/review/quiz"
              className="border border-black bg-black text-white hover:bg-white hover:text-black px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 rounded-none shadow-none"
            >
              <span>QUIZLET</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 4. 4 High-Contrast Quick Navigation Cards */}
      <section aria-label="Danh mục điều hướng">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase text-black">
            DANH MỤC TRỌNG TÂM
          </h2>
          <span className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
            [ 04 SECTIONS ]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Kanji */}
          <Link
            href="/kanji"
            className="border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group rounded-none shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-black group-hover:border-white pb-3 mb-6 transition-colors duration-100">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  01 / KANJI
                </span>
                <span className="font-serif text-3xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                  字
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3">
                KHO HÁN TỰ
              </h3>
              <p className="font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 transition-colors duration-100 mb-6 leading-relaxed">
                2,136 Hán tự thông dụng từ N5 đến N1 kèm phân tích bộ thủ, âm Hán Việt và thứ tự từng nét chuẩn mực.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['N5', 'N4', 'N3', 'N2', 'N1'].map((lvl) => (
                  <span
                    key={lvl}
                    className="font-mono text-[10px] uppercase px-2 py-0.5 border border-black group-hover:border-white transition-colors duration-100"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform duration-100 pt-4 border-t border-neutral-200 group-hover:border-neutral-800">
              <span>KHÁM PHÁ KANJI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Tango */}
          <Link
            href="/tango"
            className="border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group rounded-none shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-black group-hover:border-white pb-3 mb-6 transition-colors duration-100">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  02 / TANGO
                </span>
                <span className="font-serif text-3xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                  語
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3">
                KHO TỪ VỰNG
              </h3>
              <p className="font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 transition-colors duration-100 mb-6 leading-relaxed">
                Hệ thống giáo trình Minna no Nihongo, Mimikara Oboeru và Somatome với phát âm audio bản xứ và bài tập ngữ cảnh.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['MINNA', 'MIMIKARA', 'SOMATOME'].map((b) => (
                  <span
                    key={b}
                    className="font-mono text-[10px] uppercase px-2 py-0.5 border border-black group-hover:border-white transition-colors duration-100"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform duration-100 pt-4 border-t border-neutral-200 group-hover:border-neutral-800">
              <span>HỌC TỪ VỰNG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: SRS Review */}
          <Link
            href="/review"
            className="border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group rounded-none shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-black group-hover:border-white pb-3 mb-6 transition-colors duration-100">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  03 / SRS REVIEW
                </span>
                <span className="font-serif text-3xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                  記
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3">
                TRUNG TÂM ÔN TẬP
              </h3>
              <p className="font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 transition-colors duration-100 mb-6 leading-relaxed">
                Thuật toán SuperMemo SM-2 tự động tính toán thời điểm lặp lại tối ưu để củng cố vùng nhớ dài hạn.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['SM-2', 'FLASHCARDS', `${dueCount} DUE`].map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase px-2 py-0.5 border border-black group-hover:border-white transition-colors duration-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform duration-100 pt-4 border-t border-neutral-200 group-hover:border-neutral-800">
              <span>VÀO PHÒNG ÔN TẬP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Quizlet */}
          <Link
            href="/review/quiz"
            className="border-2 border-black bg-white p-6 sm:p-8 hover:bg-black hover:text-white transition-colors duration-100 group rounded-none shadow-none flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-black group-hover:border-white pb-3 mb-6 transition-colors duration-100">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  04 / QUIZLET
                </span>
                <span className="font-serif text-3xl font-bold opacity-30 group-hover:opacity-100 transition-opacity">
                  問
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3">
                LUYỆN TẬP & QUIZ
              </h3>
              <p className="font-body text-xs sm:text-sm text-mutedForeground group-hover:text-neutral-300 transition-colors duration-100 mb-6 leading-relaxed">
                Đấu trí qua câu hỏi trắc nghiệm 4 đáp án, ghép thẻ tốc độ cao và thử thách lắp ghép ký tự Hán tự.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['TRẮC NGHIỆM', 'GHÉP THẺ', 'GHÉP CHỮ'].map((mode) => (
                  <span
                    key={mode}
                    className="font-mono text-[10px] uppercase px-2 py-0.5 border border-black group-hover:border-white transition-colors duration-100"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold group-hover:translate-x-1 transition-transform duration-100 pt-4 border-t border-neutral-200 group-hover:border-neutral-800">
              <span>BẮT ĐẦU QUIZ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Editorial Data Management & Utility Footer */}
      <section aria-label="Quản lý dữ liệu" className="border-t-2 border-black pt-8 sm:pt-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-mutedForeground">
              [ SYSTEM UTILITIES · DATA PRESERVATION ]
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-tight uppercase mt-1 text-black">
              QUẢN LÝ DỮ LIỆU & TIẾN TRÌNH
            </h3>
            <p className="font-body text-xs sm:text-sm text-mutedForeground mt-1 max-w-xl">
              Xuất hoặc nhập bản ghi tiến độ học tập dạng tệp JSON để bảo lưu hoặc đồng bộ trên thiết bị cá nhân.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-black bg-white text-black hover:bg-black hover:text-white font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>XUẤT JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-black bg-white text-black hover:bg-black hover:text-white font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>NHẬP SAO LƯU</span>
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-black bg-black text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>CÀI ĐẶT HỆ THỐNG</span>
            </Link>
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
              className="border border-black bg-white text-black hover:bg-black hover:text-white px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            >
              HỦY
            </button>
            <button
              type="button"
              onClick={handleImportJson}
              className="border border-black bg-black text-white hover:bg-white hover:text-black px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100 rounded-none shadow-none"
            >
              ÁP DỤNG KHÔI PHỤC
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-black mb-2 font-bold">
              [ 01 ] TẢI TỆP JSON TỪ THIẾT BỊ:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-black font-mono file:mr-4 file:py-2.5 file:px-4 file:rounded-none file:border-2 file:border-black file:text-xs file:font-mono file:uppercase file:tracking-wider file:bg-black file:text-white hover:file:bg-white hover:file:text-black file:transition-colors file:duration-100 cursor-pointer border border-black p-1"
            />
          </div>

          <div>
            <label
              htmlFor={importJsonTextareaId}
              className="block font-mono text-xs uppercase tracking-wider text-black mb-2 font-bold"
            >
              [ 02 ] HOẶC DÁN NỘI DUNG JSON:
            </label>
            <textarea
              id={importJsonTextareaId}
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"cards": {...}, "stats": {...}}'
              className="w-full p-3 font-mono text-xs rounded-none border-2 border-black bg-white text-black focus:outline-none focus:ring-0 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
