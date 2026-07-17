import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
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
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scorePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
      },
      animation: {
        aurora: "aurora 16s ease-in-out infinite",
        floatIn: "floatIn 500ms ease-out both",
        scorePulse: "scorePulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
