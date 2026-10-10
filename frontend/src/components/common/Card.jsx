import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  accentBorder = false,
  highlight = false,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-lg transition-all duration-300 relative overflow-hidden
        bg-white border border-zinc-200 shadow-sm
        dark:bg-black dark:border-white/10 dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.9)]
        ${accentBorder ? 'border-l-4 border-l-black dark:border-l-emerald-400' : ''}
        ${highlight ? 'dark:border-emerald-500/40 dark:shadow-[0_0_24px_rgba(16,185,129,0.12)]' : ''}
        ${className}`}
      {...props}
    >
      {/* Top subtle highlight line for Dark theme museum lighting */}
      <div className="absolute top-0 left-0 right-0 h-px bg-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-white/20 dark:to-transparent pointer-events-none" />

      {(title || subtitle || headerAction) && (
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-serif text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={`${noPadding ? '' : 'p-5'}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-zinc-50/70 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
