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
              "max-w-full rounded-btn border-theme px-3 py-2 text-left text-xs font-medium leading-5 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-accent bg-accent-soft text-content"
                : "border-line bg-surface text-content-muted hover:border-accent/60",
            )}
          >
            <HindiText text={hint} showEnglish={false} />
          </button>
        );
      })}
    </div>
  );
}
