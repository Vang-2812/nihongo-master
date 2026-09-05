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
  ChevronLeft,
  ChevronRight,
  Volume2,
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-5">
        <Link
          href="/kanji"
          className="font-sans font-semibold text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:underline text-black"
        >
          <span>← QUAY LẠI KHO HÁN TỰ</span>
        </Link>

        {/* Prev / Next Kanji buttons */}
        <div className="flex items-center gap-2">
          {adjacent.prev ? (
            <Link
              href={`/kanji/${encodeURIComponent(adjacent.prev.character)}`}
              className="border border-black bg-white hover:bg-black hover:text-white px-3 py-1.5 font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 flex items-center gap-1"
              title={`Trước: ${adjacent.prev.character}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{adjacent.prev.character}</span>
            </Link>
          ) : (
            <span className="opacity-30 border border-black px-3 py-1.5 font-sans text-xs uppercase flex items-center gap-1 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>TRƯỚC</span>
            </span>
          )}

          <span className="font-sans font-bold text-xs px-3 py-1.5 border border-black bg-black text-white">
            {kanji.level}
          </span>

          {adjacent.next ? (
            <Link
              href={`/kanji/${encodeURIComponent(adjacent.next.character)}`}
              className="border border-black bg-white hover:bg-black hover:text-white px-3 py-1.5 font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 flex items-center gap-1"
              title={`Sau: ${adjacent.next.character}`}
            >
              <span>{adjacent.next.character}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="opacity-30 border border-black px-3 py-1.5 font-sans text-xs uppercase flex items-center gap-1 cursor-not-allowed">
              <span>SAU</span>
              <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="p-5 border-2 border-black bg-white rounded-none shadow-none space-y-4">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-black">
              TRẠNG THÁI & ÔN TẬP
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* SRS Add / Remove Button */}
              <button
                type="button"
                onClick={handleToggleSRS}
                className={`flex items-center justify-center gap-2 py-3 px-3 border-2 border-black font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 ${
                  isSrsAdded || currentStatus === 'learning'
                    ? 'bg-black text-white hover:bg-white hover:text-black'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
              >
                <span>{isSrsAdded || currentStatus === 'learning' ? 'SRS: ĐANG HỌC' : '+ THÊM VÀO SRS'}</span>
              </button>

              {/* Mastered / Known Button */}
              <button
                type="button"
                onClick={handleToggleKnown}
                className={`flex items-center justify-center gap-2 py-3 px-3 border-2 border-black font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 ${
                  currentStatus === 'known'
                    ? 'bg-black text-white hover:bg-white hover:text-black'
                    : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
              >
                <span>{currentStatus === 'known' ? 'ĐÃ THUỘC' : 'ĐÁNH DẤU THUỘC'}</span>
              </button>
            </div>
          </div>

          {/* Mnemonic Card (Gợi ý ghi nhớ) */}
          {kanji.mnemonic_vi && (
            <div className="p-5 border border-black bg-neutral-50 rounded-none shadow-none space-y-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-black block">
                GỢI Ý GHI NHỚ · MNEMONIC
              </span>
              <p className="font-sans text-sm text-black leading-relaxed">
                {kanji.mnemonic_vi}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Title & Sino-Vietnamese Banner */}
          <div className="p-6 sm:p-8 border-2 border-black bg-white rounded-none shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-7xl sm:text-8xl lg:text-9xl font-normal text-black leading-none select-none">
                    {kanji.character}
                  </span>
                  <div>
                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-black uppercase tracking-tight">
                      {sinoVietnamese}
                    </h1>
                    <span className="font-sans font-semibold text-xs uppercase tracking-wider text-mutedForeground mt-1 block">
                      JLPT {kanji.level}
                    </span>
                  </div>
                </div>

                {/* Detailed Meaning */}
                <p className="mt-4 font-sans text-base sm:text-lg text-neutral-800 font-normal">
                  {meaning || kanji.meaning_vi}
                </p>
              </div>

              {/* Pronounce main kanji */}
              <button
                type="button"
                onClick={() => handleSpeak(kanji.character)}
                className="border border-black bg-white hover:bg-black hover:text-white px-4 py-2 font-sans font-semibold text-xs uppercase tracking-wider rounded-none transition-colors duration-100 inline-flex items-center gap-2 self-start"
              >
                <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>PHÁT ÂM</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="border-t border-b border-black divide-x divide-black grid grid-cols-3 py-3 font-sans text-xs">
              <div className="px-3 text-center">
                <span className="text-mutedForeground block text-[10px] uppercase tracking-wider font-semibold">SỐ NÉT</span>
                <span className="font-bold text-black text-sm mt-0.5 block">{kanji.stroke_count} NÉT</span>
              </div>
              <div className="px-3 text-center">
                <span className="text-mutedForeground block text-[10px] uppercase tracking-wider font-semibold">BỘ THỦ CHÍNH</span>
                <span className="font-bold text-black text-sm mt-0.5 block">{kanji.radicals?.[0]?.character || '—'}</span>
              </div>
              <div className="px-3 text-center">
                <span className="text-mutedForeground block text-[10px] uppercase tracking-wider font-semibold">CẤP ĐỘ</span>
                <span className="font-bold text-black text-sm mt-0.5 block">JLPT {kanji.level}</span>
              </div>
            </div>
          </div>

          {/* Onyomi & Kunyomi Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Onyomi Card */}
            <div className="p-5 border border-black bg-white rounded-none shadow-none space-y-3">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-black">
                  ÂM ON · ONYOMI
                </span>
                <span className="font-sans text-[10px] text-mutedForeground uppercase font-semibold">ÂM HÁN NHẬT</span>
              </div>

              {kanji.onyomi && kanji.onyomi.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {kanji.onyomi.map((on, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpeak(on)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white font-sans text-sm font-bold rounded-none transition-colors duration-100 group"
                    >
                      <span>{on}</span>
                      <Volume2 className="w-3 h-3 stroke-[1.5]" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-xs text-mutedForeground italic">Không có âm On</p>
              )}
            </div>

            {/* Kunyomi Card */}
            <div className="p-5 border border-black bg-white rounded-none shadow-none space-y-3">
              <div className="flex items-center justify-between border-b border-black pb-2">
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-black">
                  ÂM KUN · KUNYOMI
                </span>
                <span className="font-sans text-[10px] text-mutedForeground uppercase font-semibold">ÂM THUẦN NHẬT</span>
              </div>

              {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {kanji.kunyomi.map((kun, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSpeak(kun.replace(/[-.]/g, ''))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white font-sans text-sm font-bold rounded-none transition-colors duration-100 group"
                    >
                      <span>{kun}</span>
                      <Volume2 className="w-3 h-3 stroke-[1.5]" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-xs text-mutedForeground italic">Không có âm Kun</p>
              )}
            </div>
          </div>

          {/* Radicals (Bộ thủ cấu thành) */}
          <div className="p-5 border border-black bg-white rounded-none shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-black">
                BỘ THỦ CẤU THÀNH · RADICALS
              </span>
              <span className="font-sans text-[10px] text-mutedForeground uppercase font-semibold">
                {radicalsWithDetails.length} BỘ
              </span>
            </div>

            {radicalsWithDetails.length > 0 ? (
              <div className="divide-y divide-borderLight border-t border-b border-black">
                {radicalsWithDetails.map(({ ref, detail }, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-3xl font-normal text-black select-none">
                        {ref.character}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs font-bold uppercase text-black">
                            {detail?.meaning_vi || detail?.meaning_en || 'BỘ THỦ'}
                          </span>
                          {ref.is_main && (
                            <span className="border border-black font-sans text-[9px] uppercase px-1 py-0.5 text-black font-semibold">
                              BỘ CHÍNH
                            </span>
                          )}
                        </div>
                        {detail?.reading_ja && (
                          <div className="font-sans text-xs text-mutedForeground mt-0.5">
                            Tên bộ: {detail.reading_ja}
                          </div>
                        )}
                      </div>
                    </div>

                    {detail?.stroke_count && (
                      <span className="font-sans text-xs text-mutedForeground">
                        {detail.stroke_count} nét
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-mutedForeground italic">
                Chưa có dữ liệu phân tách bộ thủ
              </p>
            )}
          </div>

          {/* Compounds (Từ ghép thông dụng) */}
          <div className="p-5 border border-black bg-white rounded-none shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-black">
                TỪ VỰNG GHÉP THÔNG DỤNG · COMPOUNDS
              </span>
              <span className="font-sans text-[10px] text-mutedForeground uppercase font-semibold">
                {compounds.length} TỪ
              </span>
            </div>

            {compounds.length > 0 ? (
              <div className="border-t border-b border-black divide-y divide-borderLight max-h-[440px] overflow-y-auto">
                {compounds.map((comp, idx) => (
                  <div
                    key={idx}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors duration-100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-serif text-lg font-bold text-black">
                          {comp.word}
                        </span>
                        {comp.reading && (
                          <span className="font-sans text-xs text-neutral-600">
                            【{comp.reading}】
                          </span>
                        )}
                        {comp.hanviet && (
                          <span className="font-sans text-xs font-bold text-black uppercase tracking-wider">
                            ({comp.hanviet})
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs sm:text-sm text-neutral-700 mt-1 line-clamp-1">
                        {comp.meaning}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {comp.source && (
                        <span className="hidden sm:inline-block font-sans text-[10px] font-semibold border border-black px-1.5 py-0.5 text-black">
                          {comp.source}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSpeak(comp.word)}
                        title={`Nghe phát âm: ${comp.word}`}
                        className="border border-black p-1.5 bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 rounded-none"
                      >
                        <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 font-sans text-xs text-mutedForeground">
                Chưa có từ ghép mẫu trong kho từ vựng hiện tại
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiDetailView;
