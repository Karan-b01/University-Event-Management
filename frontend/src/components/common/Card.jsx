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
        bg-stone-100 border border-stone-200 text-neutral-900 shadow-sm
        dark:bg-[#1A1A1A] dark:border-[#2A2A2A] dark:text-neutral-200 dark:shadow-none
        ${accentBorder ? 'border-l-4 border-l-neutral-900 dark:border-l-stone-300' : ''}
        ${highlight ? 'border-stone-300 dark:border-stone-500' : ''}
        ${className}`}
      {...props}
    >
      {/* Top subtle highlight line for Museum lighting */}
      <div className="absolute top-0 left-0 right-0 h-px bg-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-white/10 dark:to-transparent pointer-events-none" />

      {(title || subtitle || headerAction) && (
        <div className="px-5 py-4 border-b border-stone-200 dark:border-[#2A2A2A] flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-serif text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-stone-500 dark:text-neutral-400 font-sans mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={`${noPadding ? '' : 'p-5'}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-stone-50/80 dark:bg-[#161616] border-t border-stone-200 dark:border-[#2A2A2A] text-xs text-stone-500 dark:text-neutral-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
