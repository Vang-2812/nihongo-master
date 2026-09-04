'use client';

import React, { useState } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { toast } from '@/stores/toastStore';
import { Sparkles, Eye, EyeOff, RotateCcw, Zap, ExternalLink } from 'lucide-react';

export default function AISettingsSection() {
  const { config, setConfig } = useAIStore();
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleResetDefaults = () => {
    setConfig({
      endpointUrl: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat',
    });
    toast.info('Đã khôi phục cài đặt AI mặc định!');
  };

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) {
      toast.error('Vui lòng nhập API Key trước khi kiểm tra!');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch('/api/ai/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          apiKey: config.apiKey,
          model: config.modelName,
          lessonTitle: 'Test Connection',
          level: 'N5',
          words: [{ id: 'test_1', word: 'ねこ', reading: 'ねこ', meaning: 'con mèo' }],
        }),
      });
      const data = await res.json();
      if (data.success && data.exercises?.length > 0) {
        toast.success('Kết nối AI thành công! Sẵn sàng tạo bài tập.');
      } else {
        toast.error(data.error || 'Kiểm tra thất bại. Vui lòng kiểm tra lại URL hoặc Key.');
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Trí tuệ nhân tạo (AI Assistant)
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Mới
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Cấu hình mô hình AI để tự động tạo câu hỏi bài tập ngữ cảnh cho từ vựng
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
          title="Khôi phục mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mặc định</span>
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {/* Endpoint URL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            AI Endpoint URL (OpenAI Compatible)
          </label>
          <input
            type="text"
            value={config.endpointUrl}
            onChange={(e) => setConfig({ endpointUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Khóa bí mật chỉ được lưu trên trình duyệt của bạn (localStorage), không lưu trên server.
          </p>
        </div>

        {/* Model Name & Translation Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Mô Hình (Model)
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => setConfig({ modelName: e.target.value })}
              placeholder="deepseek-chat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
            />
          </div>

          {/* Translation Toggle */}
          <div className="flex flex-col justify-center">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Bản dịch tiếng Việt khi làm bài
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setConfig({ showTranslationInQuiz: !config.showTranslationInQuiz })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.showTranslationInQuiz ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.showTranslationInQuiz ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {config.showTranslationInQuiz ? 'Mặc định hiển thị bản dịch' : 'Mặc định ẩn bản dịch (Thử thách)'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all active:scale-95 shadow-sm shadow-purple-500/20"
          >
            {isTesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kiểm tra kết nối...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Kiểm tra kết nối</span>
              </>
            )}
          </button>

          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-medium"
          >
            Lấy DeepSeek API Key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
