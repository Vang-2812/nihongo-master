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
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-stone-700 bg-stone-100 border border-stone-300 px-2 py-0.5">
            ARCHIVE EDITION 2026
          </span>
          <span className="font-sans text-xs uppercase tracking-wider text-stone-500">
            SM-2 Spaced Repetition Engine
          </span>
        </div>

        <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tighter text-stone-900 leading-none uppercase">
          NIHONGO ARCHIVE
          <span className="block font-serif text-5xl sm:text-7xl lg:text-8xl mt-2 tracking-normal">
            日本語マスター
          </span>
        </h1>

        <p className="font-sans text-xs sm:text-sm tracking-widest text-stone-500 uppercase mt-4 max-w-xl font-medium">
          REPOSITORY OF JAPANESE VOCABULARY & KANJI · SPACED REPETITION SYSTEM · JLPT N5–N1
        </p>

        {/* Section rule */}
        <div className="h-px bg-stone-300 w-full my-10 sm:my-14" />
      </section>

      {/* 2. High-Impact Statistics Grid */}
      <section aria-label="Thống kê học tập">
        <div className="border-t border-b border-stone-200 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Reviews Due */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
              CẦN ÔN TẬP
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-stone-900 tracking-tight leading-none">
                {dueCount}
              </div>
            </div>
            <div className="font-sans text-xs text-stone-500">
              {dueCount > 0 ? `${vocabDueCount} từ vựng · ${kanjiDueCount} Hán tự` : 'Đã hoàn thành hôm nay'}
            </div>
          </div>

          {/* Card 2: Day Streak */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
              CHUỖI NGÀY LIÊN TIẾP
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-amber-700 tracking-tight leading-none">
                {streak}
              </div>
            </div>
            <div className="font-sans text-xs text-stone-500">
              {streak > 0 ? 'Duy trì học đều đặn' : 'Bắt đầu chuỗi hôm nay'}
            </div>
          </div>

          {/* Card 3: Total XP */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
              ĐIỂM TÍCH LŨY
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-amber-700 tracking-tight leading-none">
                {totalXp}
              </div>
            </div>
            <div className="font-sans text-xs text-stone-500">
              Cấp độ {currentLevel} · {xpInCurrentLevel}/100 XP
            </div>
          </div>

          {/* Card 4: Cards in SRS */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
              TỔNG THẺ TRONG SRS
            </div>
            <div className="my-4">
              <div className="font-serif text-5xl sm:text-7xl font-light text-indigo-800 tracking-tight leading-none">
                {totalCards}
              </div>
            </div>
            <div className="font-sans text-xs text-stone-500">
              {reviewCount} đã ôn · {learningCount} đang học
            </div>
          </div>
        </div>
      </section>

      {/* 3. Primary Action Callout */}
      {dueCount > 0 ? (
        <section className="border border-indigo-200 bg-indigo-50/70 text-stone-900 p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="font-sans text-xs font-semibold uppercase tracking-widest text-indigo-800">
              CẦN XỬ LÝ · CHU KỲ SM-2
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight uppercase text-stone-900">
              HÔM NAY CÓ {dueCount} THẺ CẦN ÔN TẬP
            </h2>
            <p className="font-sans text-sm sm:text-base text-stone-700 max-w-2xl leading-relaxed">
              Ôn tập đúng thời điểm giúp củng cố vùng nhớ dài hạn và tăng hiệu quả ghi nhớ Hán tự và Từ vựng theo thuật toán SM-2.
            </p>
            <div className="font-sans text-xs text-indigo-800 pt-1">
              Từ vựng: {vocabDueCount} · Hán tự: {kanjiDueCount} {newCount > 0 ? `· Thẻ mới: ${newCount}` : ''}
            </div>
          </div>
          <Link
            href="/review"
            className="bg-indigo-900 hover:bg-indigo-800 text-white border border-indigo-900 px-8 py-3.5 font-sans font-semibold text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-3 shrink-0"
          >
            <span>BẮT ĐẦU ÔN TẬP NGAY</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      ) : (
        <section className="border border-stone-200 bg-white text-stone-900 p-6 sm:p-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="font-sans text-xs uppercase tracking-widest text-stone-500 font-semibold">
              TRẠNG THÁI · ĐÃ HOÀN THÀNH
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight uppercase text-stone-900">
              ĐÃ HOÀN THÀNH TẤT CẢ ÔN TẬP HÔM NAY
            </h2>
            <p className="font-sans text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              Hiện không có thẻ nào đến hạn ôn tập. Hãy khám phá kho kiến thức để bổ sung thẻ mới hoặc thử thách bản thân trong phòng Quizlet.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/tango"
              className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 px-6 py-3 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center justify-center gap-2"
            >
              <span>TỪ VỰNG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/kanji"
              className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 px-6 py-3 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center justify-center gap-2"
            >
              <span>KANJI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/review/quiz"
              className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-6 py-3 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center justify-center gap-2"
            >
              <span>QUIZLET</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 4. Quick Navigation Cards */}
      <section aria-label="Danh mục điều hướng">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase text-stone-900">
            DANH MỤC TRỌNG TÂM
          </h2>
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-500">
            4 PHÂN HỆ CHÍNH
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Kanji */}
          <Link
            href="/kanji"
            className="border border-stone-200 bg-white p-6 sm:p-8 hover:border-stone-400 hover:bg-stone-50/80 transition-all duration-150 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-stone-900">
                  01 / KANJI
                </span>
                <span className="font-serif text-3xl font-bold text-stone-300 group-hover:text-stone-500 transition-colors">
                  字
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3 text-stone-900">
                KHO HÁN TỰ
              </h3>
              <p className="font-body text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
                2,136 Hán tự thông dụng từ N5 đến N1 kèm phân tích bộ thủ, âm Hán Việt và thứ tự từng nét chuẩn mực.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] uppercase px-2 py-0.5">
                  N5
                </span>
                <span className="bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[10px] uppercase px-2 py-0.5">
                  N4
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] uppercase px-2 py-0.5">
                  N3
                </span>
                <span className="bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] uppercase px-2 py-0.5">
                  N2
                </span>
                <span className="bg-rose-50 text-rose-800 border border-rose-200 font-mono text-[10px] uppercase px-2 py-0.5">
                  N1
                </span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-stone-800 group-hover:text-stone-900 pt-4 border-t border-stone-100 group-hover:translate-x-1 transition-all">
              <span>KHÁM PHÁ KANJI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Tango */}
          <Link
            href="/tango"
            className="border border-stone-200 bg-white p-6 sm:p-8 hover:border-stone-400 hover:bg-stone-50/80 transition-all duration-150 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-stone-900">
                  02 / TANGO
                </span>
                <span className="font-serif text-3xl font-bold text-stone-300 group-hover:text-stone-500 transition-colors">
                  語
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3 text-stone-900">
                KHO TỪ VỰNG
              </h3>
              <p className="font-body text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
                Hệ thống giáo trình Minna no Nihongo, Mimikara Oboeru và Somatome với phát âm audio bản xứ và bài tập ngữ cảnh.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['MINNA', 'MIMIKARA', 'SOMATOME'].map((b) => (
                  <span
                    key={b}
                    className="bg-stone-100 text-stone-700 border border-stone-200 font-mono text-[10px] uppercase px-2 py-0.5"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-stone-800 group-hover:text-stone-900 pt-4 border-t border-stone-100 group-hover:translate-x-1 transition-all">
              <span>HỌC TỪ VỰNG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: SRS Review */}
          <Link
            href="/review"
            className="border border-stone-200 bg-white p-6 sm:p-8 hover:border-stone-400 hover:bg-stone-50/80 transition-all duration-150 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-stone-900">
                  03 / SRS REVIEW
                </span>
                <span className="font-serif text-3xl font-bold text-stone-300 group-hover:text-stone-500 transition-colors">
                  記
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3 text-stone-900">
                TRUNG TÂM ÔN TẬP
              </h3>
              <p className="font-body text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
                Thuật toán SuperMemo SM-2 tự động tính toán thời điểm lặp lại tối ưu để củng cố vùng nhớ dài hạn.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['SM-2', 'FLASHCARDS', `${dueCount} DUE`].map((tag) => (
                  <span
                    key={tag}
                    className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono text-[10px] uppercase px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-stone-800 group-hover:text-stone-900 pt-4 border-t border-stone-100 group-hover:translate-x-1 transition-all">
              <span>VÀO PHÒNG ÔN TẬP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Quizlet */}
          <Link
            href="/review/quiz"
            className="border border-stone-200 bg-white p-6 sm:p-8 hover:border-stone-400 hover:bg-stone-50/80 transition-all duration-150 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-stone-900">
                  04 / QUIZLET
                </span>
                <span className="font-serif text-3xl font-bold text-stone-300 group-hover:text-stone-500 transition-colors">
                  問
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight uppercase mb-3 text-stone-900">
                LUYỆN TẬP & QUIZ
              </h3>
              <p className="font-body text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
                Đấu trí qua câu hỏi trắc nghiệm 4 đáp án, ghép thẻ tốc độ cao và thử thách lắp ghép ký tự Hán tự.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['TRẮC NGHIỆM', 'GHÉP THẺ', 'GHÉP CHỮ'].map((mode) => (
                  <span
                    key={mode}
                    className="bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] uppercase px-2 py-0.5"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-stone-800 group-hover:text-stone-900 pt-4 border-t border-stone-100 group-hover:translate-x-1 transition-all">
              <span>BẮT ĐẦU QUIZ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Editorial Data Management & Utility Footer */}
      <section aria-label="Quản lý dữ liệu" className="border-t border-stone-200 pt-8 sm:pt-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-sans text-xs uppercase tracking-widest text-stone-500 font-semibold">
              QUẢN TRỊ DỮ LIỆU & TIẾN TRÌNH
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-tight uppercase mt-1 text-stone-900">
              QUẢN LÝ DỮ LIỆU & TIẾN TRÌNH
            </h3>
            <p className="font-sans text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              Xuất hoặc nhập bản ghi tiến độ học tập dạng tệp JSON để bảo lưu hoặc đồng bộ trên thiết bị cá nhân.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>XUẤT JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>NHẬP SAO LƯU</span>
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100"
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
              className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 px-5 py-2 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100"
            >
              HỦY
            </button>
            <button
              type="button"
              onClick={handleImportJson}
              className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-5 py-2 font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-100"
            >
              ÁP DỤNG KHÔI PHỤC
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block font-sans text-xs uppercase tracking-wider text-stone-900 mb-2 font-bold">
              01. TẢI TỆP JSON TỪ THIẾT BỊ:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-stone-800 font-sans file:mr-4 file:py-2.5 file:px-4 file:border file:border-stone-300 file:text-xs file:font-sans file:font-semibold file:uppercase file:tracking-wider file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 file:transition-colors file:duration-100 cursor-pointer border border-stone-300 p-1"
            />
          </div>

          <div>
            <label
              htmlFor={importJsonTextareaId}
              className="block font-sans text-xs uppercase tracking-wider text-stone-900 mb-2 font-bold"
            >
              02. HOẶC DÁN NỘI DUNG JSON:
            </label>
            <textarea
              id={importJsonTextareaId}
              rows={6}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{"cards": {...}, "stats": {...}}'
              className="w-full p-3 font-mono text-xs border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
