'use client';

import React, { useState, useEffect } from 'react';
import { syncService } from '@/services/syncService';
import { toast } from '@/stores/toastStore';
import {
  Cloud,
  RefreshCw,
  Copy,
  Smartphone,
  Check,
  KeyRound,
  Unlink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function SyncSettingsSection() {
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [inputCode, setInputCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshState = () => {
    setSyncCode(syncService.getSyncCode());
    setLastSyncTime(syncService.getLastSyncTime());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleCopyCode = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      toast.success('Đã sao chép mã đồng bộ!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể tự động sao chép. Vui lòng chọn và sao chép thủ công.');
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await syncService.generateNewCode('Thiết bị chính');
      if (res.success && res.syncCode) {
        refreshState();
        toast.success(`Đã tạo mã đồng bộ: ${res.syncCode}. Dữ liệu đã được tải lên đám mây!`);
      } else {
        toast.error(res.error || 'Lỗi khi tạo mã.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLinkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      toast.error('Vui lòng nhập mã đồng bộ.');
      return;
    }

    setIsLinking(true);
    try {
      const res = await syncService.pull(clean);
      if (res.success) {
        refreshState();
        setInputCode('');
        toast.success(`Đã liên kết thành công với mã ${clean}! Toàn bộ tiến độ học đã được đồng bộ.`);
      } else {
        toast.error(res.error || 'Mã không tồn tại hoặc lỗi kết nối.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleForceSync = async () => {
    if (!syncCode) return;
    setIsSyncing(true);
    try {
      const pushRes = await syncService.push();
      const pullRes = await syncService.pull();

      if (pushRes.success && pullRes.success) {
        refreshState();
        toast.success('Đã đồng bộ thành công với máy chủ đám mây!');
      } else {
        toast.error(pushRes.error || pullRes.error || 'Lỗi khi đồng bộ.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUnlink = () => {
    if (confirm('Bạn có chắc muốn hủy liên kết mã đồng bộ trên thiết bị này? Dữ liệu trên máy của bạn vẫn sẽ được giữ nguyên.')) {
      syncService.setSyncCode(null);
      refreshState();
      toast.info('Đã hủy liên kết mã đồng bộ.');
    }
  };

  const formatLastSync = (time: number | null) => {
    if (!time) return 'Chưa có thông tin';
    const diffMinutes = Math.floor((Date.now() - time) / 60000);
    if (diffMinutes < 1) return 'Vừa mới đây';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ngày ${date.toLocaleDateString('vi-VN')}`;
  };

  return (
    <section
      aria-labelledby="cloud-sync-heading"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="cloud-sync-heading"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Đồng Bộ Đa Thiết Bị (Multi-Device Sync)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Cloud SQLite
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Đồng bộ tiến độ học tập, thẻ SRS, chuỗi ngày Streak và XP tức thì giữa Máy tính & Điện thoại.
            </p>
          </div>
        </div>

        {syncCode && (
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all disabled:opacity-60"
            title="Đồng bộ ngay dữ liệu mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {syncCode ? (
          /* State 1: Device is already connected */
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Mã đồng bộ của bạn:
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-widest">
                    {syncCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Sao chép mã"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  💡 <strong>Cách đồng bộ với điện thoại:</strong> Mở điện thoại của bạn, vào trang <em>Cài đặt</em> và nhập mã <strong>{syncCode}</strong> ở mục bên dưới.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:self-center">
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="sm:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleUnlink}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Hủy liên kết</span>
                </button>
              </div>
            </div>

            {/* Sync status bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trạng thái: <strong>Tự động đồng bộ nền khi học</strong></span>
              </div>
              <div>
                Đồng bộ lần cuối: <strong className="text-slate-700 dark:text-slate-300">{formatLastSync(lastSyncTime)}</strong>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Device has no sync code yet */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A: Generate new code */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Thiết bị đầu tiên / Tạo mã mới</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nếu bạn bắt đầu học trên máy tính này, hãy bấm tạo một <strong>Mã đồng bộ cá nhân</strong>. Sau đó bạn chỉ cần dùng mã này để liên kết với điện thoại.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isGenerating ? 'Đang tạo mã...' : 'Tạo mã đồng bộ đám mây'}</span>
              </button>
            </div>

            {/* Option B: Link with existing code */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Đã có mã từ thiết bị khác?</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nhập mã đồng bộ hiển thị trên máy tính của bạn vào đây để nạp toàn bộ tiến độ học sang thiết bị này.
                </p>
              </div>

              <form onSubmit={handleLinkCode} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: NH-12345"
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-mono uppercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isLinking || !inputCode.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span>{isLinking ? 'Đang kết nối...' : 'Liên kết'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
