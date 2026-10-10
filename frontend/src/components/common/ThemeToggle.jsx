import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ showLabel = true, className = '', isTransparent = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 font-sans text-xs font-semibold
        ${
          isTransparent
            ? isDark
              ? 'bg-black/40 border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:bg-black/60 shadow-[0_0_12px_rgba(16,185,129,0.15)] backdrop-blur-md'
              : 'bg-black/40 border-white/25 text-white hover:bg-black/60 hover:border-white/40 shadow-sm backdrop-blur-md'
            : isDark
            ? 'bg-[#101417] border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:bg-[#181C1F] shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200 hover:border-zinc-400 shadow-sm'
        } ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Obsidian Scholar (Dark)'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-emerald-400 transition-transform duration-300 group-hover:rotate-12" />
        ) : (
          <Sun className={`w-4 h-4 ${isTransparent ? 'text-amber-300' : 'text-zinc-800'} transition-transform duration-300 group-hover:rotate-45`} />
        )}
      </div>

      {showLabel && (
        <span className="tracking-wider uppercase text-[11px] font-bold">
          {isDark ? 'Obsidian Scholar' : 'Light Mode'}
        </span>
      )}

      {/* Pill Indicator Slider */}
      <span
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
            : isTransparent
            ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]'
            : 'bg-black'
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
