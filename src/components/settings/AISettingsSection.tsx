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
    <section
      aria-labelledby="ai-settings-heading"
      className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm mb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
              AI ENGINE
            </span>
            <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
              OPENAI COMPATIBLE
            </span>
          </div>
          <h2
            id="ai-settings-heading"
            className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-stone-700" />
            Cấu Hình Trí Tuệ Nhân Tạo (AI Assistant)
          </h2>
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500 mt-1">
            Tự động khởi tạo câu hỏi ngữ cảnh & bài tập trắc nghiệm thông minh
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center gap-1.5 self-start sm:self-auto"
          title="Khôi phục mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mặc Định</span>
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {/* Endpoint URL */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs font-medium text-stone-800 uppercase tracking-wider">
            AI Endpoint URL (OpenAI Compatible)
          </label>
          <input
            type="text"
            value={config.endpointUrl}
            onChange={(e) => setConfig({ endpointUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
            className="w-full border border-stone-300 p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white text-stone-900 shadow-xs"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-mono text-xs font-medium text-stone-800 uppercase tracking-wider">
              API Key
            </label>
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
              LƯU CỤC BỘ TRÊN THIẾT BỊ
            </span>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full border border-stone-300 p-3 pr-12 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white text-stone-900 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 border border-stone-300 px-2 py-1 font-mono text-xs text-stone-700 hover:bg-stone-100 hover:border-stone-400 transition-colors duration-100"
              aria-label={showKey ? 'Ẩn API Key' : 'Hiện API Key'}
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="font-sans text-xs text-stone-500 mt-1">
            Khóa bí mật chỉ được lưu trên trình duyệt của bạn (localStorage), tuyệt đối không lưu trữ trên máy chủ.
          </p>
        </div>

        {/* Model Name & Translation Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-stone-200">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-medium text-stone-800 uppercase tracking-wider">
              Tên Mô Hình (Model Name)
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => setConfig({ modelName: e.target.value })}
              placeholder="deepseek-chat"
              className="w-full border border-stone-300 p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white text-stone-900 shadow-xs"
            />
          </div>

          {/* Translation Toggle */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="block font-mono text-xs font-medium text-stone-800 uppercase tracking-wider">
                Bản Dịch Tiếng Việt Trong Bài Tập
              </label>
              <p className="font-sans text-xs text-stone-500">
                {config.showTranslationInQuiz
                  ? 'Mặc định hiển thị nghĩa tiếng Việt hỗ trợ.'
                  : 'Mặc định ẩn bản dịch để tăng độ thử thách.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setConfig({ showTranslationInQuiz: true })}
                className={`border px-3.5 py-1.5 font-mono text-xs font-medium uppercase transition-colors duration-100 ${
                  config.showTranslationInQuiz
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                HIỂN THỊ
              </button>
              <button
                type="button"
                onClick={() => setConfig({ showTranslationInQuiz: false })}
                className={`border px-3.5 py-1.5 font-mono text-xs font-medium uppercase transition-colors duration-100 ${
                  !config.showTranslationInQuiz
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                ẨN DỊCH
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="border border-stone-900 px-6 py-3 font-mono text-xs uppercase tracking-widest bg-stone-900 text-white hover:bg-stone-800 transition-colors duration-100 inline-flex items-center gap-2 disabled:opacity-50 shadow-xs"
          >
            {isTesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Kiểm Tra Kết Nối</span>
              </>
            )}
          </button>

          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Lấy DeepSeek API Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
