"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";
import { scaleIn, transitions } from "@/lib/motion";
import { THEME_OPTIONS, useTheme, type ThemeMode, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Swatch triplets mirror the token blocks in globals.css. */
const THEME_PREVIEW: Record<ThemeName, { light: string[]; dark: string[] }> = {
  classic: {
    light: ["#F7F3EA", "#C2710C", "#176B87"],
    dark: ["#1E1A16", "#F0B32C", "#5EB8D4"],
  },
  neo: {
    light: ["#FFF7E6", "#FFB800", "#0B7FA8"],
    dark: ["#201E1A", "#FFC530", "#3FD0F0"],
  },
};

const MODE_OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme, selectThemeName, selectThemeMode } = useTheme();

  const close = useCallback(() => setIsOpen(false), []);
  useDismissOnOutside(containerRef, isOpen, close);

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Change appearance"
        title="Change appearance"
        whileTap={{ scale: 0.92 }}
        transition={transitions.snappy}
        className="icon-btn size-9"
      >
        <Palette size={17} aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            role="dialog"
            aria-label="Appearance"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top right" }}
            className="popover absolute right-0 top-11 z-50 w-64 p-3"
          >
            <p className="eyebrow">Theme</p>
            <div className="mt-2 space-y-1.5">
              {THEME_OPTIONS.map((option) => {
                const active = theme.name === option.value;
                const swatches = THEME_PREVIEW[option.value][theme.mode];

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectThemeName(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-btn border-theme p-2 text-left transition",
                      active
                        ? "border-line bg-accent-soft"
                        : "border-transparent hover:bg-content/5",
                    )}
                  >
                    <span className="flex shrink-0 items-center -space-x-1.5">
                      {swatches.map((color) => (
                        <span
                          key={color}
                          aria-hidden="true"
                          className="size-4 rounded-full border border-line/60"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">
                        {option.label}
                      </span>
                      <span className="block truncate text-[11px] text-content-subtle">
                        {option.hint}
                      </span>
                    </span>
                    {active ? (
                      <Check size={14} aria-hidden="true" className="shrink-0 text-accent" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <p className="eyebrow mt-4">Mode</p>
            <div
              role="group"
              aria-label="Colour mode"
              className="mt-2 grid grid-cols-2 gap-1 rounded-btn bg-content/5 p-1"
            >
              {MODE_OPTIONS.map(({ value, label, Icon }) => {
                const active = theme.mode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectThemeMode(value)}
                    aria-pressed={active}
                    className={cn(
                      "relative inline-flex items-center justify-center gap-1.5 rounded-chip px-2 py-1.5 text-xs font-bold transition",
                      active ? "text-content" : "text-content-subtle hover:text-content",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="theme-mode-pill"
                        transition={transitions.snappy}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-chip border-theme border-line bg-surface shadow-btn"
                      />
                    ) : null}
                    <span className="relative inline-flex items-center gap-1.5">
                      <Icon size={13} aria-hidden="true" />
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
