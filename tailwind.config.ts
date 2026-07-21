import type { Config } from "tailwindcss";

/**
 * Colours resolve to CSS variables holding space-separated RGB channels, so
 * every utility keeps Tailwind's opacity modifier (`text-content/60`) while the
 * actual hue is owned by the theme blocks in `app/globals.css`.
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Dark mode is opt-in via a `.dark` class written by the theme controller;
  // it never follows the OS preference on its own.
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        compact: { raw: "(max-width: 767px) and (max-height: 720px)" },
      },
      colors: {
        canvas: token("--c-canvas"),
        elev: token("--c-elev"),
        surface: {
          DEFAULT: token("--c-surface"),
          2: token("--c-surface-2"),
          3: token("--c-surface-3"),
        },
        line: {
          DEFAULT: token("--c-border"),
          strong: token("--c-border-strong"),
        },
        content: {
          DEFAULT: token("--c-text"),
          muted: token("--c-text-muted"),
          subtle: token("--c-text-subtle"),
          invert: token("--c-text-invert"),
        },
        accent: {
          DEFAULT: token("--c-accent"),
          bright: token("--c-accent-bright"),
          soft: token("--c-accent-soft"),
          fg: token("--c-accent-fg"),
        },
        secondary: {
          DEFAULT: token("--c-secondary"),
          soft: token("--c-secondary-soft"),
          fg: token("--c-secondary-fg"),
        },
        success: {
          DEFAULT: token("--c-success"),
          soft: token("--c-success-soft"),
        },
        danger: {
          DEFAULT: token("--c-danger"),
          soft: token("--c-danger-soft"),
        },
        highlight: token("--c-highlight"),
        focus: token("--c-focus"),
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
        chip: "var(--radius-chip)",
      },
      borderWidth: {
        theme: "var(--border-w)",
        "theme-card": "var(--border-w-card)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        btn: "var(--shadow-btn)",
        pop: "var(--shadow-pop)",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-ui)", "system-ui", "sans-serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
        hindi: ["var(--font-hindi)", "var(--font-ui)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        eyebrow: "var(--tracking-eyebrow)",
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
        pipelineDot: {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.32" },
          "40%": { transform: "translateY(-3px)", opacity: "1" },
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
        pipelineDot: "pipelineDot 900ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
