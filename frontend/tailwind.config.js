/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ci: {
          orange: '#F77F00',
          green: '#009E49',
          greenDark: '#007A38',
          orangeLight: '#FFF3E0',
          greenLight: '#E8F5E9',
          dark: '#1a1a2e',
          sidebar: '#16213e',
          card: '#ffffff',
          bg: '#f0f2f5',
          text: '#2d3436',
          muted: '#636e72',
          border: '#dfe6e9',
          success: '#00b894',
          warning: '#fdcb6e',
          danger: '#d63031',
          info: '#0984e3',
          infoLight: '#e3f2fd',
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        shake: 'shake 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
}
