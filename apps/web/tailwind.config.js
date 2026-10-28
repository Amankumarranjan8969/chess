/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f5f5f4',
          panel: '#ffffff',
          card: '#fafaf9',
          hover: '#f0f0ee',
        },
        border: {
          dim: '#e7e5e4',
          hover: '#d6d3d1',
        },
        board: {
          light: '#ebecd0',
          dark: '#739552',
          highlight: '#bbcb43',
          check: 'rgba(235, 97, 80, 0.75)',
        },
        chess: {
          green: '#739552',
          'green-hover': '#648346',
          gold: '#d97706',
          'gold-hover': '#b45309',
        }
      }
    },
  },
  plugins: [],
}
