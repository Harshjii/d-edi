/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1e293b', // Slate 800
        'primary': '#334155',     // Slate 700
        'secondary': '#64748b',   // Slate 500
        'accent': '#f59e0b',      // Amber 500 (Yellow for pop)
        'accent-dark': '#d97706', // Amber 600
        'background': '#f1f5f9',  // Slate 100
        'card': '#ffffff',
        'text-primary': '#1e293b',
        'text-secondary': '#475569',
      },
    },
  },
  plugins: [],
};