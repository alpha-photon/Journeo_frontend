/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system tokens
        paper:      '#FAF6EE',
        'paper-warm': '#F5F0E8',
        ink:        '#0F0D0A',
        'ink-soft': '#3D3A35',
        'ink-muted':'#6B665D',
        line:       '#E8E2D9',
        'line-soft':'#F0ECE4',
        // Primary accent — saffron orange
        saffron: {
          DEFAULT: '#F97316',
          deep:    '#EA580C',
          light:   '#FED7AA',
          subtle:  '#FFF7ED',
        },
        // Secondary accent — marigold gold
        marigold: {
          DEFAULT: '#F59E0B',
          deep:    '#D97706',
          light:   '#FDE68A',
          subtle:  '#FFFBEB',
        },
        // Jade green
        jade: {
          DEFAULT: '#059669',
          deep:    '#047857',
          light:   '#A7F3D0',
          subtle:  '#ECFDF5',
        },
        // Rose pink
        rose: {
          DEFAULT: '#F43F5E',
          deep:    '#E11D48',
          light:   '#FECDD3',
          subtle:  '#FFF1F2',
        },
        // Indigo
        indigo: {
          DEFAULT: '#4F46E5',
          deep:    '#4338CA',
          light:   '#C7D2FE',
          subtle:  '#EEF2FF',
        },
        // Legacy brand kept for compatibility (remapped to saffron)
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(15,13,10,0.06), 0 1px 2px rgba(15,13,10,0.04)',
        'warm':    '0 4px 12px rgba(15,13,10,0.08), 0 2px 4px rgba(15,13,10,0.04)',
        'warm-md': '0 8px 24px rgba(15,13,10,0.10), 0 4px 8px rgba(15,13,10,0.06)',
        'warm-lg': '0 20px 50px rgba(15,13,10,0.12), 0 8px 20px rgba(15,13,10,0.08)',
        'saffron': '0 4px 14px rgba(249,115,22,0.25)',
        'saffron-lg': '0 8px 28px rgba(249,115,22,0.30)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out both',
        'slide-up':   'slideUp 0.35s ease-out both',
        'slide-down': 'slideDown 0.3s ease-out both',
        'slide-in':   'slideIn 0.3s ease-out both',
        'scale-in':   'scaleIn 0.25s ease-out both',
        'float':      'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s infinite',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
