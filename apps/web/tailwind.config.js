/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FDFBF7',
          100: '#F9F5EC',
          200: '#F5F0E8',
          300: '#EDE5D4',
          400: '#DDD0B8',
          500: '#C4B494',
        },
        metallic: {
          green: {
            50: '#E8F5EE',
            100: '#C8E6D4',
            200: '#A4D4B8',
            300: '#6BBF8A',
            400: '#40916C',
            500: '#2D6A4F',
            600: '#1B5E3A',
            700: '#145230',
            800: '#0D4626',
            900: '#063A1C',
          },
        },
      },
      backgroundImage: {
        'metallic-green': 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #2D6A4F 100%)',
        'metallic-green-shine': 'linear-gradient(135deg, #40916C 0%, #6BBF8A 30%, #40916C 60%, #2D6A4F 100%)',
        'beige-gradient': 'linear-gradient(180deg, #FDFBF7 0%, #F5F0E8 100%)',
      },
      boxShadow: {
        'metallic': '0 4px 6px -1px rgba(45, 106, 79, 0.15), 0 2px 4px -1px rgba(45, 106, 79, 0.1)',
        'metallic-lg': '0 10px 15px -3px rgba(45, 106, 79, 0.2), 0 4px 6px -2px rgba(45, 106, 79, 0.1)',
      },
      animation: {
        'shine': 'shine 3s ease-in-out infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
      },
      keyframes: {
        shine: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45, 106, 79, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(45, 106, 79, 0)' },
        },
      },
    },
  },
  plugins: [],
};
