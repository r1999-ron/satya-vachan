"use client";

import { motion } from "motion/react";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { ShareCardButton } from "@/components/practice/ShareCardButton";
import { useScriptPreference } from "@/lib/storage";
import { WordReplacementCard } from "@/components/practice/WordReplacementCard";
import { transitions } from "@/lib/motion";
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
          shareOriginal={result.transcript}
          onAudioStatusChange={onAudioStatusChange}
        />
        <VersionPanel
          label="Scholarly"
          replacements={result.replacements}
          text={result.elevatedVersion}
          variant="elevated"
          onAudioStatusChange={onAudioStatusChange}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-display">
          Word upgrades
        </h2>
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
            <div className="rounded-card border-theme border-line bg-surface-2 p-4 text-sm leading-7 text-content-muted">
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
  shareOriginal,
  onAudioStatusChange,
}: {
  label: string;
  onAudioStatusChange?: (status: "idle" | "loading" | "ready" | "playing" | "error") => void;
  preload?: boolean;
  replacements?: WordReplacement[];
  text: HindiTextValue;
  variant: "natural" | "elevated";
  /** When present, the panel offers a shareable card of original → this text. */
  shareOriginal?: string;
}) {
  const isScholarly = variant === "elevated";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitions.soft, delay: isScholarly ? 0.08 : 0 }}
      className={cn(
        "rounded-card border-theme p-4 sm:p-5",
        isScholarly
          ? "border-secondary/40 bg-secondary-soft"
          : "border-success/40 bg-success-soft",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={cn(
            "eyebrow",
            isScholarly ? "text-secondary" : "text-success",
          )}
        >
          {label}
        </p>
        <div className="flex items-center gap-2">
          {shareOriginal ? (
            <ShareCardButton original={shareOriginal} polished={text} />
          ) : null}
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
      </div>
      <HighlightedSentence
        text={text}
        replacements={replacements}
        tone={isScholarly ? "scholarly" : "natural"}
      />
    </motion.div>
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
  const sentenceTone = tone === "scholarly" ? "text-secondary" : "text-content";

  return (
    <div className="mt-3">
      {showDev ? (
        <p lang="hi" className={cn("text-wrap-anywhere font-hindi text-3xl font-bold leading-[1.55] sm:text-4xl", sentenceTone)}>
          <HighlightedWords text={text.dev} words={devWords} />
        </p>
      ) : null}
      {showRoman ? (
        <p lang="hi-Latn" className={cn("text-wrap-anywhere text-sm leading-7 text-content-subtle", showDev && "mt-1")}>
          <HighlightedWords text={text.roman} words={romanWords} />
        </p>
      ) : null}
      {text.en ? (
        <p className="mt-1 text-xs italic leading-5 text-content-subtle">
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
        className="rounded-sm bg-highlight/50 px-0.5 text-inherit underline decoration-accent decoration-2 underline-offset-4"
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
