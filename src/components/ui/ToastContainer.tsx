'use client';

import React from 'react';
import { useToastStore, ToastItem } from '@/stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

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

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const getVariantConfig = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
          border: 'border-emerald-500/30 dark:border-emerald-500/40',
          bg: 'bg-white dark:bg-slate-900',
          bar: 'bg-emerald-500',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
          border: 'border-rose-500/30 dark:border-rose-500/40',
          bg: 'bg-white dark:bg-slate-900',
          bar: 'bg-rose-500',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
          border: 'border-amber-500/30 dark:border-amber-500/40',
          bg: 'bg-white dark:bg-slate-900',
          bar: 'bg-amber-500',
        };
      case 'info':
      default:

        return {
          icon: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
          border: 'border-indigo-500/30 dark:border-indigo-500/40',
          bg: 'bg-white dark:bg-slate-900',
          bar: 'bg-indigo-500',
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${config.bg} ${config.border}`}
    >
      <div className="pt-0.5">{config.icon}</div>
      <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 break-words">
        {item.message}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors -mr-1 -mt-1"
        aria-label="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;
