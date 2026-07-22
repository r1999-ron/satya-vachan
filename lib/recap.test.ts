import { describe, expect, it } from "vitest";
import { buildMonthlyRecap } from "@/lib/recap";
import type { LearnedWord, MonthlyActivity } from "@/types";

const activity: MonthlyActivity = {
  practices: 12,
  challenges: 18,
  twists: 4,
  puzzlesCompleted: 9,
  puzzlePerfects: 3,
  wordsSaved: 7,
  reviews: 15,
};

function word(id: string, savedAt: string): LearnedWord {
  return {
    id,
    word: id,
    wordDev: id,
    meaning: "meaning",
    exampleSentence: "example",
    savedAt,
    source: "practice",
  };
}

describe("recap", () => {
  it("keeps only words saved within the month, newest first", () => {
    const recap = buildMonthlyRecap(
      "2026-06",
      activity,
      [
        word("late-june", "2026-06-28"),
        word("early-june", "2026-06-02"),
        word("july", "2026-07-01"),
        word("may", "2026-05-30"),
      ],
      [],
    );

    expect(recap.savedWords.map((entry) => entry.id)).toEqual([
      "late-june",
      "early-june",
    ]);
  });

  it("finds the longest consecutive challenge run inside the month", () => {
    const recap = buildMonthlyRecap(
      "2026-06",
      activity,
      [],
      [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-10",
        "2026-06-11",
        "2026-07-01",
      ],
    );

    expect(recap.longestStreakInMonth).toBe(3);
  });

  it("reports no activity for an empty month", () => {
    const empty: MonthlyActivity = {
      practices: 0,
      challenges: 0,
      twists: 0,
      puzzlesCompleted: 0,
      puzzlePerfects: 0,
      wordsSaved: 0,
      reviews: 0,
    };

    expect(buildMonthlyRecap("2026-06", empty, [], []).hasActivity).toBe(false);
    // A saved word alone still counts as activity worth recapping.
    expect(
      buildMonthlyRecap("2026-06", empty, [word("x", "2026-06-04")], []).hasActivity,
    ).toBe(true);
  });
});
