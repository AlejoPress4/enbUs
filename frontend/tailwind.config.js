/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:        '#1B3D7A',
          'blue-dark': '#0F2347',
          'blue-mid':  '#2B5CB8',
          'blue-light':'#EFF4FB',
          orange:      '#F97316',
          'orange-dk': '#EA580C',
          'orange-lt': '#FFF0E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
