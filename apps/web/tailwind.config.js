/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        'cream-dark': '#F4EFE6',
        lime: {
          DEFAULT: '#CCFF00',
          hover: '#B8E600',
          accent: '#A6E22E',
        },
      },
      boxShadow: {
        neo: '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-xl': '8px 8px 0px 0px #000000',
      },
    },
  },
  plugins: [],
};
