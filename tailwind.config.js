/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2B8A3E',
          light: '#D3F9D8',
          dark: '#51CF66',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#25262B',
        },
        background: {
          DEFAULT: '#F8F9FA',
          dark: '#1A1B1E',
        },
      },
    },
  },
  plugins: [],
};
