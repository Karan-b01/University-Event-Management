import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', isTransparent = false }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
        isTransparent
          ? isDark
            ? 'bg-black/60 border-white/20 text-yellow-400 hover:text-yellow-300 hover:border-white/40 hover:bg-black/80 backdrop-blur-md shadow-sm'
            : 'bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/40 backdrop-blur-md shadow-sm'
          : isDark
          ? 'bg-black border-white/20 text-yellow-400 hover:text-yellow-300 hover:border-white/40 hover:bg-zinc-900 shadow-sm'
          : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-300 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Pitch Black'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Pitch Black'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-xl transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-xl transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
