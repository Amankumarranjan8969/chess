/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#f0d9b5',
          dark: '#b58863',
          highlight: 'rgba(255, 255, 0, 0.4)',
          check: 'rgba(255, 0, 0, 0.5)',
          selected: 'rgba(20, 85, 30, 0.5)',
          target: 'rgba(20, 85, 30, 0.3)',
        }
      }
    },
  },
  plugins: [],
}
