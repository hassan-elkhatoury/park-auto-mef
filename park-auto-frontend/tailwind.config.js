/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          dark: '#070D1B',
          card: '#0F172A',
          sidebar: '#090F1F',
        },
        gold: {
          DEFAULT: '#C5A059',
          bright: '#E5C17C',
          dark: '#9B783E',
        }
      }
    },
  },
  plugins: [],
}
