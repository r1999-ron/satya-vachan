import { useCallback, useEffect, useMemo, useState } from "react";
import { getSeedLearnedWords } from "@/data/demo";
import { getMonthKey, getTodayKey, shiftDateKey } from "@/lib/dates";
import type { MilestoneStats } from "@/lib/milestones";
import { buildMonthlyRecap, type MonthlyRecap } from "@/lib/recap";
import { DEFAULT_SCRIPT_PREFERENCE, isHindiText, makeHindiText } from "@/lib/hindi";
import {
  countDueWords,
  createReviewSchedule,
  getNextDueDate,
  gradeReviewSchedule,
  isReviewSchedule,
  normalizeReviewSchedule,
  selectDueWords,
} from "@/lib/review";
import type {
  LearnedWord,
  LearnedWordInput,
  MonthlyActivity,
  PracticeResponse,
  PuzzleLifetimeStats,
  PuzzleRoundResult,
  PuzzleState,
  ReviewGrade,
  ReviewSchedule,
  ScriptPreference,
  StreakState,
} from "@/types";

export const STORAGE_KEYS = {
  learnedWords: "satya-vachan.learnedWords",
  streak: "satya-vachan.streak",
  practiceHistory: "satya-vachan.practiceHistory",
  preferences: "satya-vachan.preferences",
  reviewSchedules: "satya-vachan.reviewSchedules",
  puzzle: "satya-vachan.puzzle",
  puzzleStats: "satya-vachan.puzzleStats",
  twist: "satya-vachan.twist",
  activity: "satya-vachan.activity",
  milestonesSeen: "satya-vachan.milestonesSeen",
  recapSeen: "satya-vachan.recapSeen",
} as const;

export type PracticeHistoryItem = Pick<
  PracticeResponse,
  "transcript" | "naturalElegantVersion" | "elevatedVersion"
> & {
  id: string;
  savedAt: string;
};

const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  completedChallenges: [],
  restDayBank: 0,
  restDaysUsed: [],
};

const PRACTICE_HISTORY_LIMIT = 10;
const COMPLETED_CHALLENGES_LIMIT = 60;
/** A rest day is earned every this many consecutive completions. */
const REST_DAY_EARN_INTERVAL = 7;
/** Rest days never accumulate beyond this, keeping the streak honest. */
const REST_DAY_BANK_CAP = 2;
const REST_DAYS_USED_LIMIT = 30;
const PREFERENCES_EVENT = "satya-vachan:preferences";
const STREAK_EVENT = "satya-vachan:streak";
const REVIEW_EVENT = "satya-vachan:review";
export const LEARNED_EVENT = "satya-vachan:learned";

type Preferences = {
  script: ScriptPreference;
};

export function canUseLocalStorage() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const testKey = "satya-vachan.storage-test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore secondary storage failures.
    }

    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function storageKeyExists(key: string) {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanRequired(value: string) {
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLearnedWord(value: unknown): value is LearnedWord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.word === "string" &&
    value.word.trim().length > 0 &&
    typeof value.meaning === "string" &&
    value.meaning.trim().length > 0 &&
    typeof value.exampleSentence === "string" &&
    typeof value.savedAt === "string" &&
    ["seed", "practice", "challenge", "manual", "game"].includes(String(value.source))
  );
}

function normalizeLearnedWord(word: LearnedWord): LearnedWord {
  return {
    id: cleanRequired(word.id),
    word: cleanRequired(word.word),
    wordDev: cleanRequired(word.wordDev || word.word),
    meaning: cleanRequired(word.meaning),
    simpleAlternative: cleanOptional(word.simpleAlternative),
    exampleSentence: cleanRequired(word.exampleSentence),
    savedAt: cleanRequired(word.savedAt),
    source: word.source,
  };
}

function isStreakState(value: unknown): value is StreakState {
  if (!isRecord(value)) {
    return false;
  }

  // The rest-day fields arrived after launch, so stored states without them
  // must keep validating; normalizeStreakState fills in the defaults.
  const restFieldsValid =
    (value.restDayBank === undefined ||
      (typeof value.restDayBank === "number" && Number.isFinite(value.restDayBank))) &&
    (value.restDaysUsed === undefined ||
      (Array.isArray(value.restDaysUsed) &&
        value.restDaysUsed.every((date) => typeof date === "string")));

  return (
    typeof value.currentStreak === "number" &&
    Number.isFinite(value.currentStreak) &&
    typeof value.longestStreak === "number" &&
    Number.isFinite(value.longestStreak) &&
    (value.lastCompletedDate === null || typeof value.lastCompletedDate === "string") &&
    Array.isArray(value.completedChallenges) &&
    value.completedChallenges.every((date) => typeof date === "string") &&
    restFieldsValid
  );
}

function trimCompletedChallenges(dates: string[]) {
  return Array.from(
    new Set(dates.map((date) => date.trim()).filter(Boolean)),
  ).slice(-COMPLETED_CHALLENGES_LIMIT);
}

function normalizeStreakState(streak: StreakState): StreakState {
  const completedChallenges = trimCompletedChallenges(streak.completedChallenges);
  const currentStreak = Math.max(0, Math.floor(streak.currentStreak));
  const longestStreak = Math.max(currentStreak, Math.floor(streak.longestStreak));
  const restDayBank = Math.min(
    REST_DAY_BANK_CAP,
    Math.max(0, Math.floor(streak.restDayBank ?? 0)),
  );
  const restDaysUsed = Array.from(
    new Set((streak.restDaysUsed ?? []).map((date) => date.trim()).filter(Boolean)),
  ).slice(-REST_DAYS_USED_LIMIT);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: streak.lastCompletedDate?.trim() || null,
    completedChallenges,
    restDayBank,
    restDaysUsed,
  };
}

function isPracticeHistoryItem(value: unknown): value is PracticeHistoryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.savedAt === "string" &&
    typeof value.transcript === "string" &&
    (typeof value.naturalElegantVersion === "string" || isHindiText(value.naturalElegantVersion)) &&
    (typeof value.elevatedVersion === "string" || isHindiText(value.elevatedVersion))
  );
}

function hasStoredLearnedWords() {
  return storageKeyExists(STORAGE_KEYS.learnedWords);
}

function loadStoredLearnedWords(): LearnedWord[] {
  const stored = readJson<unknown>(STORAGE_KEYS.learnedWords, []);

  if (!Array.isArray(stored)) {
    writeJson(STORAGE_KEYS.learnedWords, []);
    return [];
  }

  const validWords = stored.filter(isLearnedWord).map(normalizeLearnedWord);

  if (validWords.length !== stored.length) {
    writeJson(STORAGE_KEYS.learnedWords, validWords);
  }

  return validWords;
}

export function loadLearnedWords(): LearnedWord[] {
  if (!hasStoredLearnedWords()) {
    const seedWords = getSeedLearnedWords().map(normalizeLearnedWord);
    writeJson(STORAGE_KEYS.learnedWords, seedWords);
    return seedWords;
  }

  return loadStoredLearnedWords();
}

export function saveLearnedWord(
  input: LearnedWordInput,
  source: LearnedWord["source"] = "manual",
): LearnedWord[] {
  const word = cleanRequired(input.word);
  const suppliedWordDev = cleanOptional(input.wordDev);
  const wordDev = suppliedWordDev ?? word;
  const meaning = cleanRequired(input.meaning);

  if (!word || !meaning) {
    return loadLearnedWords();
  }

  const storedWords = loadLearnedWords();
  const duplicateIndex = storedWords.findIndex(
    (existing) => existing.word.trim().toLocaleLowerCase() === word.toLocaleLowerCase(),
  );

  if (duplicateIndex >= 0) {
    const nextWords = [...storedWords];
    const existing = nextWords[duplicateIndex];
    nextWords[duplicateIndex] = {
      ...existing,
      meaning,
      wordDev: suppliedWordDev ?? existing.wordDev,
      simpleAlternative:
        cleanOptional(input.simpleAlternative) ?? existing.simpleAlternative,
      exampleSentence:
        cleanRequired(input.exampleSentence) || existing.exampleSentence,
    };
    writeJson(STORAGE_KEYS.learnedWords, nextWords);
    dispatchLearnedEvent(nextWords);
    return nextWords;
  }

  const newWord: LearnedWord = {
    id: createId("learned"),
    word,
    wordDev,
    meaning,
    simpleAlternative: cleanOptional(input.simpleAlternative),
    exampleSentence: cleanRequired(input.exampleSentence),
    savedAt: getTodayKey(),
    source,
  };
  const nextWords = [newWord, ...storedWords];

  writeJson(STORAGE_KEYS.learnedWords, nextWords);
  recordActivity("wordsSaved");
  dispatchLearnedEvent(nextWords);
  return nextWords;
}

export function removeLearnedWord(id: string): LearnedWord[] {
  const trimmedId = id.trim();
  const currentWords = loadLearnedWords();
  const nextWords = currentWords.filter((word) => word.id !== trimmedId);

  writeJson(STORAGE_KEYS.learnedWords, nextWords);
  dispatchLearnedEvent(nextWords);
  return nextWords;
}

export function restoreLearnedWord(word: LearnedWord, index = 0): LearnedWord[] {
  if (!isLearnedWord(word)) {
    return loadLearnedWords();
  }

  const restoredWord = normalizeLearnedWord(word);
  const normalizedWord = restoredWord.word.toLocaleLowerCase();
  const currentWords = loadLearnedWords().filter(
    (existing) =>
      existing.id !== restoredWord.id &&
      existing.word.toLocaleLowerCase() !== normalizedWord,
  );
  const restoredIndex = Math.max(0, Math.min(Math.floor(index), currentWords.length));
  const nextWords = [...currentWords];
  nextWords.splice(restoredIndex, 0, restoredWord);

  writeJson(STORAGE_KEYS.learnedWords, nextWords);
  dispatchLearnedEvent(nextWords);
  return nextWords;
}

export function loadStreakState(): StreakState {
  const stored = readJson<unknown>(STORAGE_KEYS.streak, EMPTY_STREAK);

  if (!isStreakState(stored)) {
    writeJson(STORAGE_KEYS.streak, EMPTY_STREAK);
    return EMPTY_STREAK;
  }

  const normalized = normalizeStreakState(stored);

  if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
    writeJson(STORAGE_KEYS.streak, normalized);
  }

  return normalized;
}

export function completeTodaysChallenge(date: Date = new Date()): StreakState {
  const todayKey = getTodayKey(date);
  const previousState = loadStreakState();

  if (previousState.lastCompletedDate === todayKey) {
    const nextState = {
      ...previousState,
      completedChallenges: trimCompletedChallenges([
        ...previousState.completedChallenges,
        todayKey,
      ]),
    };
    writeJson(STORAGE_KEYS.streak, nextState);
    dispatchStreakEvent(nextState);
    return nextState;
  }

  const yesterdayKey = shiftDateKey(todayKey, -1);
  const dayBeforeKey = shiftDateKey(todayKey, -2);
  const continues = previousState.lastCompletedDate === yesterdayKey;
  // A banked विश्राम दिन quietly absorbs exactly one missed day; longer gaps
  // still reset, so the streak keeps meaning something.
  const useRestDay =
    !continues &&
    previousState.lastCompletedDate === dayBeforeKey &&
    previousState.restDayBank > 0;
  const currentStreak = continues || useRestDay ? previousState.currentStreak + 1 : 1;
  const earnsRestDay = currentStreak > 0 && currentStreak % REST_DAY_EARN_INTERVAL === 0;
  const restDayBank = Math.min(
    REST_DAY_BANK_CAP,
    previousState.restDayBank - (useRestDay ? 1 : 0) + (earnsRestDay ? 1 : 0),
  );
  const nextState: StreakState = {
    currentStreak,
    longestStreak: Math.max(previousState.longestStreak, currentStreak),
    lastCompletedDate: todayKey,
    completedChallenges: trimCompletedChallenges([
      ...previousState.completedChallenges,
      todayKey,
    ]),
    restDayBank,
    restDaysUsed: useRestDay
      ? [...previousState.restDaysUsed, yesterdayKey].slice(-REST_DAYS_USED_LIMIT)
      : previousState.restDaysUsed,
  };

  writeJson(STORAGE_KEYS.streak, nextState);
  recordActivity("challenges", date);
  dispatchStreakEvent(nextState);
  return nextState;
}

function dispatchStreakEvent(streak: StreakState) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STREAK_EVENT, { detail: streak }));
  }
}

function dispatchLearnedEvent(words: LearnedWord[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEARNED_EVENT, { detail: words }));
  }
}

export function isChallengeComplete(date: Date = new Date()) {
  const todayKey = getTodayKey(date);
  const streak = loadStreakState();
  return streak.lastCompletedDate === todayKey || streak.completedChallenges.includes(todayKey);
}

export function loadPracticeHistory(): PracticeHistoryItem[] {
  const stored = readJson<unknown>(STORAGE_KEYS.practiceHistory, []);

  if (!Array.isArray(stored)) {
    writeJson(STORAGE_KEYS.practiceHistory, []);
    return [];
  }

  const history = stored
    .filter(isPracticeHistoryItem)
    .map((item) => ({
      ...item,
      naturalElegantVersion:
        typeof item.naturalElegantVersion === "string"
          ? makeHindiText(item.naturalElegantVersion, item.naturalElegantVersion)
          : item.naturalElegantVersion,
      elevatedVersion:
        typeof item.elevatedVersion === "string"
          ? makeHindiText(item.elevatedVersion, item.elevatedVersion)
          : item.elevatedVersion,
    }))
    .slice(0, PRACTICE_HISTORY_LIMIT);

  if (history.length !== stored.length) {
    writeJson(STORAGE_KEYS.practiceHistory, history);
  }

  return history;
}

export function savePracticeHistory(response: PracticeResponse): PracticeHistoryItem[] {
  if (!response.transcript.trim()) {
    return loadPracticeHistory();
  }

  const item: PracticeHistoryItem = {
    id: createId("practice"),
    savedAt: getTodayKey(),
    transcript: response.transcript.trim(),
    naturalElegantVersion: response.naturalElegantVersion,
    elevatedVersion: response.elevatedVersion,
  };
  const nextHistory = [item, ...loadPracticeHistory()].slice(0, PRACTICE_HISTORY_LIMIT);

  writeJson(STORAGE_KEYS.practiceHistory, nextHistory);
  recordActivity("practices");
  return nextHistory;
}

export function useLearnedWords() {
  const [words, setWords] = useState<LearnedWord[]>([]);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setWords(loadLearnedWords());
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const saveWord = useCallback((input: LearnedWordInput, source?: LearnedWord["source"]) => {
    const nextWords = saveLearnedWord(input, source);
    setWords(nextWords);
    return nextWords;
  }, []);

  const removeWord = useCallback((id: string) => {
    const nextWords = removeLearnedWord(id);
    setWords(nextWords);
    return nextWords;
  }, []);

  const restoreWord = useCallback((word: LearnedWord, index?: number) => {
    const nextWords = restoreLearnedWord(word, index);
    setWords(nextWords);
    return nextWords;
  }, []);

  return {
    words,
    saveWord,
    removeWord,
    restoreWord,
    refreshWords: () => setWords(loadLearnedWords()),
  };
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    const syncStreak = () => {
      setStreak(loadStreakState());
      setCompletedToday(isChallengeComplete());
    };

    syncStreak();
    window.addEventListener("storage", syncStreak);
    window.addEventListener(STREAK_EVENT, syncStreak);
    return () => {
      window.removeEventListener("storage", syncStreak);
      window.removeEventListener(STREAK_EVENT, syncStreak);
    };
  }, []);

  const completeToday = useCallback(() => {
    const nextStreak = completeTodaysChallenge();
    setStreak(nextStreak);
    setCompletedToday(isChallengeComplete());
    return nextStreak;
  }, []);

  return { streak, completedToday, completeToday };
}

export function usePracticeHistory() {
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setHistory(loadPracticeHistory());
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const saveHistory = useCallback((response: PracticeResponse) => {
    const nextHistory = savePracticeHistory(response);
    setHistory(nextHistory);
    return nextHistory;
  }, []);

  return { history, saveHistory, refreshHistory: () => setHistory(loadPracticeHistory()) };
}

export function loadReviewSchedules(): ReviewSchedule[] {
  const stored = readJson<unknown>(STORAGE_KEYS.reviewSchedules, []);

  if (!Array.isArray(stored)) {
    writeJson(STORAGE_KEYS.reviewSchedules, []);
    return [];
  }

  const schedules = stored.filter(isReviewSchedule).map(normalizeReviewSchedule);

  if (schedules.length !== stored.length) {
    writeJson(STORAGE_KEYS.reviewSchedules, schedules);
  }

  return schedules;
}

/**
 * Drops schedules whose word has been removed, so a long-lived collection does
 * not accumulate orphans.
 */
function pruneReviewSchedules(schedules: ReviewSchedule[], words: LearnedWord[]) {
  const wordIds = new Set(words.map((word) => word.id));
  return schedules.filter((schedule) => wordIds.has(schedule.wordId));
}

export function recordReview(
  wordId: string,
  grade: ReviewGrade,
  date: Date = new Date(),
): ReviewSchedule[] {
  const trimmedId = wordId.trim();

  if (!trimmedId) {
    return loadReviewSchedules();
  }

  const todayKey = getTodayKey(date);
  const words = loadLearnedWords();
  const schedules = pruneReviewSchedules(loadReviewSchedules(), words);
  const existingIndex = schedules.findIndex((schedule) => schedule.wordId === trimmedId);
  const existing =
    existingIndex >= 0 ? schedules[existingIndex] : createReviewSchedule(trimmedId, todayKey);
  const graded = gradeReviewSchedule(existing, grade, todayKey);
  const nextSchedules = [...schedules];

  if (existingIndex >= 0) {
    nextSchedules[existingIndex] = graded;
  } else {
    nextSchedules.push(graded);
  }

  writeJson(STORAGE_KEYS.reviewSchedules, nextSchedules);
  recordActivity("reviews", date);
  dispatchReviewEvent();
  return nextSchedules;
}

function dispatchReviewEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REVIEW_EVENT));
  }
}

/**
 * Drives a revision session: which saved words are due today, and how grading
 * one of them feeds back into the schedule.
 */
export function useReviewQueue() {
  const [words, setWords] = useState<LearnedWord[]>([]);
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // Grading a word removes it from the live due set, so a session runs off the
  // queue captured when the data first loaded. It only changes on restart.
  const [sessionWords, setSessionWords] = useState<LearnedWord[] | null>(null);

  useEffect(() => {
    let isActive = true;

    const sync = () => {
      if (!isActive) {
        return;
      }

      const nextWords = loadLearnedWords();
      const nextSchedules = loadReviewSchedules();

      setWords(nextWords);
      setSchedules(nextSchedules);
      setSessionWords((current) => current ?? selectDueWords(nextWords, nextSchedules));
      setIsLoaded(true);
    };

    queueMicrotask(sync);
    window.addEventListener("storage", sync);
    window.addEventListener(REVIEW_EVENT, sync);

    return () => {
      isActive = false;
      window.removeEventListener("storage", sync);
      window.removeEventListener(REVIEW_EVENT, sync);
    };
  }, []);

  const gradeWord = useCallback((wordId: string, grade: ReviewGrade) => {
    const nextSchedules = recordReview(wordId, grade);
    setSchedules(nextSchedules);
    return nextSchedules;
  }, []);

  const restartSession = useCallback(() => {
    const nextWords = loadLearnedWords();
    const nextSchedules = loadReviewSchedules();
    setSessionWords(selectDueWords(nextWords, nextSchedules));
  }, []);

  const dueCount = useMemo(() => countDueWords(words, schedules), [schedules, words]);
  const nextDueDate = useMemo(() => getNextDueDate(words, schedules), [schedules, words]);

  return {
    dueCount,
    gradeWord,
    isLoaded,
    nextDueDate,
    restartSession,
    sessionWords,
    totalWords: words.length,
  };
}

function isScriptPreference(value: unknown): value is ScriptPreference {
  return value === "dev" || value === "roman" || value === "both";
}

/* ------------------------------------------------------------------ */
/* Monthly activity counters — lightweight aggregates for the recap.  */
/* ------------------------------------------------------------------ */

const ACTIVITY_MONTHS_LIMIT = 3;

const EMPTY_MONTHLY_ACTIVITY: MonthlyActivity = {
  practices: 0,
  challenges: 0,
  twists: 0,
  puzzlesCompleted: 0,
  puzzlePerfects: 0,
  wordsSaved: 0,
  reviews: 0,
};

type ActivityLog = Record<string, MonthlyActivity>;

function normalizeMonthlyActivity(value: unknown): MonthlyActivity {
  if (!isRecord(value)) {
    return { ...EMPTY_MONTHLY_ACTIVITY };
  }

  const normalized = { ...EMPTY_MONTHLY_ACTIVITY };

  for (const key of Object.keys(normalized) as (keyof MonthlyActivity)[]) {
    const counter = value[key];
    if (typeof counter === "number" && Number.isFinite(counter)) {
      normalized[key] = Math.max(0, Math.floor(counter));
    }
  }

  return normalized;
}

function loadActivityLog(): ActivityLog {
  const stored = readJson<unknown>(STORAGE_KEYS.activity, {});

  if (!isRecord(stored)) {
    return {};
  }

  const log: ActivityLog = {};

  for (const [monthKey, value] of Object.entries(stored)) {
    if (/^\d{4}-\d{2}$/.test(monthKey)) {
      log[monthKey] = normalizeMonthlyActivity(value);
    }
  }

  return log;
}

/** Counters for one month; zeros when nothing was recorded. */
export function getMonthlyActivity(monthKey: string): MonthlyActivity {
  return loadActivityLog()[monthKey] ?? { ...EMPTY_MONTHLY_ACTIVITY };
}

/**
 * Bumps one counter for the current month. Only the most recent few months are
 * kept, so the log never grows with account age.
 */
export function recordActivity(kind: keyof MonthlyActivity, date: Date = new Date()) {
  const monthKey = getMonthKey(getTodayKey(date));
  const log = loadActivityLog();
  const month = log[monthKey] ?? { ...EMPTY_MONTHLY_ACTIVITY };
  const nextLog: ActivityLog = { ...log, [monthKey]: { ...month, [kind]: month[kind] + 1 } };
  const prunedKeys = Object.keys(nextLog).sort().slice(-ACTIVITY_MONTHS_LIMIT);

  writeJson(
    STORAGE_KEYS.activity,
    Object.fromEntries(prunedKeys.map((key) => [key, nextLog[key]])),
  );
}

/* ------------------------------------------------------------------ */
/* Daily puzzle persistence — progress for today plus lifetime stats. */
/* ------------------------------------------------------------------ */

export const PUZZLE_EVENT = "satya-vachan:puzzle";

function isPuzzleRoundResult(value: unknown): value is PuzzleRoundResult {
  return (
    isRecord(value) &&
    typeof value.wordId === "string" &&
    typeof value.correct === "boolean"
  );
}

function isPuzzleState(value: unknown): value is PuzzleState {
  return (
    isRecord(value) &&
    typeof value.dateKey === "string" &&
    typeof value.completed === "boolean" &&
    Array.isArray(value.results) &&
    value.results.every(isPuzzleRoundResult)
  );
}

/** Today's puzzle progress, or null when none exists for this date yet. */
export function loadPuzzleState(dateKey: string = getTodayKey()): PuzzleState | null {
  const stored = readJson<unknown>(STORAGE_KEYS.puzzle, null);

  if (!isPuzzleState(stored) || stored.dateKey !== dateKey) {
    return null;
  }

  return stored;
}

export function loadPuzzleStats(): PuzzleLifetimeStats {
  const stored = readJson<unknown>(STORAGE_KEYS.puzzleStats, null);

  if (
    !isRecord(stored) ||
    typeof stored.played !== "number" ||
    !Number.isFinite(stored.played) ||
    typeof stored.perfect !== "number" ||
    !Number.isFinite(stored.perfect)
  ) {
    return { played: 0, perfect: 0 };
  }

  return {
    played: Math.max(0, Math.floor(stored.played)),
    perfect: Math.max(0, Math.floor(stored.perfect)),
  };
}

/**
 * Appends one answered round. Completing the final round is when the set is
 * counted: lifetime stats, monthly activity, and the puzzle event all fire
 * exactly once per date because a completed state can no longer change.
 */
export function recordPuzzleRound(
  result: PuzzleRoundResult,
  totalRounds: number,
  dateKey: string = getTodayKey(),
): PuzzleState {
  const current = loadPuzzleState(dateKey) ?? {
    dateKey,
    results: [],
    completed: false,
  };

  if (current.completed || current.results.length >= totalRounds) {
    return current;
  }

  const results = [...current.results, result];
  const completed = results.length >= totalRounds;
  const nextState: PuzzleState = { dateKey, results, completed };

  writeJson(STORAGE_KEYS.puzzle, nextState);

  if (completed) {
    const stats = loadPuzzleStats();
    const perfect = results.every((round) => round.correct);
    const nextStats: PuzzleLifetimeStats = {
      played: stats.played + 1,
      perfect: stats.perfect + (perfect ? 1 : 0),
    };

    writeJson(STORAGE_KEYS.puzzleStats, nextStats);
    recordActivity("puzzlesCompleted");
    if (perfect) {
      recordActivity("puzzlePerfects");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PUZZLE_EVENT, { detail: nextStats }));
    }
  }

  return nextState;
}

/** Whether the bonus twist has been completed for this date. */
export function isTwistCompleted(dateKey: string = getTodayKey()): boolean {
  return readJson<unknown>(STORAGE_KEYS.twist, null) === dateKey;
}

/** Marks today's twist done; counted once because repeat marks are no-ops. */
export function markTwistCompleted(dateKey: string = getTodayKey()) {
  if (isTwistCompleted(dateKey)) {
    return;
  }

  writeJson(STORAGE_KEYS.twist, dateKey);
  recordActivity("twists");
}

/* ------------------------------------------------------------------ */
/* Milestone + recap seen-state.                                       */
/* ------------------------------------------------------------------ */

export function loadMilestonesSeen(): string[] {
  const stored = readJson<unknown>(STORAGE_KEYS.milestonesSeen, []);

  if (!Array.isArray(stored) || !stored.every((id) => typeof id === "string")) {
    return [];
  }

  return stored;
}

export function markMilestoneSeen(id: string) {
  const seen = loadMilestonesSeen();

  if (!seen.includes(id)) {
    writeJson(STORAGE_KEYS.milestonesSeen, [...seen, id]);
  }
}

/** Live counters the milestone system watches. */
export function loadMilestoneStats(): MilestoneStats {
  return {
    wordsSaved: loadLearnedWords().length,
    currentStreak: loadStreakState().currentStreak,
    puzzlePerfects: loadPuzzleStats().perfect,
  };
}

/**
 * On first run, marks every already-reached milestone as seen so an existing
 * user is never retro-celebrated. Returns the effective seen list.
 */
export function initializeMilestonesSeen(reachedIds: string[]): string[] {
  if (storageKeyExists(STORAGE_KEYS.milestonesSeen)) {
    return loadMilestonesSeen();
  }

  writeJson(STORAGE_KEYS.milestonesSeen, reachedIds);
  return reachedIds;
}

/** Assembles a month's recap from all locally stored data. */
export function loadMonthlyRecap(monthKey: string): MonthlyRecap {
  return buildMonthlyRecap(
    monthKey,
    getMonthlyActivity(monthKey),
    loadLearnedWords(),
    loadStreakState().completedChallenges,
  );
}

/** The most recent recap month the user has viewed or dismissed. */
export function loadRecapSeenMonth(): string | null {
  const stored = readJson<unknown>(STORAGE_KEYS.recapSeen, null);
  return typeof stored === "string" && /^\d{4}-\d{2}$/.test(stored) ? stored : null;
}

export function markRecapSeen(monthKey: string) {
  const seen = loadRecapSeenMonth();

  if (!seen || monthKey > seen) {
    writeJson(STORAGE_KEYS.recapSeen, monthKey);
  }
}

export function loadPreferences(): Preferences {
  const stored = readJson<unknown>(STORAGE_KEYS.preferences, {});
  const script =
    isRecord(stored) && isScriptPreference(stored.script)
      ? stored.script
      : DEFAULT_SCRIPT_PREFERENCE;

  return { script };
}

export function saveScriptPreference(script: ScriptPreference) {
  const preferences = { ...loadPreferences(), script };
  writeJson(STORAGE_KEYS.preferences, preferences);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: preferences }));
  }
  return preferences;
}

export function useScriptPreference() {
  const [preference, setPreference] = useState<ScriptPreference>(DEFAULT_SCRIPT_PREFERENCE);

  useEffect(() => {
    const syncPreference = () => setPreference(loadPreferences().script);
    syncPreference();
    window.addEventListener("storage", syncPreference);
    window.addEventListener(PREFERENCES_EVENT, syncPreference);
    return () => {
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener(PREFERENCES_EVENT, syncPreference);
    };
  }, []);

  const setScriptPreference = useCallback((script: ScriptPreference) => {
    saveScriptPreference(script);
    setPreference(script);
  }, []);

  return { preference, setScriptPreference };
}
