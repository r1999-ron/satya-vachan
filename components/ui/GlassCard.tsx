import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function GlassCard({
  className,
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-shine rounded-2xl border border-white/60 bg-white/62 p-5 shadow-glass backdrop-blur-xl motion-safe:animate-cardIn",
        "dark:border-white/12 dark:bg-zinc-950/48",
        "supports-[backdrop-filter]:bg-white/48 dark:supports-[backdrop-filter]:bg-zinc-950/42",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-glow active:translate-y-0 active:scale-[0.995]",
        className,
      )}
      {...props}
    />
  );
}
