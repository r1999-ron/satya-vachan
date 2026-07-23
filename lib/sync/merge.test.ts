import { describe, expect, it } from "vitest";
import {
  mergeActivity,
  mergeLearnedWords,
  mergePracticeHistory,
  mergePuzzle,
  mergePuzzleStats,
  mergeReviewSchedules,
  mergeSnapshots,
  mergeStreak,
} from "@/lib/sync/merge";
import type { StateSnapshot } from "@/lib/storage";

describe("mergeLearnedWords", () => {
  it("keeps words that exist on only one side", () => {
    const merged = mergeLearnedWords(
      [{ word: "स्थिर", savedAt: "2026-07-02", meaning: "steady" }],
      [{ word: "विनम्र", savedAt: "2026-07-01", meaning: "humble" }],
    );

    expect(merged).toHaveLength(2);
    expect(merged.map((word) => (word as { word: string }).word).sort()).toEqual(
      ["विनम्र", "स्थिर"],
    );
  });

  it("deduplicates the same word regardless of case and keeps the earliest save", () => {
    const merged = mergeLearnedWords(
      [{ word: "Sthir", savedAt: "2026-07-10", meaning: "steady" }],
      [{ word: "sthir", savedAt: "2026-07-01", meaning: "steady" }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ savedAt: "2026-07-01" });
  });

  it("fills missing fields from the other side", () => {
    const merged = mergeLearnedWords(
      [{ word: "स्थिर", savedAt: "2026-07-01", meaning: "steady", exampleSentence: "" }],
      [
        {
          word: "स्थिर",
          savedAt: "2026-07-05",
          meaning: "steady",
          exampleSentence: "वह स्थिर रहा।",
        },
      ],
    );

    expect(merged[0]).toMatchObject({
      savedAt: "2026-07-01",
      exampleSentence: "वह स्थिर रहा।",
    });
  });

  it("returns newest first", () => {
    const merged = mergeLearnedWords(
      [{ word: "एक", savedAt: "2026-07-01" }],
      [{ word: "दो", savedAt: "2026-07-09" }],
    );

    expect((merged[0] as { word: string }).word).toBe("दो");
  });

  it("ignores malformed entries", () => {
    expect(mergeLearnedWords([null, 42, { word: "   " }], "nonsense")).toEqual([]);
  });
});

describe("mergeStreak", () => {
  it("unions completed days and takes the strongest counters", () => {
    const merged = mergeStreak(
      {
        currentStreak: 3,
        longestStreak: 4,
        lastCompletedDate: "2026-07-20",
        completedChallenges: ["2026-07-19", "2026-07-20"],
        restDayBank: 1,
        restDaysUsed: ["2026-07-10"],
      },
      {
        currentStreak: 5,
        longestStreak: 9,
        lastCompletedDate: "2026-07-22",
        completedChallenges: ["2026-07-21", "2026-07-22"],
        restDayBank: 2,
        restDaysUsed: ["2026-07-11"],
      },
    );

    expect(merged).toEqual({
      currentStreak: 5,
      longestStreak: 9,
      lastCompletedDate: "2026-07-22",
      completedChallenges: ["2026-07-19", "2026-07-20", "2026-07-21", "2026-07-22"],
      restDayBank: 2,
      restDaysUsed: ["2026-07-10", "2026-07-11"],
    });
  });

  it("never lets longestStreak fall below currentStreak", () => {
    const merged = mergeStreak({ currentStreak: 12, longestStreak: 2 }, {});
    expect(merged.longestStreak).toBe(12);
  });

  it("tolerates absent state on both sides", () => {
    expect(mergeStreak(undefined, null)).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      completedChallenges: [],
    });
  });
});

describe("mergePracticeHistory", () => {
  it("unions by id and sorts newest first", () => {
    const merged = mergePracticeHistory(
      [{ id: "a", savedAt: "2026-07-01" }],
      [
        { id: "b", savedAt: "2026-07-08" },
        { id: "a", savedAt: "2026-07-01" },
      ],
    );

    expect(merged).toHaveLength(2);
    expect((merged[0] as { id: string }).id).toBe("b");
  });
});

describe("mergeReviewSchedules", () => {
  it("prefers the most recently reviewed schedule", () => {
    const merged = mergeReviewSchedules(
      [{ wordId: "w1", lastReviewedOn: "2026-07-01", reviewCount: 1, stepIndex: 0 }],
      [{ wordId: "w1", lastReviewedOn: "2026-07-15", reviewCount: 3, stepIndex: 2 }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ lastReviewedOn: "2026-07-15", stepIndex: 2 });
  });

  it("breaks a same-day tie on review count", () => {
    const merged = mergeReviewSchedules(
      [{ wordId: "w1", lastReviewedOn: "2026-07-15", reviewCount: 2 }],
      [{ wordId: "w1", lastReviewedOn: "2026-07-15", reviewCount: 7 }],
    );

    expect(merged[0]).toMatchObject({ reviewCount: 7 });
  });
});

describe("mergePuzzle", () => {
  it("keeps the newer date", () => {
    const merged = mergePuzzle(
      { dateKey: "2026-07-22", results: [], completed: false },
      { dateKey: "2026-07-21", results: [{}, {}], completed: true },
    );

    expect(merged).toMatchObject({ dateKey: "2026-07-22" });
  });

  it("prefers a completed run on the same date", () => {
    const merged = mergePuzzle(
      { dateKey: "2026-07-22", results: [{}], completed: false },
      { dateKey: "2026-07-22", results: [{}, {}, {}], completed: true },
    );

    expect(merged).toMatchObject({ completed: true });
  });

  it("prefers further progress when neither is complete", () => {
    const merged = mergePuzzle(
      { dateKey: "2026-07-22", results: [{}], completed: false },
      { dateKey: "2026-07-22", results: [{}, {}], completed: false },
    );

    expect((merged as { results: unknown[] }).results).toHaveLength(2);
  });
});

describe("mergePuzzleStats", () => {
  it("takes the maximum of each counter", () => {
    expect(mergePuzzleStats({ played: 9, perfect: 1 }, { played: 4, perfect: 3 })).toEqual({
      played: 9,
      perfect: 3,
    });
  });
});

describe("mergeActivity", () => {
  it("takes the per-counter maximum so shared activity is not double counted", () => {
    const merged = mergeActivity(
      { "2026-07": { practices: 5, challenges: 2 } },
      { "2026-07": { practices: 3, challenges: 6 }, "2026-06": { practices: 1 } },
    );

    expect(merged).toEqual({
      "2026-07": { practices: 5, challenges: 6 },
      "2026-06": { practices: 1 },
    });
  });
});

describe("mergeSnapshots", () => {
  it("carries over keys present on only one side", () => {
    const local: StateSnapshot = { milestonesSeen: ["first-word"] };
    const remote: StateSnapshot = { recapSeen: "2026-06" };

    expect(mergeSnapshots(local, remote)).toEqual({
      milestonesSeen: ["first-word"],
      recapSeen: "2026-06",
    });
  });

  it("returns an empty snapshot when both sides are empty", () => {
    expect(mergeSnapshots({}, {})).toEqual({});
  });

  it("lets the local device win on display preferences", () => {
    const merged = mergeSnapshots(
      { preferences: { script: "roman" } },
      { preferences: { script: "dev" } },
    );

    expect(merged.preferences).toEqual({ script: "roman" });
  });

  it("takes the later of two date markers", () => {
    const merged = mergeSnapshots({ twist: "2026-07-20" }, { twist: "2026-07-22" });
    expect(merged.twist).toBe("2026-07-22");
  });

  it("merges a full first-sign-in snapshot without losing either side", () => {
    const local: StateSnapshot = {
      learnedWords: [{ word: "स्थिर", savedAt: "2026-07-20", meaning: "steady" }],
      streak: { currentStreak: 2, longestStreak: 2, completedChallenges: ["2026-07-20"] },
      milestonesSeen: ["first-word"],
    };
    const remote: StateSnapshot = {
      learnedWords: [{ word: "विनम्र", savedAt: "2026-07-01", meaning: "humble" }],
      streak: { currentStreak: 6, longestStreak: 6, completedChallenges: ["2026-07-01"] },
      milestonesSeen: ["streak-5"],
    };

    const merged = mergeSnapshots(local, remote);

    expect(merged.learnedWords).toHaveLength(2);
    expect(merged.streak).toMatchObject({ currentStreak: 6, longestStreak: 6 });
    expect(merged.milestonesSeen).toEqual(["first-word", "streak-5"]);
  });
});
