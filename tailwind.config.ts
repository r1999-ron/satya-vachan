import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Keep the current product theme consistently light across browsers.
  // Dark variants are only enabled if a future theme control adds a `.dark`
  // class explicitly, rather than following the browser/OS preference.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#171514",
        paper: "#fffaf0",
        saffron: "#f59e0b",
        rosewood: "#8f2e3b",
        peacock: "#176b87",
        sage: "#73866a",
      },
      boxShadow: {
        glass: "0 24px 80px rgba(41, 24, 18, 0.16)",
        glow: "0 0 32px rgba(245, 158, 11, 0.24)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-2%, 1%, 0) scale(1.03)" },
        },
        pageIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        cardIn: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scorePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        savePop: {
          "0%": { transform: "scale(0.97)", opacity: "0.72" },
          "60%": { transform: "scale(1.02)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.45)", opacity: "0.55" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
      animation: {
        aurora: "aurora 16s ease-in-out infinite",
        pageIn: "pageIn 420ms ease-out both",
        cardIn: "cardIn 420ms ease-out both",
        floatIn: "floatIn 500ms ease-out both",
        scorePulse: "scorePulse 1.6s ease-in-out infinite",
        savePop: "savePop 420ms ease-out both",
        shimmer: "shimmer 1.35s ease-in-out infinite",
        wave: "wave 900ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
