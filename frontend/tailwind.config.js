/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-bg': '#12141c',
        'grid-panel': '#1b1d27',
        'grid-accent': '#00e5ff',
        'grid-accent-glow': 'rgba(0, 229, 255, 0.2)',
        'grid-danger': '#ff3366',
        'grid-warning': '#ff9900',
        'grid-nominal': '#20c997',
        'grid-border': '#2d303a'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
