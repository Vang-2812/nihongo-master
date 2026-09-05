'use client';

import React from 'react';
import { useToastStore, ToastItem } from '@/stores/toastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
      ))}
    </aside>
  );
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

const getBadgeText = (type: string) => {
  switch (type) {
    case 'success':
      return 'THÀNH CÔNG';
    case 'error':
      return 'LỖI';
    case 'warning':
      return 'CẢNH BÁO';
    case 'info':
    default:
      return 'THÔNG BÁO';
  }
};

const getBadgeStyle = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    case 'error':
      return 'bg-rose-50 text-rose-800 border border-rose-200';
    case 'warning':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'info':
    default:
      return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
  }
};

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start justify-between gap-3 bg-white border border-stone-200 shadow-sm p-4 text-stone-900 font-sans text-xs transition-all duration-100"
    >
      <div className="flex flex-col gap-1.5 flex-1">
        <span className={`inline-block w-fit px-1.5 py-0.5 font-bold tracking-wider text-[10px] font-mono uppercase ${getBadgeStyle(item.type)}`}>
          {getBadgeText(item.type)}
        </span>
        <div className="break-words leading-relaxed text-xs text-stone-700">{item.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="w-6 h-6 border border-stone-200 flex items-center justify-center font-mono text-xs hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors duration-100 -mr-1 -mt-1 flex-shrink-0"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
};

export default ToastContainer;

