'use client';

import React from 'react';
import { ClozeExerciseItem } from '@/types/ai';
import { Globe, Sparkles, RotateCcw, Play, X, Layers } from 'lucide-react';

interface ClozeExerciseSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  globalExercises: ClozeExerciseItem[] | null;
  customExercises: ClozeExerciseItem[] | null;
  selectedWordsCount: number;
  totalWordsCount: number;
  onSelectGlobal: () => void;
  onSelectCustom: () => void;
  onGenerateCustom: () => void;
  isGeneratingAI: boolean;
}

export default function ClozeExerciseSourceModal({
  isOpen,
  onClose,
  lessonTitle,
  globalExercises,
  customExercises,
  selectedWordsCount,
  totalWordsCount,
  onSelectGlobal,
  onSelectCustom,
  onGenerateCustom,
  isGeneratingAI,
}: ClozeExerciseSourceModalProps) {
  if (!isOpen) return null;

  const hasGlobal = Boolean(globalExercises && globalExercises.length > 0);
  const globalCount = globalExercises?.length || 0;

  const hasCustom = Boolean(customExercises && customExercises.length > 0);
  const customCount = customExercises?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-white border border-stone-300 rounded-none shadow-xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-600" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-500">
                CHỌN NGUỒN BÀI TẬP ĐIỀN TỪ
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-normal text-stone-900 tracking-tight mt-0.5">
              {lessonTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-stone-300 text-stone-600 hover:bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold transition-colors duration-100 rounded-none"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* OPTION 1: GLOBAL EXERCISES */}
          <div className="border border-stone-300 bg-stone-50/50 p-4 sm:p-5 flex flex-col justify-between transition-colors hover:border-stone-400">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    Bài tập chuẩn (Global Cloud)
                  </span>
                </div>

                {hasGlobal ? (
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                    SẴN SÀNG · {globalCount} CÂU
                  </span>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 bg-stone-100 text-stone-500 border border-stone-200">
                    CHƯA CÓ
                  </span>
                )}
              </div>

              <p className="font-sans text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                Bộ bài tập điền từ chuẩn hoá theo giáo trình Minna no Nihongo, lưu trữ trên Cloud đồng bộ chung cho tất cả người học. Không cần cấu hình API Key, có thể luyện tập ngay tức thì.
              </p>
            </div>

            <button
              type="button"
              disabled={!hasGlobal}
              onClick={onSelectGlobal}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-100 rounded-none shadow-none active:scale-[0.99]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>LUYỆN TẬP BÀI CHUẨN ({globalCount} CÂU)</span>
            </button>
          </div>

          {/* OPTION 2: CUSTOM AI EXERCISES */}
          <div className="border border-stone-300 bg-white p-4 sm:p-5 flex flex-col justify-between transition-colors hover:border-stone-400">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border border-indigo-300 bg-indigo-50 text-indigo-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    Bài tập AI cá nhân (Custom)
                  </span>
                </div>

                {hasCustom ? (
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200">
                    ĐÃ TẠO · {customCount} CÂU
                  </span>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 bg-stone-100 text-stone-500 border border-stone-200">
                    CHƯA TẠO
                  </span>
                )}
              </div>

              <p className="font-sans text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                {selectedWordsCount > 0 ? (
                  <span>
                    Sinh bài tập ngữ cảnh độc quyền bằng AI cho{' '}
                    <strong className="text-stone-900 font-bold">{selectedWordsCount} từ vựng</strong> đang chọn trong bài.
                  </span>
                ) : (
                  <span>
                    Sinh bài tập ngữ cảnh độc quyền bằng AI cho toàn bộ{' '}
                    <strong className="text-stone-900 font-bold">{totalWordsCount} từ vựng</strong> trong bài. Yêu cầu API Key đã cấu hình trong Cài đặt.
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {hasCustom && (
                <button
                  type="button"
                  onClick={onSelectCustom}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 border border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-100 rounded-none shadow-none active:scale-[0.99]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>LÀM BÀI ĐÃ TẠO ({customCount})</span>
                </button>
              )}

              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={onGenerateCustom}
                className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 border font-mono text-xs uppercase font-bold tracking-wider transition-colors duration-100 rounded-none shadow-none active:scale-[0.99] disabled:opacity-50 ${
                  hasCustom
                    ? 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 sm:w-auto'
                    : 'w-full border-stone-900 bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                {hasCustom ? (
                  <>
                    <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'ĐANG TẠO LẠI...' : 'TẠO BỘ MỚI'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingAI
                        ? 'ĐANG GỌI AI TẠO BÀI...'
                        : selectedWordsCount > 0
                        ? `TẠO BẰNG AI (${selectedWordsCount} TỪ ĐÃ CHỌN)`
                        : 'TẠO BÀI TẬP BẰNG AI'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <span>
            {selectedWordsCount > 0
              ? `* Đang tích chọn ${selectedWordsCount}/${totalWordsCount} từ vựng`
              : '* Có thể tích chọn từ vựng cụ thể ngoài danh sách để tạo bài tập AI riêng'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-700 hover:text-stone-900 underline uppercase tracking-wider"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
}
