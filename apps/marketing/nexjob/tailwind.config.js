/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nx: {
          bg: '#09090b',
          bg2: '#0f1117',
          surface: '#18181b',
          surface2: '#1e1e24',
          surface3: '#27272a',
          border: '#2e2e35',
          border2: '#3f3f46',
          text: '#fafafa',
          text2: '#d4d4d8',
          muted: '#a1a1aa',
          muted2: '#71717a',
          purple: '#1d4ed8',
          'purple-light': '#60a5fa',
          'purple-dark': '#1e40af',
          'purple-glow': 'rgba(29,78,216,0.15)',
          cyan: '#334155',
          'cyan-light': '#64748b',
          green: '#22c55e',
          'green-light': '#4ade80',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'fade-up': 'fade-up 0.5s ease forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.3)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
