"use client";

import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { HindiText } from "@/components/hindi/HindiText";
import { WordReplacementCard } from "@/components/practice/WordReplacementCard";
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
    <section className="animate-floatIn space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <VersionPanel
          label="Natural polished"
          preload
          text={result.naturalPolishedVersion}
          variant="natural"
          onAudioStatusChange={onAudioStatusChange}
        />
        <VersionPanel
          label="More elevated"
          preload
          text={result.elevatedVersion}
          variant="elevated"
          onAudioStatusChange={onAudioStatusChange}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white">
            Word upgrades
          </h2>
        </div>
        <div className="grid gap-3">
          {result.replacements.length > 0 ? result.replacements.map((replacement) => {
            const saveableWord = getSaveableWord(result, replacement);

            return (
              <WordReplacementCard
                key={`${replacement.original.roman}-${replacement.replacement.roman}`}
                replacement={replacement}
                saveableWord={saveableWord}
                isSaved={isWordSaved(saveableWord.word)}
                onSave={onSaveWord}
              />
            );
          }) : (
            <div className="rounded-2xl border border-white/60 bg-white/36 p-4 text-sm font-normal leading-7 text-zinc-600 dark:border-white/12 dark:bg-white/5 dark:text-zinc-300">
              No specific word swaps were needed this time. The full sentence
              polish is still ready above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VersionPanel({
  label,
  preload = false,
  text,
  variant,
  onAudioStatusChange,
}: {
  label: string;
  onAudioStatusChange?: (status: "idle" | "loading" | "ready" | "playing" | "error") => void;
  preload?: boolean;
  text: HindiTextValue;
  variant: "natural" | "elevated";
}) {
  return (
    <div className="rounded-2xl border border-emerald-200/75 bg-emerald-100/45 p-5 shadow-glow transition duration-200 hover:-translate-y-0.5 dark:border-emerald-300/20 dark:bg-emerald-300/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
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
      <HindiText
        text={text}
        className="mt-3"
        devClassName="text-3xl font-bold leading-[1.55] text-emerald-950 sm:text-4xl dark:text-emerald-100"
      />
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
        replacement.replacement.roman.trim().toLocaleLowerCase(),
    ) ?? {
      word: replacement.replacement.roman,
      wordDev: replacement.replacement.dev,
      meaning: replacement.meaning,
      simpleAlternative: replacement.original.roman,
      exampleSentence: result.naturalPolishedVersion.dev,
    }
  );
}
