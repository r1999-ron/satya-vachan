import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEYS,
  canUseLocalStorage,
  completeTodaysChallenge,
  isChallengeComplete,
  loadLearnedWords,
  loadPracticeHistory,
  loadPreferences,
  loadStreakState,
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

  it("defaults to both scripts", () => {
    expect(loadPreferences()).toEqual({ script: "both" });
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
    });

    expect(completeTodaysChallenge(new Date("2026-07-18T12:00:00.000Z"))).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      lastCompletedDate: "2026-07-18",
      completedChallenges: ["2026-07-17", "2026-07-18"],
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

    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0]?.[0]).toMatchObject({
      type: "satya-vachan:streak",
      detail: streak,
    });
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
});
