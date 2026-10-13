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
        canvas: {
          light: '#F7F7F5', // soft off-white
          dark: '#111111',  // stark off-black
        },
        surface: {
          light: '#F5F5F4', // stone-100 elevated
          dark: '#1A1A1A',  // off-black elevated
        },
        editorial: {
          border: {
            light: '#E7E5E4', // stone-200
            dark: '#2A2A2A',  // hyper-subtle dark
          },
        },
      },
      boxShadow: {
        'editorial-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'editorial-card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'editorial-modal': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
