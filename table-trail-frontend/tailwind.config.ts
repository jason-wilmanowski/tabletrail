import type { Config } from 'tailwindcss'

/**
 * Semantic color tokens mapped to the CSS variables defined in
 * src/index.css. Every color below resolves via `hsl(var(--x) /
 * <alpha-value>)` so Tailwind's opacity modifiers keep working normally
 * (e.g. `bg-accent/10`, `text-danger/80`) despite the indirection through
 * CSS variables.
 *
 * Components should only ever reference these semantic names (`bg-panel`,
 * `text-muted-foreground`, `border-border`, ...) — never Tailwind's
 * default palette (`neutral-900`, `red-600`, etc.) and never raw hex/HSL
 * values directly in a component.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        panel: 'hsl(var(--panel) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-hover': 'hsl(var(--surface-hover) / <alpha-value>)',

        border: 'hsl(var(--border) / <alpha-value>)',

        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',

        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',

        danger: 'hsl(var(--danger) / <alpha-value>)',
        'danger-foreground': 'hsl(var(--danger-foreground) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        'warning-foreground': 'hsl(var(--warning-foreground) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        'success-foreground': 'hsl(var(--success-foreground) / <alpha-value>)',

        ring: 'hsl(var(--ring) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config
