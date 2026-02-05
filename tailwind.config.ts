import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '1.5rem',
  			lg: '2rem',
  		},
  		screens: {
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1440px',
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  			mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  		},
  		fontSize: {
  			'3xs': ['0.5625rem', { lineHeight: '1.4' }], // 9px - micro labels
  			'2xs': ['0.625rem', { lineHeight: '1.4' }],  // 10px - small labels, eyebrows
  			'xs': ['0.75rem', { lineHeight: '1.4' }],
  			'sm': ['0.875rem', { lineHeight: '1.5' }],
  			'base': ['1rem', { lineHeight: '1.6' }],
  			'lg': ['1.125rem', { lineHeight: '1.5' }],
  			'xl': ['1.25rem', { lineHeight: '1.4' }],
  			'2xl': ['1.5rem', { lineHeight: '1.3' }],
  			'3xl': ['1.875rem', { lineHeight: '1.2' }],
  			'4xl': ['2.25rem', { lineHeight: '1.1' }],
  			'5xl': ['3rem', { lineHeight: '1' }],
  			'6xl': ['3.75rem', { lineHeight: '1' }],
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'card': '1rem',
  			'card-lg': '1.5rem',
  			'section': '2rem',
  			'section-lg': '3rem',
  			'page': '2rem',
  			'page-lg': '3rem',
  		},
  		maxWidth: {
  			'content': '1440px',
  			'prose': '680px',
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			/* Brand Colors: Precision Blue (primary) */
  			precision: {
  				50: '#eff6ff',
  				100: '#dbeafe',
  				200: '#bfdbfe',
  				300: '#93c5fd',
  				400: '#60a5fa',
  				500: '#3b82f6',
  				600: '#2563eb',
  				700: '#1d4ed8',
  				800: '#1e40af',
  				900: '#1e3a8a',
  				950: '#172554',
  			},
  			/* Brand Colors: Action Red (accent) */
  			action: {
  				50: '#fef2f2',
  				100: '#fee2e2',
  				200: '#fecaca',
  				300: '#fca5a5',
  				400: '#f87171',
  				500: '#ef4444',
  				600: '#dc2626',
  				700: '#b91c1c',
  				800: '#991b1b',
  				900: '#7f1d1d',
  				950: '#450a0a',
  			},
  			/* Status Colors */
  			success: {
  				DEFAULT: '#16a34a',
  				light: '#22c55e',
  				dark: '#15803d',
  			},
  			warning: {
  				DEFAULT: '#f59e0b',
  				light: '#fbbf24',
  				dark: '#d97706',
  			},
  			/* Legacy brand colors (for backward compatibility) */
  			brand: {
  				red: {
  					50: '#fef2f2',
  					100: '#fee2e2',
  					200: '#fecaca',
  					300: '#fca5a5',
  					400: '#f87171',
  					500: '#ef4444',
  					600: '#dc2626',
  					700: '#b91c1c',
  					800: '#991b1b',
  					900: '#7f1d1d',
  					950: '#450a0a',
  				},
  				blue: {
  					50: '#eff6ff',
  					100: '#dbeafe',
  					200: '#bfdbfe',
  					300: '#93c5fd',
  					400: '#60a5fa',
  					500: '#3b82f6',
  					600: '#2563eb',
  					700: '#1d4ed8',
  					800: '#1e40af',
  					900: '#1e3a8a',
  					950: '#172554',
  				}
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)',
  		},
  		boxShadow: {
  			'card': '0 8px 32px rgba(0, 0, 0, 0.04)',
  			'card-hover': '0 16px 48px rgba(30, 58, 138, 0.12), 0 8px 24px rgba(30, 58, 138, 0.08)',
  			'frosted': '0 8px 32px rgba(0, 0, 0, 0.04)',
  			'precision': '0 4px 16px rgba(30, 58, 138, 0.25), 0 2px 8px rgba(30, 58, 138, 0.15)',
  		},
  		transitionTimingFunction: {
  			'precision': 'cubic-bezier(0.4, 0, 0.2, 1)',
  			'reveal': 'cubic-bezier(0.16, 1, 0.3, 1)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config