/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#F7F7F6',
          100: '#EDEDEB',
          200: '#D9D9D5',
          300: '#B8B8B2',
          400: '#8C8C86',
          500: '#5F5F5A',
          600: '#3F3F3B',
          700: '#262624',
          800: '#161614',
          900: '#0B0B0A',
          950: '#070706',
        },
        accent: {
          50:  '#EFF3FB',
          100: '#D8E2F4',
          200: '#B0C4E9',
          300: '#84A2D9',
          400: '#5A82CA',
          500: '#2851B8',
          600: '#1F40A0',
          700: '#1B3782',
          800: '#172E6C',
          900: '#11224F',
          950: '#0B173B',
        },
        brand: {
          yellow: {
            50:  '#FFFAEC',
            100: '#FFF1C5',
            300: '#FFD75A',
            500: '#F5B800',
            600: '#D69D00',
            700: '#B68500',
          },
          navy: {
            700: '#152B47',
            800: '#0E2236',
            900: '#091828',
          },
        },
        signal: {
          green: '#198F4F',
          amber: '#B47100',
          red:   '#C0321F',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':   'fadeIn 0.5s ease-out both',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'marquee':   'marquee 30s linear infinite',
      },
      keyframes: {
        fadeUp:   { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseDot: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.92)' } },
        marquee:  { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
}
