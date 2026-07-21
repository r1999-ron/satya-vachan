"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLMotionProps<"div"> & {
  interactive?: boolean;
  /** Set false when a parent already orchestrates this card's entrance. */
  animateIn?: boolean;
};

/**
 * The app's primary surface. Its border, radius and shadow all come from theme
 * tokens via the `.card` class, so Classic renders a hairline card with a soft
 * glow and Neo Brutal renders a 3px outline with a hard offset shadow — from
 * the same markup.
 */
export function GlassCard({
  className,
  interactive = false,
  animateIn = true,
  ...props
}: GlassCardProps) {
  const entrance = animateIn
    ? ({ variants: fadeUp, initial: "hidden", animate: "visible" } as const)
    : {};

  return (
    <motion.div
      {...entrance}
      className={cn(
        "card p-4 sm:p-5",
        interactive && "card-interactive cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
