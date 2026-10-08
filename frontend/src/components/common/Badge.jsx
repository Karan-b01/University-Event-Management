import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wider',
    md: 'text-xs px-3 py-1 tracking-wide',
  };

  const getVariantStyles = (type) => {
    switch (type.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'low risk':
      case 'disbursed':
      case 'compliant':
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30';

      case 'pending':
      case 'under review':
      case 'medium risk':
      case 'warning':
      case 'drafting':
        return 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/30';

      case 'rejected':
      case 'high risk':
      case 'overrun':
      case 'critical':
      case 'danger':
        return 'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/30';

      case 'draft':
      case 'inactive':
      case 'archived':
        return 'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800/60 dark:text-slate-300 dark:border-slate-700';

      case 'security flag':
      case 'locked':
      case 'review':
      case 'purple':
        return 'bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/30';

      case 'teal':
      case 'venue':
      case 'equipment':
        return 'bg-teal-50 text-teal-800 border border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-500/30';

      default:
        return 'bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10';
    }
  };

  const dotColors = {
    approved: 'bg-emerald-500',
    pending: 'bg-amber-500',
    rejected: 'bg-rose-500',
    draft: 'bg-zinc-400',
    default: 'bg-current',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-semibold rounded uppercase ${sizeStyles[size]} ${getVariantStyles(variant)} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant.toLowerCase()] || dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
