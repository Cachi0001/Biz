/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(142 76% 36%)",
          50: "hsl(142 76% 96%)",
          100: "hsl(142 76% 92%)",
          200: "hsl(142 76% 84%)",
          300: "hsl(142 76% 72%)",
          400: "hsl(142 76% 56%)",
          500: "hsl(142 76% 36%)",
          600: "hsl(142 76% 28%)",
          700: "hsl(142 76% 22%)",
          800: "hsl(142 76% 18%)",
          900: "hsl(142 76% 14%)",
          950: "hsl(142 76% 8%)",
          light: "hsl(142 76% 46%)",
          dark: "hsl(142 76% 26%)",
          foreground: "hsl(0 0% 98%)",
        },
        secondary: {
          DEFAULT: "hsl(142 30% 95%)",
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
          foreground: "hsl(142 76% 36%)",
        },
        accent: {
          DEFAULT: "hsl(142 76% 36%)",
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          foreground: "hsl(0 0% 98%)",
        },
        background: "hsl(142 30% 98%)",
        foreground: "hsl(142 10% 15%)",
        muted: {
          DEFAULT: "hsl(142 30% 96%)",
          foreground: "hsl(142 10% 45%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 98%)",
        },
        border: "hsl(142 30% 90%)",
        input: "hsl(142 30% 90%)",
        ring: "hsl(142 76% 36%)",
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(142 10% 15%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(142 10% 15%)",
        },
        success: "hsl(142 76% 36%)",
        warning: '#f59e0b',
        error: '#ef4444',
        info: "hsl(142 76% 36%)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

