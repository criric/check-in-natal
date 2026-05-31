import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2F7',
          100: '#D6DFEA',
          200: '#ACBED3',
          300: '#7E97B5',
          400: '#547490',
          500: '#325571',
          600: '#234059',
          700: '#1F3A57',
          800: '#142940',
          900: '#0B1A2B',
        },
        gold: {
          50: '#FBF7EE',
          100: '#F4EBD4',
          200: '#E7D3A0',
          300: '#D8BB7C',
          400: '#CFB075',
          500: '#C8A668',
          600: '#A98851',
          700: '#87693C',
          800: '#5F4926',
          900: '#3E2F18',
        },
        sand: {
          50: '#FAF6EE',
          100: '#F5EFE6',
          200: '#ECE3CE',
          300: '#DFD2B0',
          400: '#C9B98E',
        },
        ink: {
          DEFAULT: '#0B1A2B',
          muted: '#4B5C70',
          subtle: '#7A8899',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FAF6EE',
          sunken: '#F5EFE6',
        },
        line: {
          DEFAULT: '#E6DECB',
          strong: '#D6CBAF',
        },
        brand: {
          primary: '#1F3A57',
          'primary-hover': '#142940',
          accent: '#C8A668',
          'accent-hover': '#A98851',
          surface: '#F5EFE6',
          ink: '#0B1A2B',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EEF2F7',
          100: '#D6DFEA',
          500: '#325571',
          600: '#234059',
          700: '#1F3A57',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        xs: '0.1875rem',
        sm: '0.3125rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        xs: '0 1px 1px rgba(11, 26, 43, 0.04)',
        sm: '0 1px 2px rgba(11, 26, 43, 0.06), 0 1px 1px rgba(11, 26, 43, 0.04)',
        DEFAULT:
          '0 4px 10px -2px rgba(11, 26, 43, 0.08), 0 2px 4px -2px rgba(11, 26, 43, 0.04)',
        md: '0 8px 20px -4px rgba(11, 26, 43, 0.10), 0 4px 8px -4px rgba(11, 26, 43, 0.05)',
        lg: '0 16px 32px -8px rgba(11, 26, 43, 0.14), 0 8px 16px -8px rgba(11, 26, 43, 0.06)',
        ring: '0 0 0 4px rgba(200, 166, 104, 0.25)',
        'ring-navy': '0 0 0 4px rgba(31, 58, 87, 0.18)',
      },
      ringColor: {
        DEFAULT: '#C8A668',
      },
      ringOffsetColor: {
        DEFAULT: '#FFFFFF',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        DEFAULT: '160ms',
      },
      backgroundImage: {
        'sand-gradient':
          'linear-gradient(180deg, #FAF6EE 0%, #F5EFE6 100%)',
        'navy-gradient':
          'linear-gradient(135deg, #1F3A57 0%, #0B1A2B 100%)',
        'gold-gradient':
          'linear-gradient(135deg, #D8BB7C 0%, #C8A668 50%, #A98851 100%)',
      },
    },
  },
  plugins: [],
}

export default config
