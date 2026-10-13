import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 font-sans"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-stone-500 dark:text-neutral-300 pointer-events-none flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full h-10 px-3 text-sm font-sans rounded transition-all duration-200 outline-none
            bg-stone-50 text-neutral-900 border border-stone-200 placeholder:text-stone-400
            focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900
            dark:bg-[#111111] dark:text-neutral-200 dark:border-[#2A2A2A] dark:placeholder:text-neutral-500
            dark:focus:border-stone-400 dark:focus:ring-1 dark:focus:ring-stone-400/30 dark:[color-scheme:dark]
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-sans">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-stone-500 dark:text-neutral-400 font-sans">{helperText}</p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  containerClassName = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold tracking-wider uppercase text-neutral-700 dark:text-neutral-300 font-sans"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3 text-sm font-sans rounded transition-all duration-200 outline-none
          bg-stone-50 text-neutral-900 border border-stone-200
          focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900
          dark:bg-[#111111] dark:text-neutral-200 dark:border-[#2A2A2A]
          dark:focus:border-stone-400 dark:focus:ring-1 dark:focus:ring-stone-400/30
          ${error ? 'border-rose-500' : ''}
          ${className}`}
        {...props}
      >
        {children ||
          options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt} className="bg-stone-50 dark:bg-[#111111] text-neutral-900 dark:text-neutral-200">
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
      </select>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-sans">{error}</p>}
    </div>
  );
};

export default Input;
