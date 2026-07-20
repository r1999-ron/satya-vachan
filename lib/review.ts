import { findCorpusEntryByElevatedForm } from "@/data/words";
import { getTodayKey, shiftDateKey } from "@/lib/dates";
import { makeHindiText } from "@/lib/hindi";
import type { LearnedWord, ReviewGrade, ReviewSchedule, WordEntry } from "@/types";

/**
 * Expanding intervals, in days. A word that keeps coming back correctly moves
 * one step down the list; a word the user cannot produce drops back to step 0.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35] as const;

/** Words per session. Short enough to finish in about ninety seconds. */
export const REVIEW_SESSION_SIZE = 5;

export function createReviewSchedule(
  wordId: string,
  todayKey: string = getTodayKey(),
): ReviewSchedule {
  return {
    wordId,
    dueOn: shiftDateKey(todayKey, REVIEW_INTERVALS_DAYS[0]),
    stepIndex: 0,
    lapses: 0,
    reviewCount: 0,
    lastReviewedOn: null,
  };
}

/**
 * Applies one grading to a schedule. A missed word returns the same day so the
 * user gets another attempt soon rather than waiting out a full interval.
 */
export function gradeReviewSchedule(
  schedule: ReviewSchedule,
  grade: ReviewGrade,
  todayKey: string = getTodayKey(),
): ReviewSchedule {
  const lastStepIndex = REVIEW_INTERVALS_DAYS.length - 1;

  if (grade === "again") {
    return {
      ...schedule,
      dueOn: todayKey,
      stepIndex: 0,
      lapses: schedule.lapses + 1,
      reviewCount: schedule.reviewCount + 1,
      lastReviewedOn: todayKey,
    };
  }

  const stepIndex = Math.min(schedule.stepIndex + 1, lastStepIndex);

  return {
    ...schedule,
    dueOn: shiftDateKey(todayKey, REVIEW_INTERVALS_DAYS[stepIndex]),
    stepIndex,
    lapses: schedule.lapses,
    reviewCount: schedule.reviewCount + 1,
    lastReviewedOn: todayKey,
  };
}

/**
 * A word with no schedule yet is treated as due once it has been saved for at
 * least a day, so existing collections enter revision without a migration.
 */
export function isWordDue(
  word: LearnedWord,
  schedule: ReviewSchedule | undefined,
  todayKey: string = getTodayKey(),
) {
  if (!schedule) {
    return word.savedAt < todayKey;
  }

  return schedule.dueOn <= todayKey;
}

function dueSortKey(word: LearnedWord, schedule: ReviewSchedule | undefined) {
  // Most overdue first, then the word that has been waiting longest.
  return schedule ? schedule.dueOn : word.savedAt;
}

export function selectDueWords(
  words: LearnedWord[],
  schedules: ReviewSchedule[],
  todayKey: string = getTodayKey(),
  limit: number = REVIEW_SESSION_SIZE,
) {
  const scheduleByWordId = new Map(schedules.map((schedule) => [schedule.wordId, schedule]));

  return words
    .filter((word) => isWordDue(word, scheduleByWordId.get(word.id), todayKey))
    .sort((a, b) => {
      const keyA = dueSortKey(a, scheduleByWordId.get(a.id));
      const keyB = dueSortKey(b, scheduleByWordId.get(b.id));

      if (keyA !== keyB) {
        return keyA < keyB ? -1 : 1;
      }

      return a.word.localeCompare(b.word);
    })
    .slice(0, Math.max(0, limit));
}

export function countDueWords(
  words: LearnedWord[],
  schedules: ReviewSchedule[],
  todayKey: string = getTodayKey(),
) {
  return selectDueWords(words, schedules, todayKey, words.length).length;
}

/**
 * The next date any word becomes due, for the "nothing to revise" state.
 */
export function getNextDueDate(
  words: LearnedWord[],
  schedules: ReviewSchedule[],
  todayKey: string = getTodayKey(),
) {
  const scheduleByWordId = new Map(schedules.map((schedule) => [schedule.wordId, schedule]));
  const upcoming = words
    .map((word) => {
      const schedule = scheduleByWordId.get(word.id);
      return schedule ? schedule.dueOn : shiftDateKey(word.savedAt, REVIEW_INTERVALS_DAYS[0]);
    })
    .filter((dueOn) => dueOn > todayKey)
    .sort();

  return upcoming[0] ?? null;
}

/**
 * The challenge endpoint grades a spoken sentence against a full corpus entry.
 * Saved words carry only a fragment of that, so a matching corpus entry is
 * preferred and anything else is filled in from what the user saved.
 */
export function buildReviewWordEntry(word: LearnedWord): WordEntry {
  const corpusEntry =
    findCorpusEntryByElevatedForm(word.word) ??
    findCorpusEntryByElevatedForm(word.wordDev);

  if (corpusEntry) {
    return corpusEntry;
  }

  const elevated = makeHindiText(word.wordDev || word.word, word.word);
  const example = makeHindiText(word.exampleSentence, word.exampleSentence);

  return {
    id: word.id,
    common: word.simpleAlternative
      ? makeHindiText(word.simpleAlternative, word.simpleAlternative)
      : makeHindiText("", ""),
    elevated,
    englishMeaning: word.meaning,
    simpleExample: example,
    elevatedExample: example,
    scholarExample: example,
    synonyms: [],
    usageNote: "",
    challengePrompt: `${word.word} shabd ka prayog karte hue ek naya vaakya kahiye.`,
    starters: [],
    tags: [],
    difficulty: "medium",
  };
}

/**
 * The recall cue. It must describe the word without ever showing it, otherwise
 * the user recognises instead of producing.
 */
export function getRecallCue(word: LearnedWord, entry: WordEntry) {
  const meaning = word.meaning.trim() || entry.englishMeaning.trim();
  const simpleForm = word.simpleAlternative?.trim() || entry.common.dev.trim();

  return {
    meaning,
    simpleForm: simpleForm || null,
  };
}

export function isReviewSchedule(value: unknown): value is ReviewSchedule {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.wordId === "string" &&
    candidate.wordId.trim().length > 0 &&
    typeof candidate.dueOn === "string" &&
    candidate.dueOn.trim().length > 0 &&
    typeof candidate.stepIndex === "number" &&
    Number.isFinite(candidate.stepIndex) &&
    typeof candidate.lapses === "number" &&
    Number.isFinite(candidate.lapses) &&
    typeof candidate.reviewCount === "number" &&
    Number.isFinite(candidate.reviewCount) &&
    (candidate.lastReviewedOn === null || typeof candidate.lastReviewedOn === "string")
  );
}

export function normalizeReviewSchedule(schedule: ReviewSchedule): ReviewSchedule {
  const lastStepIndex = REVIEW_INTERVALS_DAYS.length - 1;

  return {
    wordId: schedule.wordId.trim(),
    dueOn: schedule.dueOn.trim(),
    stepIndex: Math.min(Math.max(0, Math.floor(schedule.stepIndex)), lastStepIndex),
    lapses: Math.max(0, Math.floor(schedule.lapses)),
    reviewCount: Math.max(0, Math.floor(schedule.reviewCount)),
    lastReviewedOn: schedule.lastReviewedOn?.trim() || null,
  };
}
