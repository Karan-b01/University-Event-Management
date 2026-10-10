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
        className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${maxWidth} z-10 rounded-xl overflow-hidden transition-all duration-300
          bg-white/95 text-zinc-900 border border-zinc-200 shadow-2xl
          dark:bg-[#090D10]/95 dark:text-white dark:border-emerald-500/30 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_35px_rgba(16,185,129,0.15)]
          ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow for Obsidian Scholar */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200/80 dark:border-white/10">
          <div>
            {title && (
              <h2 className="font-serif text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-zinc-50/80 dark:bg-white/[0.02] border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
