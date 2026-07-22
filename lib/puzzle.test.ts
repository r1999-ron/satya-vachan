import { describe, expect, it } from "vitest";
import { wordCorpus } from "@/data/words";
import {
  PUZZLE_BLANK,
  PUZZLE_ROUND_COUNT,
  blankWord,
  getDailyPuzzle,
  getRandomPuzzle,
} from "@/lib/puzzle";

describe("puzzle", () => {
  it("produces the identical daily set for the same date key", () => {
    const first = getDailyPuzzle("2026-07-18");
    const second = getDailyPuzzle("2026-07-18");

    expect(first.map((round) => round.answerWordId)).toEqual(
      second.map((round) => round.answerWordId),
    );
    expect(first.map((round) => round.options.map((option) => option.wordId))).toEqual(
      second.map((round) => round.options.map((option) => option.wordId)),
    );
  });

  it("produces different sets on different dates", () => {
    const monday = getDailyPuzzle("2026-07-13").map((round) => round.answerWordId);
    const tuesday = getDailyPuzzle("2026-07-14").map((round) => round.answerWordId);

    expect(monday).not.toEqual(tuesday);
  });

  it("builds five rounds of four unique options that include the answer", () => {
    for (const round of getDailyPuzzle("2026-07-18")) {
      expect(round.options).toHaveLength(4);
      expect(round.options.map((option) => option.wordId)).toContain(round.answerWordId);

      const forms = round.options.map((option) => option.text.dev);
      expect(new Set(forms).size).toBe(forms.length);
    }

    expect(getDailyPuzzle("2026-07-18")).toHaveLength(PUZZLE_ROUND_COUNT);
  });

  it("masks the elevated word out of both scripts of the cloze sentence", () => {
    for (const dateKey of ["2026-07-01", "2026-07-15", "2026-07-30"]) {
      for (const round of getDailyPuzzle(dateKey)) {
        if (round.blankedSentence) {
          expect(round.blankedSentence.dev).toContain(PUZZLE_BLANK);
          expect(round.blankedSentence.dev).not.toContain(round.word.elevated.dev);
          if (round.blankedSentence.roman) {
            expect(round.blankedSentence.roman.toLocaleLowerCase()).not.toContain(
              round.word.elevated.roman.toLocaleLowerCase(),
            );
          }
        }
      }
    }
  });

  it("has cloze coverage for nearly the whole corpus", () => {
    const clozeReady = wordCorpus.filter((word) =>
      word.elevatedExample.dev.includes(word.elevated.dev),
    );

    // The fallback prompt should be the exception, not the norm.
    expect(clozeReady.length / wordCorpus.length).toBeGreaterThan(0.7);
  });

  it("returns null instead of guessing when the word is absent", () => {
    expect(blankWord("यह वाक्य कुछ और कहता है।", "कार्य")).toBeNull();
    expect(blankWord("हमने यह कार्य पूरा किया।", "कार्य")).toBe(
      `हमने यह ${PUZZLE_BLANK} पूरा किया।`,
    );
  });

  it("random puzzles stay structurally valid", () => {
    const rounds = getRandomPuzzle();

    expect(rounds).toHaveLength(PUZZLE_ROUND_COUNT);
    for (const round of rounds) {
      expect(round.options).toHaveLength(4);
      expect(round.options.map((option) => option.wordId)).toContain(round.answerWordId);
    }
  });
});
