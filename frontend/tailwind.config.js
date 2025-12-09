/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9', // sky-500
        secondary: '#0284c7', // sky-600
        accent: '#06b6d4', // cyan-500
      },
    },
  },
  plugins: [],
}
