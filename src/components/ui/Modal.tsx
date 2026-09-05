'use client';

import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '2xl',
  showCloseButton = true,
  className = '',
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className={`relative bg-white border border-stone-300 w-full ${
          maxWidth && maxWidthMap[maxWidth] ? maxWidthMap[maxWidth] : 'max-w-2xl'
        } p-6 sm:p-8 shadow-xl z-10 my-8 transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b border-stone-200 pb-4 mb-6">
            <div>
              {title && (
                <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 font-sans text-sm text-stone-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="border border-stone-300 px-2 py-1 font-mono text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors ml-auto flex-shrink-0"
                aria-label="Đóng cửa sổ"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="max-h-[calc(85vh-8rem)] overflow-y-auto font-sans text-stone-900 text-sm">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-stone-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

