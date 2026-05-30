/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        // Keep display token defined for backward compat but unused
        display: ['"Instrument Serif"', 'serif'],
      },
      colors: {
        // Theme tokens
        primary:        'var(--color-primary)',
        secondary:      'var(--color-secondary)',
        warning:        'var(--color-warning)',
        'accent-light': 'var(--color-accent-light)',
        white:          'var(--color-white)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        
        // Muted status (exceptions for pass/fail semantics)
        'status-pass': '#2F8A5C',
        'status-fail': '#B5483A',
      },
      boxShadow: {
        soft:  '0 2px 8px -2px rgba(14, 84, 103, 0.08)',
        lift:  '0 8px 24px -8px rgba(14, 84, 103, 0.12)',
        card:  '0 1px 3px 0 rgba(14, 84, 103, 0.06), 0 1px 2px 0 rgba(14, 84, 103, 0.04)',
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
