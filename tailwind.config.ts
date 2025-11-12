import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
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
				/* Semantic colors for status indicators */
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				/* AI feature colors for intelligent components */
				ai: {
					accent: 'hsl(var(--ai-accent))',
					'accent-foreground': 'hsl(var(--ai-accent-foreground))',
					glow: 'hsl(var(--ai-glow))',
					subtle: 'hsl(var(--ai-subtle))',
					border: 'hsl(var(--ai-border))'
				},
				/* Chart colors for data visualization */
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))'
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
				lg: 'var(--radius-lg)',
				md: 'var(--radius)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'var(--radius-xl)'
			},
			spacing: {
				'fluid-xs': 'var(--spacing-xs)',
				'fluid-sm': 'var(--spacing-sm)',
				'fluid-md': 'var(--spacing-md)',
				'fluid-lg': 'var(--spacing-lg)',
				'fluid-xl': 'var(--spacing-xl)',
				'fluid-2xl': 'var(--spacing-2xl)'
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
				},
				'spin-3d': {
					'0%': { transform: 'rotateY(0deg) rotateX(5deg)' },
					'100%': { transform: 'rotateY(360deg) rotateX(5deg)' }
				},
				'float-wave': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'25%': { transform: 'translateY(-20px) translateX(10px)' },
					'50%': { transform: 'translateY(0px) translateX(-10px)' },
					'75%': { transform: 'translateY(20px) translateX(5px)' }
				},
				'pulse-neon': {
					'0%, 100%': { 
						filter: 'drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor)',
						opacity: '1'
					},
					'50%': { 
						filter: 'drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor)',
						opacity: '0.8'
					}
				},
				'equalizer-dance': {
					'0%, 100%': { transform: 'scaleY(0.3)' },
					'25%': { transform: 'scaleY(1)' },
					'50%': { transform: 'scaleY(0.6)' },
					'75%': { transform: 'scaleY(0.9)' }
				},
				'particle-float': {
					'0%': { 
						transform: 'translateY(100vh) rotate(0deg)',
						opacity: '0'
					},
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { 
						transform: 'translateY(-100vh) rotate(360deg)',
						opacity: '0'
					}
				},
				'gradient-shift': {
					'0%, 100%': { 
						'background-position': '0% 50%',
						'background-size': '200% 200%'
					},
					'50%': { 
						'background-position': '100% 50%',
						'background-size': '200% 200%'
					}
				},
				'vinyl-wobble': {
					'0%, 100%': { transform: 'rotateZ(0deg)' },
					'25%': { transform: 'rotateZ(1deg)' },
					'75%': { transform: 'rotateZ(-1deg)' }
				},
				'slide-up-fade': {
					'0%': {
						transform: 'translateY(30px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'pulse-slow': {
					'0%, 100%': {
						opacity: '0.3',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.5',
						transform: 'scale(1.05)'
					}
				},
				'pulse-ring': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 currentColor',
						opacity: '1'
					},
					'50%': {
						boxShadow: '0 0 0 4px currentColor',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-3d': 'spin-3d 8s linear infinite',
				'spin-slow': 'spin 4s linear infinite',
				'float-wave': 'float-wave 6s ease-in-out infinite',
				'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
				'equalizer-dance': 'equalizer-dance 1s ease-in-out infinite',
				'particle-float': 'particle-float 15s linear infinite',
				'gradient-shift': 'gradient-shift 10s ease infinite',
				'vinyl-wobble': 'vinyl-wobble 4s ease-in-out infinite',
				'slide-up-fade': 'slide-up-fade 0.8s ease-out',
				'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
				'pulse-ring': 'pulse-ring 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
