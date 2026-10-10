import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    // Light: Solid Black -> Dark: Emerald Ray
    primary:
      'bg-black text-white hover:bg-zinc-800 shadow-sm focus:ring-black/20 ' +
      'dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 dark:shadow-[0_0_16px_rgba(16,185,129,0.35)] dark:focus:ring-emerald-400/30',

    // Light: Clean Academic Border -> Dark: Translucent Pitch Black Glass
    secondary:
      'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100 hover:border-zinc-400 ' +
      'dark:bg-white/[0.05] dark:text-white dark:border-white/10 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400 dark:hover:bg-white/[0.08]',

    // Tertiary / Ghost
    ghost:
      'bg-transparent text-zinc-600 hover:text-black hover:bg-zinc-100 ' +
      'dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.05]',

    // Danger / Critical Actions
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500/30 ' +
      'dark:bg-rose-950/80 dark:text-rose-200 dark:border dark:border-rose-500/30 dark:hover:bg-rose-900/80',

    // Patina Teal Accent (Stitch secondary)
    teal:
      'bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm ' +
      'dark:bg-[#0F766E] dark:text-white dark:border dark:border-teal-400/30 dark:hover:bg-teal-700',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;
