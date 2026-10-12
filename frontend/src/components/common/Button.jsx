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
    // Primary: Editorial Solid Neutral (Dark in Light Mode, Soft White in Dark Mode)
    primary:
      'bg-neutral-900 text-stone-50 hover:bg-neutral-800 shadow-sm focus:ring-neutral-900/20 ' +
      'dark:bg-stone-200 dark:text-neutral-900 dark:hover:bg-stone-300 dark:shadow-none dark:focus:ring-stone-300/30',

    // Secondary: Elevated subtle surface with hyper-subtle borders
    secondary:
      'bg-stone-100 text-neutral-900 border border-stone-200 hover:bg-stone-200/60 hover:border-stone-300 ' +
      'dark:bg-[#1A1A1A] dark:text-neutral-200 dark:border-[#2A2A2A] dark:hover:bg-[#222222] dark:hover:text-neutral-100 dark:hover:border-[#383838]',

    // Tertiary / Ghost
    ghost:
      'bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-stone-100 ' +
      'dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-[#1A1A1A]',

    // Danger / Critical Actions
    danger:
      'bg-neutral-900 text-rose-300 border border-rose-900/40 hover:bg-neutral-800 shadow-sm ' +
      'dark:bg-[#1A1A1A] dark:text-rose-300 dark:border dark:border-rose-800/40 dark:hover:bg-[#222222]',

    // Monochrome Accent (replaces legacy teal)
    teal:
      'bg-neutral-900 text-stone-50 hover:bg-neutral-800 shadow-sm ' +
      'dark:bg-stone-200 dark:text-neutral-900 dark:hover:bg-stone-300',
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
