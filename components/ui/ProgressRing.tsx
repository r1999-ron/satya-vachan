"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number;
  label: string;
  size?: number;
  className?: string;
};

export function ProgressRing({
  value,
  label,
  size = 80,
  className,
}: ProgressRingProps) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));

  // Spring the arc and the readout off the same value so the number never
  // disagrees with the ring mid-animation.
  const progress = useMotionValue(0);
  const springedProgress = useSpring(progress, transitions.soft);
  const dashOffset = useTransform(
    springedProgress,
    (current) => circumference - (current / 100) * circumference,
  );
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    progress.set(clampedValue);
  }, [clampedValue, progress]);

  useEffect(
    () => springedProgress.on("change", (current) => setDisplayValue(Math.round(current))),
    [springedProgress],
  );

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clampedValue}%`}
    >
      <svg className="relative -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-content/10"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          className="text-accent"
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums">{displayValue}</span>
    </div>
  );
}
