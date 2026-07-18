"use client";

import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { HindiText } from "@/components/hindi/HindiText";
import { EleganceScore } from "@/components/practice/EleganceScore";
import { WordReplacementCard } from "@/components/practice/WordReplacementCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useVoicePreference } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type {
  HindiText as HindiTextValue,
  LearnedWordInput,
  PracticeResponse,
  VoicePreference,
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
  const { preference: voicePreference, setVoicePreference } = useVoicePreference();

  return (
    <section className="animate-floatIn space-y-5">
      <EleganceScore
        originalScore={result.originalEleganceScore}
        improvedScore={result.improvedEleganceScore}
      />

      <VoicePreferenceControl
        preference={voicePreference}
        onChange={setVoicePreference}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <VersionPanel
          label="Natural polished"
          text={result.naturalPolishedVersion}
          tone="primary"
          variant="natural"
          autoPlay
          onAudioStatusChange={onAudioStatusChange}
          voicePreference={voicePreference}
        />
        <VersionPanel
          label="More elevated"
          text={result.elevatedVersion}
          tone="secondary"
          variant="elevated"
          onAudioStatusChange={onAudioStatusChange}
          voicePreference={voicePreference}
        />
      </div>

      <div className="rounded-2xl border border-zinc-900/8 bg-zinc-900/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
        <StatusBadge tone="gold">Feedback</StatusBadge>
        <p className="mt-3 text-wrap-anywhere text-sm font-normal leading-7 text-zinc-700 dark:text-zinc-300">
          {result.feedback}
        </p>
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
  text,
  tone,
  variant,
  autoPlay = false,
  onAudioStatusChange,
  voicePreference,
}: {
  autoPlay?: boolean;
  label: string;
  onAudioStatusChange?: (status: "idle" | "loading" | "ready" | "playing" | "error") => void;
  text: HindiTextValue;
  tone: "primary" | "secondary";
  variant: "natural" | "elevated";
  voicePreference: VoicePreference;
}) {
  const primary = tone === "primary";

  return (
    <div
      className={
        primary
          ? "rounded-2xl border border-emerald-200/75 bg-emerald-100/45 p-5 shadow-glow transition duration-200 hover:-translate-y-0.5 dark:border-emerald-300/20 dark:bg-emerald-300/10"
          : "rounded-2xl border border-white/60 bg-white/34 p-5 transition duration-200 hover:-translate-y-0.5 dark:border-white/12 dark:bg-white/5"
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
        <AudioPlayer
          autoPlay={autoPlay}
          key={`${voicePreference}-${variant}-${text.dev}`}
          label="Listen"
          onStatusChange={onAudioStatusChange}
          text={text.dev}
          variant={variant}
          voice={voicePreference}
        />
      </div>
      <HindiText
        text={text}
        className="mt-3"
        devClassName={primary ? "text-3xl font-bold leading-[1.55] text-emerald-950 sm:text-4xl dark:text-emerald-100" : "text-xl font-semibold leading-8 text-zinc-700 dark:text-zinc-300"}
      />
    </div>
  );
}

const voiceOptions: { value: VoicePreference; label: string }[] = [
  { value: "male", label: "♂" },
  { value: "female", label: "♀" },
];

function VoicePreferenceControl({
  onChange,
  preference,
}: {
  onChange: (preference: VoicePreference) => void;
  preference: VoicePreference;
}) {
  return (
    <div className="rounded-2xl border border-zinc-900/8 bg-zinc-900/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink dark:text-white">Audio voice</p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            Choose the voice that best matches the speaker. We do not infer gender
            from recordings.
          </p>
        </div>
        <div
          className="flex rounded-xl bg-zinc-900/[0.055] p-1 dark:bg-white/10"
          role="group"
          aria-label="Audio voice preference"
        >
          {voiceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={preference === option.value}
              aria-label={`${option.value === "male" ? "Male" : "Female"} voice`}
              title={`${option.value === "male" ? "Male" : "Female"} voice`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                preference === option.value
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
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
