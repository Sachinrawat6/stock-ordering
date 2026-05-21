/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#eff4ff',
          100: '#dce8ff',
          200: '#b2ccff',
          300: '#769ef8',
          400: '#3b6ef0',
          500: '#1a4fd8',
          600: '#1039b3',
          700: '#102e8d',
          800: '#142776',
          900: '#1E3A5F',
          950: '#0d1f3c',
        },
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}
