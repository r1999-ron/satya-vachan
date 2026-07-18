import { HindiText } from "@/components/hindi/HindiText";
import { useScriptPreference } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue } from "@/types";

type HintPromptListProps = {
  disabled?: boolean;
  hints: HindiTextValue[];
  selectedHint: string;
  onSelect: (hint: string) => void;
};

export function HintPromptList({
  disabled = false,
  hints,
  selectedHint,
  onSelect,
}: HintPromptListProps) {
  const { preference } = useScriptPreference();

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {hints.map((hint) => {
        const selected = selectedHint === hint.dev || selectedHint === hint.roman;
        const inputValue = preference === "roman" ? hint.roman : hint.dev;

        return (
          <button
            key={hint.roman}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(inputValue)}
            className={cn(
              "max-w-full rounded-xl border px-3 py-2 text-left text-xs font-medium leading-5 transition focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-zinc-950",
              selected
                ? "border-amber-400/80 bg-amber-100/75 text-amber-950 dark:border-amber-300/30 dark:bg-amber-300/12 dark:text-amber-100"
                : "border-zinc-900/8 bg-white/55 text-zinc-700 hover:border-amber-300 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:text-zinc-300",
            )}
          >
            <HindiText text={hint} showEnglish={false} />
          </button>
        );
      })}
    </div>
  );
}
