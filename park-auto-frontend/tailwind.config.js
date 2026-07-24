/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#0A1628',
          800: '#0F1D32',
          700: '#142640',
          600: '#1B3050',
        },
        gold: {
          DEFAULT: '#C5A059',
          50: '#FBF7EE',
          100: '#F5ECDA',
          200: '#EBDAB5',
          300: '#E0C78F',
          400: '#D4B370',
          500: '#C5A059',
          600: '#A8843D',
          700: '#8A6B30',
          800: '#6C5325',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '10px',
        lg: '12px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.03)',
        'gold': '0 4px 20px rgba(197, 160, 89, 0.35)',
        'card-hover': '0 12px 40px rgba(197, 160, 89, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      fontSize: {
        'page-title': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'section-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'card-number': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'card-title': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'description': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
