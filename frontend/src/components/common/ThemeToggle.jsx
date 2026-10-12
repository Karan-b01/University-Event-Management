import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', isTransparent = false }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400/40 ${
        isTransparent
          ? isDark
            ? 'bg-[#111111]/70 border-white/15 text-stone-200 hover:text-white hover:border-white/30 hover:bg-[#111111]/90 backdrop-blur-md shadow-sm'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-md shadow-sm'
          : isDark
          ? 'bg-[#1A1A1A] border-[#2A2A2A] text-stone-200 hover:text-stone-100 hover:border-[#383838] hover:bg-[#222222] shadow-sm'
          : 'bg-stone-100 border-stone-200 text-neutral-800 hover:text-neutral-950 hover:bg-stone-200 hover:border-stone-300 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-stone-200 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-neutral-800 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
