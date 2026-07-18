"use client";

import { cn } from "@/lib/utils";
import { useScriptPreference } from "@/lib/storage";
import type { HindiText as HindiTextValue } from "@/types";

type HindiTextProps = {
  text: HindiTextValue;
  kind?: "word" | "sentence" | "inline";
  className?: string;
  devClassName?: string;
  romanClassName?: string;
  englishClassName?: string;
  showEnglish?: boolean;
};

export function HindiText({
  text,
  kind = "sentence",
  className,
  devClassName,
  romanClassName,
  englishClassName,
  showEnglish = kind === "sentence",
}: HindiTextProps) {
  const { preference } = useScriptPreference();
  const showDev = preference !== "roman";
  const showRoman = preference !== "dev";

  if (kind === "inline") {
    return (
      <span className={className}>
        {showDev ? <span lang="hi" className={cn("font-hindi", devClassName)}>{text.dev}</span> : null}
        {preference === "both" ? <span aria-hidden="true"> · </span> : null}
        {showRoman ? <span lang="hi-Latn" className={romanClassName}>{text.roman}</span> : null}
      </span>
    );
  }

  return (
    <span className={cn("block", className)}>
      {showDev ? (
        <span
          lang="hi"
          className={cn(
            "block text-wrap-anywhere font-hindi",
            kind === "word" ? "text-2xl font-bold leading-relaxed" : "text-sm font-normal leading-7",
            devClassName,
          )}
        >
          {text.dev}
        </span>
      ) : null}
      {showRoman ? (
        <span
          lang="hi-Latn"
          className={cn(
            "block text-wrap-anywhere text-zinc-500 dark:text-zinc-400",
            kind === "word" ? "mt-0.5 text-xs font-semibold" : showDev ? "mt-1 text-xs" : "text-sm font-normal leading-7",
            romanClassName,
          )}
        >
          {text.roman}
        </span>
      ) : null}
      {showEnglish && text.en ? (
        <span className={cn("mt-1 block text-xs italic leading-5 text-zinc-500 dark:text-zinc-400", englishClassName)}>
          “{text.en}”
        </span>
      ) : null}
    </span>
  );
}
