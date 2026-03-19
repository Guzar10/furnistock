/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT:  'var(--bg)',
          surface:  'var(--bg-surface)',
          surface2: 'var(--bg-surface2)',
          surface3: 'var(--bg-surface3)',
        },
        border: {
          DEFAULT: 'var(--border)',
          2:       'var(--border-2)',
        },
        text: {
          DEFAULT: 'var(--text)',
          2:       'var(--text-2)',
          3:       'var(--text-3)',
        },
        accent:  'var(--accent)',
        success: 'var(--success)',
        danger:  'var(--danger)',
        info:    'var(--info)',
        purple:  'var(--purple)',
      },
    },
  },
  plugins: [],
}