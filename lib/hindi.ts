import type { HindiText, ScriptPreference } from "@/types";

export const DEFAULT_SCRIPT_PREFERENCE: ScriptPreference = "dev";

export function isHindiText(value: unknown): value is HindiText {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<HindiText>;
  return typeof candidate.dev === "string" && candidate.dev.trim().length > 0
    && typeof candidate.roman === "string" && candidate.roman.trim().length > 0
    && (candidate.en === undefined || typeof candidate.en === "string");
}

export function makeHindiText(dev: string, roman: string, en?: string): HindiText {
  const english = en?.trim();
  return {
    dev: dev.trim(),
    roman: roman.trim(),
    ...(english ? { en: english } : {}),
  };
}

export function textForPreference(text: HindiText, preference: ScriptPreference) {
  return preference === "roman" ? text.roman : text.dev;
}

export function hindiTextSearchValue(text: HindiText) {
  return [text.dev, text.roman, text.en].filter(Boolean).join(" ");
}

export function hasDevanagari(value: string) {
  return /[\u0900-\u097f]/u.test(value);
}
