/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--bg-surface)',
          base: 'var(--bg-base)',
          2: 'var(--bg-surface-2)',
          3: 'var(--bg-surface-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          muted: 'var(--accent-muted)',
          hover: 'var(--accent-hover)',
          glow: 'var(--accent-glow)',
          text: 'var(--accent-text)',
        },
        jee: {
          correct: 'var(--color-correct)',
          wrong: 'var(--color-wrong)',
          partial: 'var(--color-partial)',
          unattempted: 'var(--color-unattempted)',
          physics: 'var(--color-physics)',
          chemistry: 'var(--color-chemistry)',
          maths: 'var(--color-maths)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
