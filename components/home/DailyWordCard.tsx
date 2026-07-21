"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SaveDailyWordButton } from "@/components/challenge/SaveDailyWordButton";
import { HindiText } from "@/components/hindi/HindiText";
import { GlassCard } from "@/components/ui/GlassCard";
import { APP_TIME_ZONE, dateFromKey } from "@/lib/dates";
import { fadeUp, transitions } from "@/lib/motion";
import { useScriptPreference } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { HindiText as HindiTextValue, ScriptPreference, WordEntry } from "@/types";

type ExampleTab = "everyday" | "improved" | "scholarly";

const EXAMPLE_TABS: { key: ExampleTab; label: string }[] = [
  { key: "everyday", label: "Everyday" },
  { key: "improved", label: "Enhanced" },
  { key: "scholarly", label: "Advanced" },
];

export function DailyWordCard({
  isToday,
  onNextDay,
  onPreviousDay,
  selectedDateKey,
  word,
}: {
  isToday: boolean;
  onNextDay: () => void;
  onPreviousDay: () => void;
  selectedDateKey: string;
  word: WordEntry;
}) {
  const [activeTab, setActiveTab] = useState<ExampleTab>("improved");
  const { preference } = useScriptPreference();

  const goToPreviousDay = () => {
    onPreviousDay();
    setActiveTab("improved");
  };

  const goToNextDay = () => {
    onNextDay();
    setActiveTab("improved");
  };

  const example =
    activeTab === "everyday"
      ? word.simpleExample
      : activeTab === "improved"
        ? word.elevatedExample
        : word.scholarExample;
  const highlightTarget = activeTab === "everyday" ? word.common : word.elevated;

  return (
    <GlassCard className="overflow-hidden p-4 sm:p-7 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-accent">
            {isToday ? "Today's word" : "Word of the day"}
          </p>
          {!isToday ? (
            <p className="mt-1 text-xs font-medium text-content-subtle">
              {formatWordDate(selectedDateKey)}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inset-panel flex items-center p-0.5">
            <motion.button
              type="button"
              onClick={goToPreviousDay}
              whileTap={{ scale: 0.9 }}
              transition={transitions.snappy}
              className="icon-btn size-8"
              aria-label="Show the previous day's word"
              title="Previous day"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={goToNextDay}
              disabled={isToday}
              whileTap={isToday ? undefined : { scale: 0.9 }}
              transition={transitions.snappy}
              className="icon-btn size-8"
              aria-label="Show the next day's word"
              title={isToday ? "Today's word" : "Next day"}
            >
              <ArrowRight size={16} aria-hidden="true" />
            </motion.button>
          </div>
          <SaveDailyWordButton word={word} />
        </div>
      </div>

      {/* Keying on the word id replays the reveal whenever the day changes. */}
      <motion.div
        key={word.id}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-4 sm:mt-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <p className="text-wrap-anywhere font-hindi text-5xl font-bold leading-[1.3] tracking-display sm:text-6xl">
            <span lang={preference === "roman" ? "hi-Latn" : "hi"}>
              {preference === "roman" ? word.elevated.roman : word.elevated.dev}
            </span>
          </p>

          <div className="min-w-0">
            <p className="eyebrow">instead of</p>
            <HindiText
              text={word.common}
              kind="inline"
              className="mt-1 block text-wrap-anywhere text-2xl font-bold text-content-muted sm:text-3xl"
            />
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-content-muted sm:text-base">
          {preference !== "roman" ? (
            <span lang="hi-Latn" className="font-semibold text-accent">
              {word.elevated.roman}
              <span aria-hidden="true" className="mx-2 text-content-subtle">
                ·
              </span>
            </span>
          ) : null}
          {word.englishMeaning}
        </p>
      </motion.div>

      <div className="mt-5 sm:mt-6">
        <div
          role="tablist"
          aria-label="Example sentences"
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-btn bg-content/5 p-1"
        >
          {EXAMPLE_TABS.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative shrink-0 rounded-chip px-3 py-1.5 text-xs font-bold transition-colors",
                  active ? "text-content" : "text-content-subtle hover:text-content",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="example-tab-pill"
                    transition={transitions.snappy}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-chip border-theme border-line bg-surface shadow-btn"
                  />
                ) : null}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${word.id}-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transitions.fade}
              className={cn(
                "rounded-btn border-theme p-3.5 sm:p-5",
                activeTab === "everyday"
                  ? "border-line bg-surface-2"
                  : "border-accent/50 bg-accent-soft",
              )}
            >
              <HighlightedSentence
                text={example}
                target={highlightTarget}
                highlight={activeTab !== "everyday"}
                preference={preference}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Synonyms</span>
          {word.synonyms.map((synonym) => (
            <span key={synonym.roman} className="chip">
              <HindiText text={synonym} kind="inline" />
            </span>
          ))}
        </div>
      </div>

      <motion.a
        href="#daily-challenge"
        onClick={(event) => {
          const recorder = document.getElementById("daily-challenge-recorder");
          if (recorder) {
            event.preventDefault();
            recorder.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }}
        whileTap={{ scale: 0.98 }}
        transition={transitions.snappy}
        className="btn btn-solid mt-5 w-full sm:w-auto"
      >
        Use it in a sentence
      </motion.a>
    </GlassCard>
  );
}

function HighlightedSentence({
  highlight,
  preference,
  target,
  text,
}: {
  highlight: boolean;
  preference: ScriptPreference;
  target: HindiTextValue;
  text: HindiTextValue;
}) {
  const showDev = preference !== "roman";
  const showRoman = preference !== "dev";

  return (
    <span className="block">
      {showDev ? (
        <span
          lang="hi"
          className="block text-wrap-anywhere font-hindi text-base font-medium leading-8 sm:text-lg"
        >
          {highlight ? highlightWord(text.dev, target.dev) : text.dev}
        </span>
      ) : null}
      {showRoman ? (
        <span
          lang="hi-Latn"
          className={cn(
            "block text-wrap-anywhere",
            showDev
              ? "mt-1 text-xs leading-5 text-content-subtle"
              : "text-base font-medium leading-8 sm:text-lg",
          )}
        >
          {highlight ? highlightWord(text.roman, target.roman, true) : text.roman}
        </span>
      ) : null}
    </span>
  );
}

function highlightWord(sentence: string, word: string, caseInsensitive = false) {
  const trimmedWord = word.trim();

  if (!trimmedWord) {
    return sentence;
  }

  const escapedWord = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(${escapedWord})`, caseInsensitive ? "gi" : "g");

  // Splitting on a single capturing group puts every match at an odd index.
  return sentence.split(matcher).map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded bg-highlight px-1 font-bold text-content"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function formatWordDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateFromKey(dateKey));
}
