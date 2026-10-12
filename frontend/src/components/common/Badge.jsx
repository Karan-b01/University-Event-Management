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
        return 'bg-stone-200/80 text-neutral-900 border border-stone-300 dark:bg-[#262626] dark:text-neutral-200 dark:border-[#383838]';

      case 'pending':
      case 'under review':
      case 'medium risk':
      case 'warning':
      case 'drafting':
        return 'bg-stone-200/50 text-neutral-700 border border-stone-300/80 dark:bg-[#202020] dark:text-neutral-300 dark:border-[#303030]';

      case 'rejected':
      case 'high risk':
      case 'overrun':
      case 'critical':
      case 'danger':
        return 'bg-neutral-200 text-neutral-900 border border-neutral-300 dark:bg-[#252020] dark:text-rose-300 dark:border-rose-900/30';

      case 'draft':
      case 'inactive':
      case 'archived':
        return 'bg-stone-100 text-neutral-600 border border-stone-200 dark:bg-[#1A1A1A] dark:text-neutral-400 dark:border-[#2A2A2A]';

      case 'security flag':
      case 'locked':
      case 'review':
      case 'purple':
        return 'bg-stone-200/70 text-neutral-800 border border-stone-300 dark:bg-[#222222] dark:text-neutral-300 dark:border-[#333333]';

      case 'teal':
      case 'venue':
      case 'equipment':
        return 'bg-stone-200/70 text-neutral-800 border border-stone-300 dark:bg-[#222222] dark:text-neutral-300 dark:border-[#333333]';

      default:
        return 'bg-stone-200/60 text-neutral-800 border border-stone-200 dark:bg-[#222222] dark:text-neutral-300 dark:border-[#2A2A2A]';
    }
  };

  const dotColors = {
    approved: 'bg-neutral-900 dark:bg-stone-300',
    pending: 'bg-stone-500 dark:bg-neutral-400',
    rejected: 'bg-rose-500',
    draft: 'bg-stone-400',
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
