import { Volume2 } from "lucide-react";
import { EleganceScore } from "@/components/practice/EleganceScore";
import { WordReplacementCard } from "@/components/practice/WordReplacementCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { LearnedWordInput, PracticeResponse, WordReplacement } from "@/types";

type TransformationResultProps = {
  isWordSaved: (word: string) => boolean;
  onSaveWord: (word: LearnedWordInput) => void;
  result: PracticeResponse;
};

export function TransformationResult({
  isWordSaved,
  onSaveWord,
  result,
}: TransformationResultProps) {
  return (
    <section className="animate-floatIn space-y-5">
      <EleganceScore
        originalScore={result.originalEleganceScore}
        improvedScore={result.improvedEleganceScore}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <VersionPanel
          label="Natural polished"
          text={result.naturalPolishedVersion}
          tone="primary"
        />
        <VersionPanel
          label="More elevated"
          text={result.elevatedVersion}
          tone="secondary"
        />
      </div>

      <div className="rounded-2xl border border-sky-200/70 bg-sky-100/40 p-4 dark:border-sky-300/20 dark:bg-sky-300/10">
        <StatusBadge tone="blue">Feedback</StatusBadge>
        <p className="mt-3 text-wrap-anywhere text-sm leading-7 text-sky-950 dark:text-sky-100">
          {result.feedback}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white">
            Word upgrades
          </h2>
          <p className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Save the replacements you want to keep in your personal list.
          </p>
        </div>
        <div className="grid gap-3">
          {result.replacements.map((replacement) => {
            const saveableWord = getSaveableWord(result, replacement);

            return (
              <WordReplacementCard
                key={`${replacement.original}-${replacement.replacement}`}
                replacement={replacement}
                saveableWord={saveableWord}
                isSaved={isWordSaved(saveableWord.word)}
                onSave={onSaveWord}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VersionPanel({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "primary" | "secondary";
}) {
  const primary = tone === "primary";

  return (
    <div
      className={
        primary
          ? "rounded-2xl border border-emerald-200/75 bg-emerald-100/45 p-5 shadow-glow dark:border-emerald-300/20 dark:bg-emerald-300/10"
          : "rounded-2xl border border-white/60 bg-white/34 p-5 dark:border-white/12 dark:bg-white/5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={
            primary
              ? "text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200"
              : "text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
          }
        >
          {label}
        </p>
        <button
          type="button"
          disabled
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-3 py-2 text-xs font-bold text-zinc-500 opacity-75 dark:border-white/12 dark:bg-white/8 dark:text-zinc-400"
          title="Audio playback arrives in the TTS module"
        >
          <Volume2 size={16} aria-hidden="true" />
          Listen soon
        </button>
      </div>
      <p
        className={
          primary
            ? "mt-3 text-wrap-anywhere text-lg font-bold leading-8 text-emerald-950 dark:text-emerald-100"
            : "mt-3 text-wrap-anywhere text-sm font-semibold leading-7 text-zinc-700 dark:text-zinc-300"
        }
      >
        {text}
      </p>
    </div>
  );
}

function getSaveableWord(
  result: PracticeResponse,
  replacement: WordReplacement,
): LearnedWordInput {
  return (
    result.saveableWords.find(
      (word) =>
        word.word.trim().toLocaleLowerCase() ===
        replacement.replacement.trim().toLocaleLowerCase(),
    ) ?? {
      word: replacement.replacement,
      meaning: replacement.meaning,
      simpleAlternative: replacement.original,
      exampleSentence: result.naturalPolishedVersion,
    }
  );
}
