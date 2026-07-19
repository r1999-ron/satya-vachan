"use client";

import { Moon, Sun } from "lucide-react";

const themeStorageKey = "satya-vachan-theme";

export function ThemeToggle() {
  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    localStorage.setItem(themeStorageKey, nextIsDark ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="inline-flex size-9 items-center justify-center rounded-xl bg-zinc-900/[0.055] text-zinc-700 transition hover:bg-zinc-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef] dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 dark:focus-visible:ring-offset-zinc-950"
    >
      <Moon size={17} aria-hidden="true" className="dark:hidden" />
      <Sun size={17} aria-hidden="true" className="hidden dark:block" />
    </button>
  );
}
