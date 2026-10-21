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
    const key = (type || '').toString().toLowerCase().trim();

    // Approved / Success
    if (
      key === 'approved' ||
      key === 'success' ||
      key === 'sanctioned' ||
      key === 'disbursed' ||
      key === 'compliant' ||
      key === 'active' ||
      key === 'low risk' ||
      key === 'low' ||
      key === 'available' ||
      key === 'authorized' ||
      key === 'authorized by you' ||
      key.includes('sanction') ||
      key.includes('approved')
    ) {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-1 dark:ring-inset dark:ring-emerald-400/20';
    }

    // Rejected / High Risk
    if (
      key === 'rejected' ||
      key === 'high risk' ||
      key === 'high' ||
      key === 'overrun' ||
      key === 'critical' ||
      key === 'danger' ||
      key === 'conflict' ||
      key === 'booked / conflict' ||
      key === 'security flag' ||
      key.includes('reject') ||
      key.includes('high risk')
    ) {
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-1 dark:ring-inset dark:ring-red-400/20';
    }

    // Pending / Action Required
    if (
      key === 'pending' ||
      key === 'pending approval' ||
      key === 'pending review' ||
      key === 'action required' ||
      key === 'under review' ||
      key === 'submitted' ||
      key === 'in progress' ||
      key === 'medium risk' ||
      key === 'medium' ||
      key === 'warning' ||
      key === 'drafting' ||
      key === 'locked' ||
      key === 'payment locked' ||
      key === 'receipt requested' ||
      key.includes('pending') ||
      key.includes('review') ||
      key.includes('action') ||
      key.includes('medium risk')
    ) {
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-1 dark:ring-inset dark:ring-amber-400/20';
    }

    // Neutral / Draft / Inactive
    if (key === 'draft' || key === 'inactive' || key === 'archived' || key.includes('draft')) {
      return 'bg-stone-100 text-neutral-600 ring-1 ring-inset ring-stone-300/50 dark:bg-[#1A1A1A] dark:text-neutral-400 dark:ring-1 dark:ring-inset dark:ring-stone-700/50';
    }

    // Teal / Venue / Module
    if (key === 'teal' || key === 'venue' || key === 'equipment') {
      return 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-400/10 dark:text-teal-400 dark:ring-1 dark:ring-inset dark:ring-teal-400/20';
    }

    // Purple
    if (key === 'purple') {
      return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-1 dark:ring-inset dark:ring-purple-400/20';
    }

    return 'bg-stone-100 text-neutral-700 ring-1 ring-inset ring-stone-300/60 dark:bg-[#222222] dark:text-neutral-300 dark:ring-1 dark:ring-inset dark:ring-[#333333]';
  };

  const getDotColor = (type) => {
    const key = (type || '').toString().toLowerCase().trim();

    // Approved / Success
    if (
      key === 'approved' ||
      key === 'success' ||
      key === 'sanctioned' ||
      key === 'disbursed' ||
      key === 'compliant' ||
      key === 'active' ||
      key === 'low risk' ||
      key === 'low' ||
      key === 'available' ||
      key === 'authorized' ||
      key === 'authorized by you' ||
      key.includes('sanction') ||
      key.includes('approved')
    ) {
      return 'bg-emerald-500 dark:bg-emerald-400';
    }

    // Rejected / High Risk
    if (
      key === 'rejected' ||
      key === 'high risk' ||
      key === 'high' ||
      key === 'overrun' ||
      key === 'critical' ||
      key === 'danger' ||
      key === 'conflict' ||
      key === 'booked / conflict' ||
      key === 'security flag' ||
      key.includes('reject') ||
      key.includes('high risk')
    ) {
      return 'bg-red-500 dark:bg-red-400';
    }

    // Pending / Action Required
    if (
      key === 'pending' ||
      key === 'pending approval' ||
      key === 'pending review' ||
      key === 'action required' ||
      key === 'under review' ||
      key === 'submitted' ||
      key === 'in progress' ||
      key === 'medium risk' ||
      key === 'medium' ||
      key === 'warning' ||
      key === 'drafting' ||
      key === 'locked' ||
      key === 'payment locked' ||
      key === 'receipt requested' ||
      key.includes('pending') ||
      key.includes('review') ||
      key.includes('action') ||
      key.includes('medium risk')
    ) {
      return 'bg-amber-500 dark:bg-amber-400';
    }

    // Draft / Inactive
    if (key === 'draft' || key === 'inactive' || key === 'archived' || key.includes('draft')) {
      return 'bg-stone-400 dark:bg-stone-500';
    }

    // Teal
    if (key === 'teal' || key === 'venue' || key === 'equipment') {
      return 'bg-teal-500 dark:bg-teal-400';
    }

    // Purple
    if (key === 'purple') {
      return 'bg-purple-500 dark:bg-purple-400';
    }

    return 'bg-current';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-semibold rounded uppercase ${sizeStyles[size]} ${getVariantStyles(variant)} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(variant)}`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
