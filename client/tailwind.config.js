/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nl: {
          900: '#07080c',
          800: '#0f1017',
          700: '#171924',
          600: '#232636',
          red: '#d98d75',
          redglow: '#e39c84',
          darkred: '#b35d49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
