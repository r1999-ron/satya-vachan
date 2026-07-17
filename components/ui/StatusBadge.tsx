import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "gold" | "green" | "blue" | "rose";
  className?: string;
};

const tones = {
  gold: "border-amber-300/70 bg-amber-100/70 text-amber-950 dark:border-amber-300/30 dark:bg-amber-300/12 dark:text-amber-100",
  green:
    "border-emerald-300/70 bg-emerald-100/70 text-emerald-950 dark:border-emerald-300/30 dark:bg-emerald-300/12 dark:text-emerald-100",
  blue: "border-sky-300/70 bg-sky-100/70 text-sky-950 dark:border-sky-300/30 dark:bg-sky-300/12 dark:text-sky-100",
  rose: "border-rose-300/70 bg-rose-100/70 text-rose-950 dark:border-rose-300/30 dark:bg-rose-300/12 dark:text-rose-100",
};

export function StatusBadge({
  children,
  tone = "gold",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
        "shadow-sm backdrop-blur-md",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
