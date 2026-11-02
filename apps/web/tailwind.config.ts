import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#000000',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#a3a3a3',
          300: '#737373',
          400: '#525252',
          500: '#2a2a2a',
          600: '#1a1a1a',
          700: '#141414',
          800: '#111111',
          900: '#0a0a0a',
        },
        brand: {
          DEFAULT: '#e10600',
          soft: '#ff2a1f',
          muted: '#8a0400',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(225, 6, 0, 0.25)',
      },
      backgroundImage: {
        'hero-gym':
          "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.45) 100%), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2400&q=80')",
      },
    },
  },
  plugins: [],
};

export default config;
