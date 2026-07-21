import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: "gold" | "green" | "blue" | "rose";
  className?: string;
};

const tones = {
  gold: "border-accent/45 bg-accent-soft text-content",
  green: "border-success/45 bg-success-soft text-content",
  blue: "border-secondary/45 bg-secondary-soft text-content",
  rose: "border-danger/45 bg-danger-soft text-content",
};

export function StatusBadge({
  children,
  tone = "gold",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-chip border-theme px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
