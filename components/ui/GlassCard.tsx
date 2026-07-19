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
        "rounded-2xl border border-zinc-900/[0.07] bg-white/88 p-4 shadow-[0_18px_55px_rgba(36,29,20,0.07)] sm:p-5",
        "dark:border-white/12 dark:bg-zinc-950/80",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-[0_22px_60px_rgba(36,29,20,0.11)] active:translate-y-0 active:scale-[0.995]",
        className,
      )}
      {...props}
    />
  );
}
