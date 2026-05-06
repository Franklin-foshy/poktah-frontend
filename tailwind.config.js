/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark theme (Login) ──────────────────
        midnight: '#050A14',
        surface:  '#0A1628',
        card:     '#0D1E35',
        teal: {
          DEFAULT: '#00E5CC',
          bright:  '#00FFE0',
          dim:     '#00B5A0',
          blue:    '#00B5FF',
        },
        silver: '#8A9BB0',
        muted:  '#4A5C72',
        // ── Light theme (Landing) ───────────────
        ink:    '#0D1117',
        slate:  '#4B5563',
        fog:    '#9CA3AF',
      },
      fontFamily: {
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
