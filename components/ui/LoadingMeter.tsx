import type { CSSProperties } from "react";

export function LoadingMeter() {
  return (
    <div className="mt-4 grid gap-2" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="loading-sheen h-2 rounded-full bg-white/55 dark:bg-white/10"
          style={{ "--sheen-delay": `${index * 120}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}
