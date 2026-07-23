import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEYS,
  canUseLocalStorage,
  completeTodaysChallenge,
  getMonthlyActivity,
  isChallengeComplete,
  loadLearnedWords,
  loadMilestonesSeen,
  loadPracticeHistory,
  loadPreferences,
  loadPuzzleState,
  loadPuzzleStats,
  loadRecapSeenMonth,
  loadStreakState,
  markMilestoneSeen,
  markRecapSeen,
  recordActivity,
  recordPuzzleRound,
  removeLearnedWord,
  restoreLearnedWord,
  saveLearnedWord,
  savePracticeHistory,
} from "@/lib/storage";
import { seedLearnedWords } from "@/data/demo";
import type { PracticeResponse } from "@/types";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const storage = new MemoryStorage();

function installWindow(localStorage: Storage = storage) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    },
  });
}

describe("storage", () => {
  beforeEach(() => {
    storage.clear();
    installWindow();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(globalThis, "window");
  });

  it("reports localStorage availability without throwing", () => {
    expect(canUseLocalStorage()).toBe(true);

    const blockedStorage: Storage = {
      get length() {
        return storage.length;
      },
      clear: () => storage.clear(),
      getItem: (key) => storage.getItem(key),
      key: (index) => storage.key(index),
      removeItem: (key) => storage.removeItem(key),
      setItem() {
        throw new Error("blocked");
      },
    };

    installWindow(blockedStorage);

    expect(canUseLocalStorage()).toBe(false);
  });

  it("defaults to the Devanagari script", () => {
    expect(loadPreferences()).toEqual({ script: "dev" });
  });

  it("initializes learned words from the seed data when the key is missing", () => {
    expect(loadLearnedWords()).toEqual(seedLearnedWords);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.learnedWords) ?? "[]")).toEqual(
      seedLearnedWords,
    );

    storage.setItem(
      STORAGE_KEYS.learnedWords,
      JSON.stringify([
        {
          id: "  saved-1  ",
          word: "  satya  ",
          meaning: "  truth  ",
          simpleAlternative: "  sach  ",
          exampleSentence: "  Satya matters.  ",
          savedAt: "  2026-07-17  ",
          source: "manual",
        },
        { id: "invalid" },
      ]),
    );

    expect(loadLearnedWords()).toEqual([
      {
        id: "saved-1",
        word: "satya",
        wordDev: "satya",
        meaning: "truth",
        simpleAlternative: "sach",
        exampleSentence: "Satya matters.",
        savedAt: "2026-07-17",
        source: "manual",
      },
    ]);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.learnedWords) ?? "[]")).toHaveLength(1);
  });

  it("keeps starter words when the first user word is saved", () => {
    const nextWords = saveLearnedWord({
      word: "satya",
      meaning: "truth",
      exampleSentence: "Satya mahatvapurn hai.",
    });

    expect(nextWords).toHaveLength(seedLearnedWords.length + 1);
    expect(nextWords.slice(1)).toEqual(seedLearnedWords);
  });

  it("does not restore starter words after the user removes every word", () => {
    for (const word of loadLearnedWords()) {
      removeLearnedWord(word.id);
    }

    expect(loadLearnedWords()).toEqual([]);
  });

  it("saves new words and updates duplicates case-insensitively", () => {
    storage.setItem(STORAGE_KEYS.learnedWords, "[]");
    const firstSave = saveLearnedWord(
      {
        word: "  Satya  ",
        wordDev: "  सत्य  ",
        meaning: "  truth  ",
        exampleSentence: "  Satya wins.  ",
      },
      "practice",
    );

    expect(firstSave).toHaveLength(1);
    expect(firstSave[0]).toMatchObject({
      word: "Satya",
      wordDev: "सत्य",
      meaning: "truth",
      exampleSentence: "Satya wins.",
      savedAt: "2026-07-18",
      source: "practice",
    });

    const duplicateSave = saveLearnedWord({
      word: "satya",
      meaning: "new meaning",
      simpleAlternative: "sach",
      exampleSentence: "new sentence",
    });

    expect(duplicateSave).toHaveLength(1);
    expect(duplicateSave[0]).toMatchObject({
      word: "Satya",
      wordDev: "सत्य",
      meaning: "new meaning",
      simpleAlternative: "sach",
      exampleSentence: "new sentence",
    });
  });

  it("restores a removed word without changing its identity or saved date", () => {
    const original = {
      id: "learned-original",
      word: "satya",
      wordDev: "सत्य",
      meaning: "truth",
      simpleAlternative: "sach",
      exampleSentence: "Satya mahatvapurn hai.",
      savedAt: "2025-02-03",
      source: "practice" as const,
    };
    storage.setItem(STORAGE_KEYS.learnedWords, JSON.stringify([original]));

    removeLearnedWord(original.id);

    expect(restoreLearnedWord(original, 0)).toEqual([original]);
  });

  it("ignores invalid learned-word input and removes by trimmed id", () => {
    storage.setItem(STORAGE_KEYS.learnedWords, "[]");
    expect(saveLearnedWord({ word: "  ", meaning: "meaning", exampleSentence: "example" })).toEqual(
      [],
    );

    const [saved] = saveLearnedWord({
      word: "nirmal",
      meaning: "pure",
      exampleSentence: "Nirmal vichar zaroori hain.",
    });

    expect(removeLearnedWord(`  ${saved.id}  `)).toEqual([]);
  });

  it("normalizes stored streaks and completes consecutive challenges", () => {
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 1.9,
        longestStreak: 1,
        lastCompletedDate: " 2026-07-17 ",
        completedChallenges: ["2026-07-17", "2026-07-17", ""],
      }),
    );

    expect(loadStreakState()).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: "2026-07-17",
      completedChallenges: ["2026-07-17"],
      restDayBank: 0,
      restDaysUsed: [],
    });

    expect(completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"))).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      lastCompletedDate: "2026-07-18",
      completedChallenges: ["2026-07-17", "2026-07-18"],
      restDayBank: 0,
      restDaysUsed: [],
    });
    expect(isChallengeComplete(new Date("2026-07-18T12:00:00.000Z"))).toBe(true);
  });

  it("does not increment a streak twice for the same date", () => {
    completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));

    expect(completeTodaysChallenge(new Date("2026-07-18T18:00:00.000Z"))).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: "2026-07-18",
      completedChallenges: ["2026-07-18"],
      restDayBank: 0,
      restDaysUsed: [],
    });
  });

  it("notifies other streak consumers when a challenge is completed", () => {
    const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent,
      },
    });

    const streak = completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));

    const streakEvents = dispatchEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === "satya-vachan:streak");

    expect(streakEvents).toHaveLength(1);
    expect(streakEvents[0]).toMatchObject({
      type: "satya-vachan:streak",
      detail: streak,
    });
  });

  it("emits a generic storage event for every written key", () => {
    const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent,
      },
    });

    completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));

    // The cloud sync layer subscribes to this one event instead of every
    // feature-specific event, so completing a challenge must announce both the
    // streak write and the activity counter write.
    const storageKeys = dispatchEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === "satya-vachan:storage")
      .map((event) => (event as CustomEvent<{ key: string }>).detail.key);

    expect(storageKeys).toContain(STORAGE_KEYS.streak);
    expect(storageKeys).toContain(STORAGE_KEYS.activity);
  });

  it("keeps only the 60 most recent challenge completion keys", () => {
    const completedChallenges = Array.from(
      { length: 70 },
      (_, index) => `history-${index}`,
    );
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 1,
        longestStreak: 4,
        lastCompletedDate: "2026-07-17",
        completedChallenges,
      }),
    );

    expect(loadStreakState().completedChallenges).toEqual(
      completedChallenges.slice(-60),
    );
    expect(
      JSON.parse(storage.getItem(STORAGE_KEYS.streak) ?? "{}").completedChallenges,
    ).toHaveLength(60);

    const completed = completeTodaysChallenge(
      new Date("2026-07-18T12:00:00.000Z"),
    );
    expect(completed.completedChallenges).toHaveLength(60);
    expect(completed.completedChallenges.at(-1)).toBe("2026-07-18");
  });

  it("saves bounded practice history and removes corrupt entries", () => {
    const response: PracticeResponse = {
      transcript: "  original  ",
      naturalElegantVersion: { dev: "परिष्कृत", roman: "elegant", en: "elegant" },
      elevatedVersion: { dev: "उन्नत", roman: "elevated", en: "elevated" },
      replacements: [],
      saveableWords: [],
    };

    for (let index = 0; index < 12; index += 1) {
      savePracticeHistory({
        ...response,
        transcript: `sentence ${index}`,
      });
    }

    const history = loadPracticeHistory();
    expect(history).toHaveLength(10);
    expect(history[0]).toMatchObject({
      savedAt: "2026-07-18",
      transcript: "sentence 11",
      naturalElegantVersion: { dev: "परिष्कृत", roman: "elegant", en: "elegant" },
      elevatedVersion: { dev: "उन्नत", roman: "elevated", en: "elevated" },
    });

    storage.setItem(STORAGE_KEYS.practiceHistory, JSON.stringify([...history, { id: "bad" }]));
    expect(loadPracticeHistory()).toHaveLength(10);
  });

  it("earns a rest day at every 7th consecutive completion, capped at 2", () => {
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 6,
        longestStreak: 6,
        lastCompletedDate: "2026-07-17",
        completedChallenges: [],
        restDayBank: 0,
        restDaysUsed: [],
      }),
    );

    const seventh = completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));
    expect(seventh.currentStreak).toBe(7);
    expect(seventh.restDayBank).toBe(1);

    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 13,
        longestStreak: 13,
        lastCompletedDate: "2026-07-17",
        completedChallenges: [],
        restDayBank: 2,
        restDaysUsed: [],
      }),
    );

    const fourteenth = completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));
    expect(fourteenth.currentStreak).toBe(14);
    expect(fourteenth.restDayBank).toBe(2);
  });

  it("spends a rest day to bridge exactly one missed day", () => {
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 9,
        longestStreak: 9,
        lastCompletedDate: "2026-07-16",
        completedChallenges: [],
        restDayBank: 1,
        restDaysUsed: [],
      }),
    );

    const bridged = completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));

    expect(bridged.currentStreak).toBe(10);
    expect(bridged.restDayBank).toBe(0);
    expect(bridged.restDaysUsed).toEqual(["2026-07-17"]);
  });

  it("still resets the streak on a one-day gap with an empty bank or a longer gap", () => {
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 9,
        longestStreak: 9,
        lastCompletedDate: "2026-07-16",
        completedChallenges: [],
        restDayBank: 0,
        restDaysUsed: [],
      }),
    );

    expect(completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z")).currentStreak).toBe(1);

    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 9,
        longestStreak: 9,
        lastCompletedDate: "2026-07-14",
        completedChallenges: [],
        restDayBank: 2,
        restDaysUsed: [],
      }),
    );

    const reset = completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));
    expect(reset.currentStreak).toBe(1);
    expect(reset.restDayBank).toBe(2);
  });

  it("upgrades legacy streak states without rest-day fields", () => {
    storage.setItem(
      STORAGE_KEYS.streak,
      JSON.stringify({
        currentStreak: 4,
        longestStreak: 6,
        lastCompletedDate: "2026-07-17",
        completedChallenges: ["2026-07-17"],
      }),
    );

    expect(loadStreakState()).toMatchObject({
      currentStreak: 4,
      restDayBank: 0,
      restDaysUsed: [],
    });
  });

  it("records monthly activity counters and prunes old months", () => {
    completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"));
    completeTodaysChallenge(new Date("2026-07-19T12:00:00.000Z"));

    expect(getMonthlyActivity("2026-07")).toMatchObject({ challenges: 2 });

    storage.setItem(
      STORAGE_KEYS.activity,
      JSON.stringify({
        "2026-03": { practices: 1 },
        "2026-05": { practices: 2 },
        "2026-06": { practices: 3 },
        "2026-07": { practices: 4 },
      }),
    );
    recordActivity("practices");

    const stored = JSON.parse(storage.getItem(STORAGE_KEYS.activity) ?? "{}");
    expect(Object.keys(stored).sort()).toEqual(["2026-05", "2026-06", "2026-07"]);
    expect(getMonthlyActivity("2026-07").practices).toBe(5);
    expect(getMonthlyActivity("2026-03")).toMatchObject({ practices: 0 });
  });

  it("tracks puzzle rounds and counts a completed set exactly once", () => {
    const first = recordPuzzleRound({ wordId: "1", correct: true }, 2, "2026-07-18");
    expect(first.completed).toBe(false);
    expect(loadPuzzleStats()).toEqual({ played: 0, perfect: 0 });

    const second = recordPuzzleRound({ wordId: "2", correct: true }, 2, "2026-07-18");
    expect(second.completed).toBe(true);
    expect(loadPuzzleStats()).toEqual({ played: 1, perfect: 1 });
    expect(getMonthlyActivity("2026-07")).toMatchObject({
      puzzlesCompleted: 1,
      puzzlePerfects: 1,
    });

    // A completed set is frozen: extra rounds must not double-count.
    const frozen = recordPuzzleRound({ wordId: "3", correct: false }, 2, "2026-07-18");
    expect(frozen.results).toHaveLength(2);
    expect(loadPuzzleStats()).toEqual({ played: 1, perfect: 1 });

    // A new date starts fresh and an imperfect set counts played only.
    recordPuzzleRound({ wordId: "1", correct: false }, 1, "2026-07-19");
    expect(loadPuzzleStats()).toEqual({ played: 2, perfect: 1 });
    expect(loadPuzzleState("2026-07-18")).toBeNull();
  });

  it("stores milestone and recap seen-state idempotently", () => {
    expect(loadMilestonesSeen()).toEqual([]);
    markMilestoneSeen("words-10");
    markMilestoneSeen("words-10");
    expect(loadMilestonesSeen()).toEqual(["words-10"]);

    expect(loadRecapSeenMonth()).toBeNull();
    markRecapSeen("2026-06");
    markRecapSeen("2026-05");
    expect(loadRecapSeenMonth()).toBe("2026-06");
  });
});
