/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        pitchBlack: {
          DEFAULT: '#000000',
          surface: '#000000',
          card: '#000000',
          border: 'rgba(255, 255, 255, 0.12)',
        },
        scholarEmerald: {
          DEFAULT: '#10B981',
          hover: '#059669',
          dim: '#4EDEA3',
          glow: 'rgba(16, 185, 129, 0.28)',
          light: '#6FFBBE',
          darkText: '#000000',
        },
        scholarTeal: {
          patina: '#0F766E',
          deep: '#003733',
          light: '#80D5CB',
        },
        scholarPurple: {
          DEFAULT: '#382BF0',
          container: '#9898FF',
          light: '#C2C1FF',
        },
      },
      boxShadow: {
        'pitch-glow': '0 0 20px rgba(16, 185, 129, 0.2)',
        'pitch-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(16, 185, 129, 0.15)',
        'light-clean': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
