/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#09090b', // slightly warmer dark
        elevated: '#18181b', // zinc-900
        border: 'rgba(255, 255, 255, 0.1)',
        accent: {
          lime: '#d4ff00',
          cyan: '#00f0ff',
          rose: '#ff2a5f',
          orange: '#ff5c00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #d4ff0020 0deg, transparent 180deg)',
      }
    },
  },
  plugins: [],
}
