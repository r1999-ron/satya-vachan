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
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-label={`${label}: ${clampedValue}%`}
    >
      <svg className="-rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-white/70 dark:text-white/10"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-amber-500 transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute text-sm font-bold text-ink dark:text-white">
        {clampedValue}
      </span>
    </div>
  );
}
