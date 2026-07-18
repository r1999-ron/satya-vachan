import { useCallback, useEffect, useState } from "react";
import { getSeedLearnedWords } from "@/data/demo";
import { getTodayKey } from "@/lib/dates";
import { DEFAULT_SCRIPT_PREFERENCE, isHindiText, makeHindiText } from "@/lib/hindi";
import type {
  LearnedWord,
  LearnedWordInput,
  PracticeResponse,
  ScriptPreference,
  StreakState,
} from "@/types";

export const STORAGE_KEYS = {
  learnedWords: "satya-vachan.learnedWords",
  streak: "satya-vachan.streak",
  practiceHistory: "satya-vachan.practiceHistory",
  preferences: "satya-vachan.preferences",
} as const;

export type PracticeHistoryItem = Pick<
  PracticeResponse,
  "transcript" | "naturalPolishedVersion" | "elevatedVersion" | "improvedEleganceScore"
> & {
  id: string;
  savedAt: string;
};

const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  completedChallenges: [],
};

const PRACTICE_HISTORY_LIMIT = 10;
const PREFERENCES_EVENT = "satya-vachan:preferences";

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
    ["seed", "practice", "challenge", "manual"].includes(String(value.source))
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

  return (
    typeof value.currentStreak === "number" &&
    Number.isFinite(value.currentStreak) &&
    typeof value.longestStreak === "number" &&
    Number.isFinite(value.longestStreak) &&
    (value.lastCompletedDate === null || typeof value.lastCompletedDate === "string") &&
    Array.isArray(value.completedChallenges) &&
    value.completedChallenges.every((date) => typeof date === "string")
  );
}

function normalizeStreakState(streak: StreakState): StreakState {
  const completedChallenges = Array.from(
    new Set(streak.completedChallenges.map((date) => date.trim()).filter(Boolean)),
  );
  const currentStreak = Math.max(0, Math.floor(streak.currentStreak));
  const longestStreak = Math.max(currentStreak, Math.floor(streak.longestStreak));

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: streak.lastCompletedDate?.trim() || null,
    completedChallenges,
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
    (typeof value.naturalPolishedVersion === "string" || isHindiText(value.naturalPolishedVersion)) &&
    (typeof value.elevatedVersion === "string" || isHindiText(value.elevatedVersion)) &&
    typeof value.improvedEleganceScore === "number"
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
  const wordDev = cleanRequired(input.wordDev || input.word);
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
      meaning: existing.meaning || meaning,
      wordDev: existing.wordDev || wordDev,
      simpleAlternative: existing.simpleAlternative || cleanOptional(input.simpleAlternative),
      exampleSentence: existing.exampleSentence || cleanRequired(input.exampleSentence),
    };
    writeJson(STORAGE_KEYS.learnedWords, nextWords);
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
  return nextWords;
}

export function removeLearnedWord(id: string): LearnedWord[] {
  const trimmedId = id.trim();
  const currentWords = loadLearnedWords();
  const nextWords = currentWords.filter((word) => word.id !== trimmedId);

  writeJson(STORAGE_KEYS.learnedWords, nextWords);
  return nextWords;
}

export function loadStreakState(): StreakState {
  const stored = readJson<unknown>(STORAGE_KEYS.streak, EMPTY_STREAK);

  if (!isStreakState(stored)) {
    writeJson(STORAGE_KEYS.streak, EMPTY_STREAK);
    return EMPTY_STREAK;
  }

  return normalizeStreakState(stored);
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getTodayKey(date);
}

export function completeTodaysChallenge(date: Date = new Date()): StreakState {
  const todayKey = getTodayKey(date);
  const previousState = loadStreakState();

  if (previousState.lastCompletedDate === todayKey) {
    const nextState = {
      ...previousState,
      completedChallenges: previousState.completedChallenges.includes(todayKey)
        ? previousState.completedChallenges
        : [...previousState.completedChallenges, todayKey],
    };
    writeJson(STORAGE_KEYS.streak, nextState);
    return nextState;
  }

  const yesterdayKey = getPreviousDateKey(todayKey);
  const currentStreak =
    previousState.lastCompletedDate === yesterdayKey ? previousState.currentStreak + 1 : 1;
  const nextState: StreakState = {
    currentStreak,
    longestStreak: Math.max(previousState.longestStreak, currentStreak),
    lastCompletedDate: todayKey,
    completedChallenges: previousState.completedChallenges.includes(todayKey)
      ? previousState.completedChallenges
      : [...previousState.completedChallenges, todayKey],
  };

  writeJson(STORAGE_KEYS.streak, nextState);
  return nextState;
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
      naturalPolishedVersion:
        typeof item.naturalPolishedVersion === "string"
          ? makeHindiText(item.naturalPolishedVersion, item.naturalPolishedVersion)
          : item.naturalPolishedVersion,
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
    naturalPolishedVersion: response.naturalPolishedVersion,
    elevatedVersion: response.elevatedVersion,
    improvedEleganceScore: response.improvedEleganceScore,
  };
  const nextHistory = [item, ...loadPracticeHistory()].slice(0, PRACTICE_HISTORY_LIMIT);

  writeJson(STORAGE_KEYS.practiceHistory, nextHistory);
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

  return { words, saveWord, removeWord, refreshWords: () => setWords(loadLearnedWords()) };
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setStreak(loadStreakState());
        setCompletedToday(isChallengeComplete());
      }
    });

    return () => {
      isActive = false;
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

function isScriptPreference(value: unknown): value is ScriptPreference {
  return value === "dev" || value === "roman" || value === "both";
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
