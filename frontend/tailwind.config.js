/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0C0C0A',
          surface: '#141412',
          surface2: '#1C1C19',
          surface3: '#242420',
        },
        border: {
          DEFAULT: '#272724',
          2: '#323230',
        },
        text: {
          DEFAULT: '#F0EBE1',
          2: '#9C9890',
          3: '#68655F',
        },
        accent: {
          DEFAULT: '#C8963E',
          dim: 'rgba(200,150,62,0.10)',
        },
        success: '#4CAF7D',
        danger: '#E05555',
        info: '#5A9FD4',
        purple: '#9B72CF',
      },
    },
  },
  plugins: [],
}