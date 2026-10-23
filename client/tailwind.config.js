/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Onest', 'system-ui', 'sans-serif'] },
      colors: {
        // Firuza (Toshkent/Samarqand koshin rangi): bitta urg'u rangi
        brand: { 50: '#E4F2F0', 100: '#CCE7E4', 300: '#5EE0D2', 500: '#12918B', 600: '#0A7E7A', 700: '#066260' },
        // Yashil tusli neytral shkala: yer, siyoh va yuzalar bir oiladan
        slate: {
          50: '#F3F5F2', 100: '#E7ECE8', 200: '#D6DED9', 300: '#B3C0BA', 400: '#5F6D67',
          500: '#556560', 600: '#3F4D49', 700: '#2C3835', 800: '#1B2624', 900: '#0F1B1A',
        },
        field: '#0E2627',
      },
    },
  },
  plugins: [],
};
