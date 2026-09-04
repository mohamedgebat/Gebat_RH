/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gebat: {
          blue: '#2563EB',
          blueDark: '#1D4ED8',
          gold: '#E5A110',
          amber: '#F59E0B',
          green: '#059669',
          red: '#DC2626',
          bgLight: '#F8FAFC',
          card: '#FFFFFF'
        },
        ci: {
          orange: '#E5A110',      // Gebat Gold
          green: '#2563EB',       // Gebat Royal Blue
          greenDark: '#1D4ED8',   // Gebat Deep Blue
          orangeLight: '#FEF3C7', // Gebat Light Gold
          greenLight: '#EFF6FF',  // Gebat Light Blue
          dark: '#0F172A',
          sidebar: '#0F172A',
          card: '#ffffff',
          bg: '#f8fafc',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#059669',
          warning: '#E5A110',
          danger: '#DC2626',
          info: '#2563EB',
          infoLight: '#EFF6FF',
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
