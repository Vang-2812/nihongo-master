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
      return '[ SUCCESS ]';
    case 'error':
      return '[ ERROR ]';
    case 'warning':
      return '[ WARNING ]';
    case 'info':
    default:
      return '[ INFO ]';
  }
};

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start justify-between gap-3 bg-white border-2 border-black p-4 text-black font-mono text-xs shadow-none rounded-none transition-all duration-100"
    >
      <div className="flex flex-col gap-1 flex-1">
        <span className="font-bold tracking-wider">{getBadgeText(item.type)}</span>
        <div className="break-words leading-relaxed">{item.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="border border-black px-1.5 py-0.5 font-mono text-xs hover:bg-black hover:text-white transition-colors duration-100 -mr-1 -mt-1 flex-shrink-0"
        aria-label="Đóng thông báo"
      >
        [ X ]
      </button>
    </div>
  );
};

export default ToastContainer;

