/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trust-blue': '#1E88E5',
        'savings-orange': '#FF9800',
        'text-gray': '#333333',
      },
    },
  },
  plugins: [],
};
