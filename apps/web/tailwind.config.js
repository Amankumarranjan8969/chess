/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#161512',
          panel: '#21201d',
          card: '#262421',
          hover: '#2d2b27',
        },
        border: {
          dim: '#33302a',
          hover: '#47433c',
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
          gold: '#e5a93b',
          'gold-hover': '#cf942b',
        }
      }
    },
  },
  plugins: [],
}
