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
          className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-zinc-400 dark:text-slate-500 pointer-events-none flex items-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full h-10 px-3 text-sm font-sans rounded transition-all duration-200 outline-none
            bg-white text-zinc-900 border border-zinc-300 placeholder:text-zinc-400
            focus:border-black focus:ring-1 focus:ring-black
            dark:bg-black dark:text-white dark:border-white/15 dark:placeholder:text-slate-500
            dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-sans">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-zinc-500 dark:text-slate-400 font-sans">{helperText}</p>
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
          className="text-xs font-semibold tracking-wider uppercase text-zinc-700 dark:text-slate-300 font-sans"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3 text-sm font-sans rounded transition-all duration-200 outline-none
          bg-white text-zinc-900 border border-zinc-300
          focus:border-black focus:ring-1 focus:ring-black
          dark:bg-black dark:text-white dark:border-white/15
          dark:focus:border-emerald-400 dark:focus:ring-1 dark:focus:ring-emerald-400/30
          ${error ? 'border-rose-500' : ''}
          ${className}`}
        {...props}
      >
        {children ||
          options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt} className="bg-white dark:bg-black text-zinc-900 dark:text-white">
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
      </select>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-sans">{error}</p>}
    </div>
  );
};

export default Input;
