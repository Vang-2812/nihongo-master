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
      className="border border-stone-200 p-6 sm:p-8 bg-white shadow-sm mb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
              CLOUD SYNC
            </span>
            <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600">
              SQLITE REPOSITORY
            </span>
          </div>
          <h2
            id="cloud-sync-heading"
            className="font-serif text-xl sm:text-2xl font-light uppercase tracking-tight text-stone-900 flex items-center gap-2"
          >
            <Cloud className="w-5 h-5 text-stone-700" />
            Đồng Bộ Đa Thiết Bị (Multi-Device Sync)
          </h2>
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500 mt-1">
            Đồng bộ tiến độ học tập, thẻ SRS, chuỗi streak và XP tức thì giữa Máy tính & Điện thoại
          </p>
        </div>

        {syncCode && (
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto shadow-xs"
            title="Đồng bộ ngay dữ liệu mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngay'}</span>
          </button>
        )}
      </div>

      <div className="mt-6">
        {syncCode ? (
          /* State 1: Device is already connected */
          <div className="space-y-6">
            <div className="border border-stone-200 p-6 bg-white space-y-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 block">
                    MÃ ĐỒNG BỘ CỦA BẠN
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl sm:text-4xl font-light text-stone-900 tracking-widest">
                      {syncCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center gap-1.5 shadow-xs"
                      title="Sao chép mã"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-600" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-sans text-xs text-stone-500 pt-1">
                    💡 <strong>Cách đồng bộ với điện thoại:</strong> Mở điện thoại của bạn, vào trang <em>Cài đặt</em> và nhập mã <strong>{syncCode}</strong> ở mục bên dưới.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:self-center">
                  <button
                    type="button"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center gap-2 disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 hover:border-stone-400 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors duration-100 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Unlink className="w-3.5 h-3.5 text-stone-500" />
                    <span>Hủy liên kết</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sync status table with hairline dividers */}
            <div className="border border-stone-200 divide-y divide-stone-200 font-mono text-xs shadow-xs">
              <div className="p-3 flex items-center justify-between bg-white">
                <span className="text-stone-500 uppercase tracking-wider">TRẠNG THÁI KẾT NỐI</span>
                <span className="text-emerald-700 font-medium uppercase">ĐANG HOẠT ĐỘNG · TỰ ĐỘNG ĐỒNG BỘ NỀN</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-white">
                <span className="text-stone-500 uppercase tracking-wider">LẦN ĐỒNG BỘ GẦN NHẤT</span>
                <span className="text-stone-800 font-medium uppercase">{formatLastSync(lastSyncTime)}</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-white">
                <span className="text-stone-500 uppercase tracking-wider">CƠ CHẾ ĐỒNG BỘ</span>
                <span className="text-stone-800 font-medium uppercase">TWO-WAY STATE MERGE · SQLITE CLOUD</span>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: Device has no sync code yet */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A: Generate new code */}
            <div className="border border-stone-200 p-6 bg-white flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600 block w-fit">
                  01 · PRIMARY DEVICE
                </span>
                <h3 className="font-serif text-lg font-medium uppercase tracking-tight text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-stone-700" />
                  Thiết Bị Đầu Tiên / Tạo Mã Mới
                </h3>
                <p className="font-sans text-xs text-stone-500 leading-relaxed">
                  Nếu bạn bắt đầu học trên máy tính này, hãy bấm tạo một <strong>Mã đồng bộ cá nhân</strong>. Sau đó bạn chỉ cần dùng mã này để liên kết với điện thoại.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="w-full border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isGenerating ? 'Đang tạo mã...' : 'Khởi Tạo Mã Đồng Bộ Đám Mây'}</span>
              </button>
            </div>

            {/* Option B: Link with existing code */}
            <div className="border border-stone-200 p-6 bg-white flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-2">
                <span className="border border-stone-300 bg-stone-100/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-stone-600 block w-fit">
                  02 · SECONDARY DEVICE
                </span>
                <h3 className="font-serif text-lg font-medium uppercase tracking-tight text-stone-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-stone-700" />
                  Đã Có Mã Từ Thiết Bị Khác?
                </h3>
                <p className="font-sans text-xs text-stone-500 leading-relaxed">
                  Nhập mã đồng bộ hiển thị trên máy tính hoặc điện thoại khác vào đây để nạp toàn bộ tiến độ học sang thiết bị này.
                </p>
              </div>

              <form onSubmit={handleLinkCode} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="VÍ DỤ: NH-12345"
                    className="border border-stone-300 p-2.5 font-mono text-xs sm:text-sm uppercase focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white flex-1 text-stone-900 shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={isLinking || !inputCode.trim()}
                    className="border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors duration-100 inline-flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0 shadow-xs"
                  >
                    <span>{isLinking ? 'Đang kết nối...' : 'Liên Kết'}</span>
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
