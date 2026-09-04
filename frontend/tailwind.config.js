/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-bg': 'var(--grid-bg)',
        'grid-bg-alt': 'var(--grid-bg-alt)',
        'grid-panel': 'var(--grid-panel)',
        'grid-panel-alt': 'var(--grid-panel-alt)',
        'grid-text': 'var(--grid-text)',
        'grid-text-muted': 'var(--grid-text-muted)',
        'grid-text-dim': 'var(--grid-text-dim)',
        'grid-inverse': 'var(--grid-inverse)',
        'grid-accent': '#00e5ff',
        'grid-accent-glow': 'rgba(0, 229, 255, 0.2)',
        'grid-danger': '#ef4444', // Red
        'grid-warning': '#eab308', // Yellow
        'grid-nominal': '#22c55e', // Green
        'grid-border': 'var(--grid-border)'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
