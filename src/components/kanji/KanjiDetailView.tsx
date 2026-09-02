'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  KanjiItem,
  RadicalRef,
  RadicalDetail,
  KanjiCompound,
  parseKanjiMeaning,
} from '@/lib/kanjiData';
import { useKanjiStore, KanjiStatus } from '@/stores/kanjiStore';
import { useSRSStore } from '@/stores/srsStore';
import { toast } from '@/stores/toastStore';
import { speakJapanese } from '@/lib/tts';
import StrokeOrderWriter from './StrokeOrderWriter';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Volume2,
  BookmarkCheck,
  Sparkles,
  Plus,
  Check,
  Layers,
  Lightbulb,
  BookOpen,
  Info,
  Hash,
} from 'lucide-react';

export interface KanjiDetailViewProps {
  kanji: KanjiItem;
  adjacent: { prev: KanjiItem | null; next: KanjiItem | null };
  radicalsWithDetails: Array<{ ref: RadicalRef; detail?: RadicalDetail }>;
  compounds: KanjiCompound[];
}

export const KanjiDetailView: React.FC<KanjiDetailViewProps> = ({
  kanji,
  adjacent,
  radicalsWithDetails,
  compounds,
}) => {
  const { kanjiStatus, setStatus } = useKanjiStore();
  const { cards, addCard, removeCard } = useSRSStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const cardId = `kanji_${kanji.character}`;
  const isSrsAdded = mounted ? Boolean(cards[cardId]) : false;
  const rawStatus = mounted ? kanjiStatus[kanji.character] : 'new';

  let currentStatus: KanjiStatus = 'new';
  if (rawStatus === 'known') {
    currentStatus = 'known';
  } else if (isSrsAdded || rawStatus === 'learning') {
    currentStatus = 'learning';
  }

  const { sinoVietnamese, meaning } = parseKanjiMeaning(
    kanji.meaning_vi,
    kanji.character
  );

  const handleToggleSRS = () => {
    if (isSrsAdded || currentStatus === 'learning') {
      removeCard(cardId);
      setStatus(kanji.character, 'new');
      toast.info(`Đã bỏ ${kanji.character} khỏi danh sách SRS`);
    } else {
      addCard({
        id: cardId,
        cardType: 'kanji',
        contentId: kanji.character,
        level: kanji.level,
      });
      setStatus(kanji.character, 'learning');
      toast.success(`Đã thêm ${kanji.character} (${sinoVietnamese}) vào SRS`);
    }
  };

  const handleToggleKnown = () => {
    if (currentStatus === 'known') {
      setStatus(kanji.character, 'new');
      toast.info(`Đã hủy đánh dấu đã thuộc ${kanji.character}`);
    } else {
      setStatus(kanji.character, 'known');
      toast.success(`Đã đánh dấu đã thuộc ${kanji.character} (${sinoVietnamese})!`);
    }
  };

  const handleSpeak = (text: string) => {
    speakJapanese(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link
          href="/kanji"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách Kanji {kanji.level}</span>
        </Link>

        {/* Prev / Next Kanji buttons */}
        <div className="flex items-center gap-2">
          {adjacent.prev ? (
            <Link
              href={`/kanji/${encodeURIComponent(adjacent.prev.character)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all"
              title={`Trước: ${adjacent.prev.character}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{adjacent.prev.character}</span>
            </Link>
          ) : (
            <span className="opacity-30 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </span>
          )}

          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            {kanji.level}
          </span>

          {adjacent.next ? (
            <Link
              href={`/kanji/${encodeURIComponent(adjacent.next.character)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all"
              title={`Sau: ${adjacent.next.character}`}
            >
              <span>{adjacent.next.character}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="opacity-30 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 cursor-not-allowed">
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left column (Stroke writer & actions) + Right column (Info, Radicals, Compounds) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stroke Order Writer Card */}
          <StrokeOrderWriter
            character={kanji.character}
            size={280}
            className="w-full"
          />

          {/* Quick Actions Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Trạng thái & Ôn tập
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* SRS Add / Remove Button */}
              <button
                type="button"
                onClick={handleToggleSRS}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
                  isSrsAdded || currentStatus === 'learning'
                    ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-md shadow-amber-500/20'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                {isSrsAdded || currentStatus === 'learning' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Đang học SRS</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Thêm vào SRS</span>
                  </>
                )}
              </button>

              {/* Mastered / Known Button */}
              <button
                type="button"
                onClick={handleToggleKnown}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm border transition-all active:scale-95 ${
                  currentStatus === 'known'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{currentStatus === 'known' ? 'Đã thuộc' : 'Đánh dấu thuộc'}</span>
              </button>
            </div>
          </div>

          {/* Mnemonic Card (Gợi ý ghi nhớ) */}
          {kanji.mnemonic_vi && (
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Mẹo nhớ chữ Hán</span>
              </div>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                {kanji.mnemonic_vi}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Title & Sino-Vietnamese Banner */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-6xl sm:text-7xl font-bold text-slate-900 dark:text-white leading-none">
                    {kanji.character}
                  </h1>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                      {sinoVietnamese}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 mt-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                      JLPT {kanji.level}
                    </span>
                  </div>
                </div>

                {/* Detailed Meaning */}
                <p className="mt-3 text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium">
                  {meaning || kanji.meaning_vi}
                </p>
              </div>

              {/* Pronounce main kanji */}
              <button
                type="button"
                onClick={() => handleSpeak(kanji.character)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-600 hover:text-white transition-all text-xs font-semibold active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>Phát âm</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <Hash className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Số nét</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {kanji.stroke_count} nét
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <Layers className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Bộ thủ chính</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {kanji.radicals?.[0]?.character || '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 col-span-2 sm:col-span-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Cấp độ</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    JLPT {kanji.level}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onyomi & Kunyomi Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Onyomi Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Âm On (Onyomi)
                </h3>
                <span className="text-[10px] text-slate-400">Âm Hán Nhật</span>
              </div>

              {kanji.onyomi && kanji.onyomi.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {kanji.onyomi.map((on, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpeak(on)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-600 hover:text-white transition-all text-sm font-bold active:scale-95 group"
                    >
                      <span>{on}</span>
                      <Volume2 className="w-3 h-3 text-indigo-400 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Không có âm On</p>
              )}
            </div>

            {/* Kunyomi Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Âm Kun (Kunyomi)
                </h3>
                <span className="text-[10px] text-slate-400">Âm Thuần Nhật</span>
              </div>

              {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {kanji.kunyomi.map((kun, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpeak(kun.replace(/[-.]/g, ''))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 hover:bg-rose-600 hover:text-white transition-all text-sm font-bold active:scale-95 group"
                    >
                      <span>{kun}</span>
                      <Volume2 className="w-3 h-3 text-rose-400 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Không có âm Kun</p>
              )}
            </div>
          </div>

          {/* Radicals (Bộ thủ cấu thành) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bộ thủ cấu thành (Radicals)
              </h3>
            </div>

            {radicalsWithDetails.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {radicalsWithDetails.map(({ ref, detail }, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center font-serif text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {ref.character}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {detail?.meaning_vi || detail?.meaning_en || 'Bộ thủ'}
                        </span>
                        {ref.is_main && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                            Bộ chính
                          </span>
                        )}
                      </div>
                      {detail?.reading_ja && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tên bộ: <span className="font-medium">{detail.reading_ja}</span>
                        </div>
                      )}
                      {detail?.stroke_count && (
                        <div className="text-[11px] text-slate-400">
                          {detail.stroke_count} nét
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Chưa có dữ liệu phân tách bộ thủ cho chữ này.
              </p>
            )}
          </div>

          {/* Compounds (Từ ghép thông dụng) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Từ vựng ghép thông dụng (Compounds)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {compounds.length} từ
              </span>
            </div>

            {compounds.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {compounds.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {comp.word}
                        </span>
                        {comp.reading && (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            【{comp.reading}】
                          </span>
                        )}
                        {comp.hanviet && (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">
                            ({comp.hanviet})
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1 font-medium">
                        {comp.meaning}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {comp.source && (
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          {comp.source}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSpeak(comp.word)}
                        title={`Nghe phát âm: ${comp.word}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <Info className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                <span>Chưa có từ ghép mẫu trong kho từ vựng hiện tại.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiDetailView;
