/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFC107',
          dark: '#18181b', // zinc-900
          black: '#09090b', // zinc-950
          surface: '#27272a', // zinc-800
          accent: '#F59E0B', // amber-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}