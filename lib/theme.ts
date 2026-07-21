"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "satya-vachan.theme";
export const THEME_EVENT = "satya-vachan:theme";

export type ThemeName = "classic" | "neo";
export type ThemeMode = "light" | "dark";

export type ThemeState = {
  name: ThemeName;
  mode: ThemeMode;
};

export const DEFAULT_THEME: ThemeState = { name: "classic", mode: "light" };

export const THEME_OPTIONS: {
  value: ThemeName;
  label: string;
  hint: string;
}[] = [
  { value: "classic", label: "Classic", hint: "Warm paper, soft edges" },
  { value: "neo", label: "Neo Brutal", hint: "Bold outlines, flat colour" },
];

function isThemeName(value: unknown): value is ThemeName {
  return value === "classic" || value === "neo";
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

/**
 * Tolerates the legacy `satya-vachan-theme` key, which stored only the string
 * "dark" | "light" before themes existed.
 */
export function readStoredTheme(): ThemeState {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (raw) {
      const parsed: unknown = JSON.parse(raw);

      if (typeof parsed === "object" && parsed !== null) {
        const { name, mode } = parsed as Record<string, unknown>;
        return {
          name: isThemeName(name) ? name : DEFAULT_THEME.name,
          mode: isThemeMode(mode) ? mode : DEFAULT_THEME.mode,
        };
      }
    }

    const legacyMode = window.localStorage.getItem("satya-vachan-theme");
    if (isThemeMode(legacyMode)) {
      return { name: DEFAULT_THEME.name, mode: legacyMode };
    }
  } catch {
    // Private-mode / disabled storage: fall through to the default theme.
  }

  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeState) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme.name;
  root.classList.toggle("dark", theme.mode === "dark");
  root.style.colorScheme = theme.mode;
}

function writeStoredTheme(theme: ThemeState) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Persisting is best-effort; the in-memory theme still applies.
  }
}

export function setTheme(theme: ThemeState) {
  applyTheme(theme);
  writeStoredTheme(theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/**
 * Reads the theme that the inline bootstrap script already applied to <html>,
 * rather than localStorage, so the first client render matches the DOM.
 */
function readAppliedTheme(): ThemeState {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  const root = document.documentElement;
  const name = root.dataset.theme;

  return {
    name: isThemeName(name) ? name : DEFAULT_THEME.name,
    mode: root.classList.contains("dark") ? "dark" : "light",
  };
}

// useSyncExternalStore compares snapshots by identity, so a fresh object every
// read would loop forever. Cache the last value and only replace it on change.
let cachedTheme: ThemeState = DEFAULT_THEME;

function getThemeSnapshot(): ThemeState {
  const applied = readAppliedTheme();

  if (applied.name !== cachedTheme.name || applied.mode !== cachedTheme.mode) {
    cachedTheme = applied;
  }

  return cachedTheme;
}

function getServerThemeSnapshot(): ThemeState {
  return DEFAULT_THEME;
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useTheme() {
  // The <html> element — already stamped by the bootstrap script — is the
  // source of truth. Reading it through an external store keeps SSR rendering
  // the default theme and lets React swap in the real one after hydration.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const selectThemeName = useCallback((name: ThemeName) => {
    setTheme({ ...readAppliedTheme(), name });
  }, []);

  const selectThemeMode = useCallback((mode: ThemeMode) => {
    setTheme({ ...readAppliedTheme(), mode });
  }, []);

  const toggleMode = useCallback(() => {
    const current = readAppliedTheme();
    setTheme({ ...current, mode: current.mode === "dark" ? "light" : "dark" });
  }, []);

  return { theme, selectThemeName, selectThemeMode, toggleMode };
}

/**
 * One-shot read of colour tokens as concrete `rgb(...)` strings. Use for
 * imperative APIs (canvas, confetti) that take colours as arguments; use
 * {@link useThemeColors} when the value must track theme changes over time.
 */
export function readThemeColors(names: readonly string[]): string[] {
  if (typeof document === "undefined") {
    return [];
  }

  const styles = getComputedStyle(document.documentElement);

  return names
    .map((name) => styles.getPropertyValue(name).trim())
    .filter(Boolean)
    .map((channels) => `rgb(${channels})`);
}

/**
 * Resolves colour tokens to concrete `rgb(...)` strings, re-reading whenever the
 * theme changes.
 *
 * Needed because a few places animate colour with Framer Motion, which
 * interpolates between real colour values and cannot tween a `var()` reference.
 * Everything that merely *sets* a colour should use a Tailwind token class
 * instead of this hook.
 *
 * @param names CSS custom property names, e.g. `["--c-accent", "--c-danger"]`.
 */
export function useThemeColors(names: readonly string[]): Record<string, string> {
  const [colors, setColors] = useState<Record<string, string>>({});
  // Names are usually an inline literal, so join them into a stable dependency
  // rather than re-running the effect on every render.
  const key = names.join(",");

  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};

      for (const name of key.split(",")) {
        const channels = styles.getPropertyValue(name).trim();
        if (channels) {
          next[name] = `rgb(${channels})`;
        }
      }

      setColors(next);
    };

    read();
    window.addEventListener(THEME_EVENT, read);
    return () => window.removeEventListener(THEME_EVENT, read);
  }, [key]);

  return colors;
}

/**
 * Runs before paint in <head> to stamp the stored theme onto <html>, avoiding a
 * flash of the default theme. Kept as a string so it can be inlined; it
 * deliberately duplicates the small amount of parsing logic above because it
 * must not depend on the bundle.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var n='classic',m='light';var raw=localStorage.getItem('${THEME_STORAGE_KEY}');if(raw){var p=JSON.parse(raw);if(p&&(p.name==='classic'||p.name==='neo'))n=p.name;if(p&&(p.mode==='light'||p.mode==='dark'))m=p.mode}else{var l=localStorage.getItem('satya-vachan-theme');if(l==='dark'||l==='light')m=l}var r=document.documentElement;r.dataset.theme=n;r.classList.toggle('dark',m==='dark');r.style.colorScheme=m}catch(e){document.documentElement.dataset.theme='classic'}})()`;
