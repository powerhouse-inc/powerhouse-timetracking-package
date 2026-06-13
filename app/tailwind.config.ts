import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#16161c",
          900: "#1b1b22",
          850: "#1f1f28",
          800: "#24242e",
          700: "#2d2d38",
          600: "#33333f",
          500: "#4a4a58",
        },
        magenta: {
          DEFAULT: "#e57cd8",
          bright: "#ff5ec7",
          deep: "#a855f7",
        },
        mist: {
          400: "#9a9aa8",
          300: "#bcbcc8",
          200: "#dadae2",
          100: "#e7e7ee",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(229,124,216,.35), 0 8px 30px -8px rgba(229,124,216,.45)",
        panel: "0 1px 0 0 rgba(255,255,255,.03) inset, 0 12px 40px -16px rgba(0,0,0,.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,94,199,.5)" },
          "100%": { boxShadow: "0 0 0 12px rgba(255,94,199,0)" },
        },
        "pulse-line": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s cubic-bezier(.2,.7,.2,1) both",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "pulse-line": "pulse-line 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
