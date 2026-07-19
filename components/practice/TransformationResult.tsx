"use client";

import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useScriptPreference } from "@/lib/storage";
import { WordReplacementCard } from "@/components/practice/WordReplacementCard";
import { cn } from "@/lib/utils";
import type {
  HindiText as HindiTextValue,
  LearnedWordInput,
  PracticeResponse,
  WordReplacement,
} from "@/types";

type TransformationResultProps = {
  isWordSaved: (word: string) => boolean;
  onAudioStatusChange?: (status: "idle" | "loading" | "ready" | "playing" | "error") => void;
  onSaveWord: (word: LearnedWordInput) => void;
  result: PracticeResponse;
};

export function TransformationResult({
  isWordSaved,
  onAudioStatusChange,
  onSaveWord,
  result,
}: TransformationResultProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <VersionPanel
          label="Natural elegant"
          replacements={result.replacements}
          preload
          text={result.naturalElegantVersion}
          variant="natural"
          onAudioStatusChange={onAudioStatusChange}
        />
        <VersionPanel
          label="Scholarly"
          preload
          text={result.elevatedVersion}
          variant="elevated"
          onAudioStatusChange={onAudioStatusChange}
        />
      </div>

      <div className="space-y-3">
        <div className="motion-safe:animate-floatIn motion-safe:[animation-delay:160ms]">
          <h2 className="text-xl font-bold text-ink dark:text-white">
            Word upgrades
          </h2>
        </div>
        <div className="grid gap-3">
          {result.replacements.length > 0 ? result.replacements.map((replacement, index) => {
            const saveableWord = getSaveableWord(result, replacement);

            return (
              <WordReplacementCard
                key={`${replacement.original.roman}-${replacement.replacement.roman}`}
                revealDelay={240 + index * 80}
                replacement={replacement}
                saveableWord={saveableWord}
                isSaved={isWordSaved(saveableWord.word)}
                onSave={onSaveWord}
              />
            );
          }) : (
            <div className="rounded-2xl border border-white/60 bg-white/36 p-4 text-sm font-normal leading-7 text-zinc-600 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300">
              No specific word swaps were needed this time. The full sentence
              elegant version is still ready above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VersionPanel({
  label,
  replacements = [],
  preload = false,
  text,
  variant,
  onAudioStatusChange,
}: {
  label: string;
  onAudioStatusChange?: (status: "idle" | "loading" | "ready" | "playing" | "error") => void;
  preload?: boolean;
  replacements?: WordReplacement[];
  text: HindiTextValue;
  variant: "natural" | "elevated";
}) {
  const isScholarly = variant === "elevated";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 motion-safe:animate-floatIn",
        isScholarly
          ? "border-peacock/30 bg-peacock/10 shadow-[0_18px_42px_rgba(23,107,135,0.12)] dark:border-peacock/35 dark:bg-peacock/15"
          : "border-emerald-200/75 bg-emerald-100/45 shadow-glow dark:border-emerald-300/20 dark:bg-emerald-300/10",
      )}
      style={{ animationDelay: isScholarly ? "80ms" : "0ms" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(
          "text-xs font-bold uppercase tracking-[0.16em]",
          isScholarly ? "text-peacock dark:text-[#8ecfe3]" : "text-emerald-800 dark:text-emerald-200",
        )}>
          {label}
        </p>
        <AudioPlayer
          key={`${variant}-${text.dev}`}
          label="Listen"
          onStatusChange={onAudioStatusChange}
          preload={preload}
          text={text.dev}
          tone="primary"
          variant={variant}
        />
      </div>
      {isScholarly ? (
        <HighlightedSentence text={text} tone="scholarly" />
      ) : (
        <HighlightedSentence text={text} replacements={replacements} tone="natural" />
      )}
    </div>
  );
}

function HighlightedSentence({
  replacements = [],
  text,
  tone,
}: {
  replacements?: WordReplacement[];
  text: HindiTextValue;
  tone: "natural" | "scholarly";
}) {
  const { preference } = useScriptPreference();
  const showDev = preference !== "roman";
  const showRoman = preference !== "dev";
  const devWords = replacements.map((item) => item.replacement.dev);
  const romanWords = replacements.map((item) => item.replacement.roman);
  const sentenceTone = tone === "scholarly"
    ? "text-peacock dark:text-[#d4f1f8]"
    : "text-emerald-950 dark:text-emerald-100";

  return (
    <div className="mt-3">
      {showDev ? (
        <p lang="hi" className={cn("text-wrap-anywhere font-hindi text-3xl font-bold leading-[1.55] sm:text-4xl", sentenceTone)}>
          <HighlightedWords text={text.dev} words={devWords} />
        </p>
      ) : null}
      {showRoman ? (
        <p lang="hi-Latn" className={cn("text-wrap-anywhere text-sm leading-7 text-zinc-500 dark:text-zinc-400", showDev && "mt-1")}>
          <HighlightedWords text={text.roman} words={romanWords} />
        </p>
      ) : null}
      {text.en ? (
        <p className="mt-1 text-xs italic leading-5 text-zinc-500 dark:text-zinc-400">
          &ldquo;{text.en}&rdquo;
        </p>
      ) : null}
    </div>
  );
}

function HighlightedWords({ text, words }: { text: string; words: string[] }) {
  const uniqueWords = [...new Set(words.map((word) => word.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);

  if (uniqueWords.length === 0) {
    return text;
  }

  const expression = new RegExp(`(${uniqueWords.map(escapeRegExp).join("|")})`, "giu");
  const highlighted = new Set(uniqueWords.map((word) => word.toLocaleLowerCase()));

  return text.split(expression).map((part, index) =>
    highlighted.has(part.toLocaleLowerCase()) ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-amber-100/45 px-0.5 text-inherit underline decoration-amber-500 decoration-2 underline-offset-4 shadow-[0_5px_16px_rgba(245,158,11,0.25)] dark:bg-amber-300/15 dark:decoration-amber-300"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSaveableWord(
  result: PracticeResponse,
  replacement: WordReplacement,
): LearnedWordInput {
  return (
    result.saveableWords.find(
      (word) =>
        word.word.trim().toLocaleLowerCase() ===
        replacement.replacement.roman.trim().toLocaleLowerCase(),
    ) ?? {
      word: replacement.replacement.roman,
      wordDev: replacement.replacement.dev,
      meaning: replacement.meaning,
      simpleAlternative: replacement.original.roman,
      exampleSentence: result.naturalElegantVersion.dev,
    }
  );
}
