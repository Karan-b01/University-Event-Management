import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-xl',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 dark:bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${maxWidth} z-10 rounded-xl overflow-hidden transition-all duration-300
          bg-stone-100 text-neutral-900 border border-stone-200 shadow-2xl
          dark:bg-[#1A1A1A] dark:text-neutral-200 dark:border-[#2A2A2A] dark:shadow-2xl
          ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-200 dark:border-[#2A2A2A]">
          <div>
            {title && (
              <h2 className="font-serif text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-stone-500 dark:text-neutral-400 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-neutral-900 hover:bg-stone-200 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-[#262626] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 dark:bg-[#161616] dark:border-[#2A2A2A] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
