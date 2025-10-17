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
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
  		},
  		fontSize: {
  			'xs': ['0.75rem', { lineHeight: '1.4' }],
  			'sm': ['0.875rem', { lineHeight: '1.4' }],
  			'base': ['1rem', { lineHeight: '1.5' }],
  			'lg': ['1.125rem', { lineHeight: '1.5' }],
  			'xl': ['1.25rem', { lineHeight: '1.5' }],
  			'2xl': ['1.5rem', { lineHeight: '1.3' }],
  			'3xl': ['1.875rem', { lineHeight: '1.2' }],
  			'4xl': ['2.25rem', { lineHeight: '1.1' }],
  			'5xl': ['3rem', { lineHeight: '1' }]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'card': '1rem',
  			'card-lg': '1.5rem',
  			'section': '2rem',
  			'section-lg': '3rem',
  			'page': '2rem',
  			'page-lg': '3rem'
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
  			brand: {
  				red: {
  					50: 'hsl(0, 100%, 97%)',
  					100: 'hsl(0, 100%, 94%)',
  					200: 'hsl(0, 100%, 87%)',
  					300: 'hsl(0, 100%, 80%)',
  					400: 'hsl(0, 91%, 71%)',
  					500: 'hsl(0, 84%, 60%)',
  					600: 'hsl(0, 72%, 51%)',
  					700: 'hsl(0, 74%, 42%)',
  					800: 'hsl(0, 70%, 35%)',
  					900: 'hsl(0, 63%, 31%)',
  					950: 'hsl(0, 75%, 15%)'
  				},
  				blue: {
  					50: 'hsl(214, 100%, 97%)',
  					100: 'hsl(214, 95%, 93%)',
  					200: 'hsl(213, 97%, 87%)',
  					300: 'hsl(212, 96%, 78%)',
  					400: 'hsl(213, 94%, 68%)',
  					500: 'hsl(217, 91%, 60%)',
  					600: 'hsl(221, 83%, 53%)',
  					700: 'hsl(224, 76%, 48%)',
  					800: 'hsl(226, 71%, 40%)',
  					900: 'hsl(224, 64%, 33%)',
  					950: 'hsl(226, 55%, 21%)'
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
  			sm: 'calc(var(--radius) - 4px)'
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