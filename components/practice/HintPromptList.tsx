import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type HintPromptListProps = {
  disabled?: boolean;
  hints: string[];
  selectedHint: string;
  onSelect: (hint: string) => void;
};

export function HintPromptList({
  disabled = false,
  hints,
  selectedHint,
  onSelect,
}: HintPromptListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {hints.map((hint) => {
        const selected = selectedHint === hint;

        return (
          <button
            key={hint}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(hint)}
            className={cn(
              "group min-h-20 rounded-2xl border p-4 text-left text-sm font-semibold leading-7 transition focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-950",
              selected
                ? "border-amber-300/80 bg-amber-100/65 text-amber-950 shadow-glow dark:border-amber-300/30 dark:bg-amber-300/12 dark:text-amber-100"
                : "border-white/60 bg-white/40 text-zinc-700 hover:-translate-y-0.5 hover:border-amber-200 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300",
            )}
          >
            <span className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 grid size-7 shrink-0 place-items-center rounded-xl transition",
                  selected
                    ? "bg-amber-500 text-white"
                    : "bg-white/55 text-amber-700 group-hover:bg-amber-100 dark:bg-white/8 dark:text-amber-200",
                )}
              >
                <Sparkles size={15} aria-hidden="true" />
              </span>
              <span className="text-wrap-anywhere">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
