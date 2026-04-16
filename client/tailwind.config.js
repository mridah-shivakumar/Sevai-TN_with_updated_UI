/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1B5E20',
          'green-dark': '#0D3A10',
          'green-light': '#2E7D32',
          saffron: '#FF8F00',
          'saffron-dark': '#E65100',
          bg: '#FAFAF5',
          amber: '#FFB300',
          muted: '#6B6B6B',
          black: '#000000',
          white: '#FAFAFA',
          ink: '#1A1A1A',
          blue: '#007AFF', // Electric Blue
        },
      },
      borderRadius: {
        'bento': '24px',
      },
      fontSize: {
        body: ['18px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        head: ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: 'bold' }],
        xxl: ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '900' }],
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        cardHover: '0 6px 18px rgba(0,0,0,0.10)',
      },
      animation: {
        'pulse-slow': 'pulse 2.2s ease-in-out infinite',
        'wave': 'wave 1s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
