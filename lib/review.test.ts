import { describe, expect, it } from "vitest";
import {
  REVIEW_INTERVALS_DAYS,
  buildReviewWordEntry,
  countDueWords,
  createReviewSchedule,
  getNextDueDate,
  getRecallCue,
  gradeReviewSchedule,
  isReviewSchedule,
  isWordDue,
  normalizeReviewSchedule,
  selectDueWords,
} from "@/lib/review";
import type { LearnedWord, ReviewSchedule } from "@/types";

const TODAY = "2026-07-21";

function makeWord(overrides: Partial<LearnedWord> = {}): LearnedWord {
  return {
    id: "learned-1",
    word: "karya",
    wordDev: "कार्य",
    meaning: "work, task, or purposeful action",
    exampleSentence: "Humne yeh karya samay par poora kiya.",
    savedAt: "2026-07-01",
    source: "practice",
    ...overrides,
  };
}

function makeSchedule(overrides: Partial<ReviewSchedule> = {}): ReviewSchedule {
  return {
    wordId: "learned-1",
    dueOn: TODAY,
    stepIndex: 0,
    lapses: 0,
    reviewCount: 0,
    lastReviewedOn: null,
    ...overrides,
  };
}

describe("createReviewSchedule", () => {
  it("brings a new word back after the first interval", () => {
    expect(createReviewSchedule("learned-1", TODAY)).toEqual({
      wordId: "learned-1",
      dueOn: "2026-07-22",
      stepIndex: 0,
      lapses: 0,
      reviewCount: 0,
      lastReviewedOn: null,
    });
  });
});

describe("gradeReviewSchedule", () => {
  it("widens the interval each time the word is recalled", () => {
    let schedule = makeSchedule();

    schedule = gradeReviewSchedule(schedule, "good", TODAY);
    expect(schedule.stepIndex).toBe(1);
    expect(schedule.dueOn).toBe("2026-07-24");

    schedule = gradeReviewSchedule(schedule, "good", "2026-07-24");
    expect(schedule.stepIndex).toBe(2);
    expect(schedule.dueOn).toBe("2026-07-31");
  });

  it("stops widening at the longest interval", () => {
    const lastStepIndex = REVIEW_INTERVALS_DAYS.length - 1;
    const schedule = gradeReviewSchedule(
      makeSchedule({ stepIndex: lastStepIndex }),
      "good",
      TODAY,
    );

    expect(schedule.stepIndex).toBe(lastStepIndex);
    expect(schedule.dueOn).toBe("2026-08-25");
  });

  it("returns a missed word the same day and records the lapse", () => {
    const schedule = gradeReviewSchedule(
      makeSchedule({ stepIndex: 3, reviewCount: 4 }),
      "again",
      TODAY,
    );

    expect(schedule.dueOn).toBe(TODAY);
    expect(schedule.stepIndex).toBe(0);
    expect(schedule.lapses).toBe(1);
    expect(schedule.reviewCount).toBe(5);
    expect(schedule.lastReviewedOn).toBe(TODAY);
  });
});

describe("isWordDue", () => {
  it("treats an unscheduled word as due once it is a day old", () => {
    expect(isWordDue(makeWord({ savedAt: "2026-07-20" }), undefined, TODAY)).toBe(true);
    expect(isWordDue(makeWord({ savedAt: TODAY }), undefined, TODAY)).toBe(false);
  });

  it("follows the schedule once one exists", () => {
    expect(isWordDue(makeWord(), makeSchedule({ dueOn: "2026-07-20" }), TODAY)).toBe(true);
    expect(isWordDue(makeWord(), makeSchedule({ dueOn: "2026-07-22" }), TODAY)).toBe(false);
  });

  it("keeps a word saved today out of the queue even after grading", () => {
    const word = makeWord({ savedAt: TODAY });
    const schedule = gradeReviewSchedule(createReviewSchedule(word.id, TODAY), "good", TODAY);

    expect(isWordDue(word, schedule, TODAY)).toBe(false);
  });
});

describe("selectDueWords", () => {
  const words = [
    makeWord({ id: "a", word: "abhilasha", savedAt: "2026-07-10" }),
    makeWord({ id: "b", word: "kartavya", savedAt: "2026-07-02" }),
    makeWord({ id: "c", word: "prayojan", savedAt: TODAY }),
  ];

  it("puts the most overdue word first and leaves out words not yet due", () => {
    const due = selectDueWords(words, [], TODAY);

    expect(due.map((word) => word.id)).toEqual(["b", "a"]);
  });

  it("limits a session to the requested size", () => {
    expect(selectDueWords(words, [], TODAY, 1).map((word) => word.id)).toEqual(["b"]);
  });

  it("counts every due word regardless of session size", () => {
    expect(countDueWords(words, [], TODAY)).toBe(2);
  });

  it("orders by schedule rather than save date once scheduled", () => {
    const schedules = [
      makeSchedule({ wordId: "a", dueOn: "2026-07-15" }),
      makeSchedule({ wordId: "b", dueOn: "2026-07-19" }),
    ];

    expect(selectDueWords(words, schedules, TODAY).map((word) => word.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("breaks ties on the word itself so the order is stable", () => {
    const sameDay = [
      makeWord({ id: "z", word: "vichar", savedAt: "2026-07-05" }),
      makeWord({ id: "y", word: "anubhav", savedAt: "2026-07-05" }),
    ];

    expect(selectDueWords(sameDay, [], TODAY).map((word) => word.id)).toEqual(["y", "z"]);
  });
});

describe("getNextDueDate", () => {
  it("reports the soonest upcoming date when nothing is due", () => {
    const words = [makeWord({ id: "a" }), makeWord({ id: "b" })];
    const schedules = [
      makeSchedule({ wordId: "a", dueOn: "2026-08-01" }),
      makeSchedule({ wordId: "b", dueOn: "2026-07-25" }),
    ];

    expect(getNextDueDate(words, schedules, TODAY)).toBe("2026-07-25");
  });

  it("returns null when every word is already due", () => {
    expect(getNextDueDate([makeWord()], [makeSchedule({ dueOn: "2026-07-01" })], TODAY)).toBe(
      null,
    );
  });
});

describe("buildReviewWordEntry", () => {
  it("prefers the matching corpus entry so the grader gets full context", () => {
    const entry = buildReviewWordEntry(makeWord({ word: "कार्य" }));

    expect(entry.elevated.dev).toBe("कार्य");
    expect(entry.synonyms.length).toBeGreaterThan(0);
  });

  it("ignores a corpus entry that only matches the simple alternative", () => {
    // "saral" is a synonym inside the corpus, but grading must target the word
    // the user actually saved, not the entry that synonym belongs to.
    const entry = buildReviewWordEntry(
      makeWord({ word: "zzquux", wordDev: "ज़्ज़क्वक्स", simpleAlternative: "saral" }),
    );

    expect(entry.elevated).toEqual({ dev: "ज़्ज़क्वक्स", roman: "zzquux" });
  });

  it("falls back to what the user saved for a word outside the corpus", () => {
    const word = makeWord({
      word: "zzquux",
      wordDev: "ज़्ज़क्वक्स",
      meaning: "a word that is not in the corpus",
      simpleAlternative: "saral",
    });
    const entry = buildReviewWordEntry(word);

    expect(entry.elevated).toEqual({ dev: "ज़्ज़क्वक्स", roman: "zzquux" });
    expect(entry.englishMeaning).toBe("a word that is not in the corpus");
    expect(entry.common.dev).toBe("saral");
  });
});

describe("getRecallCue", () => {
  it("describes the word without ever naming it", () => {
    const word = makeWord({ word: "zzquux", simpleAlternative: "kaam" });
    const cue = getRecallCue(word, buildReviewWordEntry(word));

    expect(cue.meaning).toBe(word.meaning);
    expect(cue.simpleForm).toBe("kaam");
    expect(JSON.stringify(cue)).not.toContain("zzquux");
  });
});

describe("stored schedule validation", () => {
  it("rejects malformed stored entries", () => {
    expect(isReviewSchedule(makeSchedule())).toBe(true);
    expect(isReviewSchedule(null)).toBe(false);
    expect(isReviewSchedule({ ...makeSchedule(), wordId: "" })).toBe(false);
    expect(isReviewSchedule({ ...makeSchedule(), stepIndex: "2" })).toBe(false);
    expect(isReviewSchedule({ ...makeSchedule(), lastReviewedOn: 5 })).toBe(false);
  });

  it("clamps values that fall outside the interval table", () => {
    expect(
      normalizeReviewSchedule(
        makeSchedule({ stepIndex: 99, lapses: -3, reviewCount: 2.7, lastReviewedOn: "  " }),
      ),
    ).toEqual({
      wordId: "learned-1",
      dueOn: TODAY,
      stepIndex: REVIEW_INTERVALS_DAYS.length - 1,
      lapses: 0,
      reviewCount: 2,
      lastReviewedOn: null,
    });
  });
});
