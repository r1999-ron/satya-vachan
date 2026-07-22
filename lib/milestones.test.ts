import { describe, expect, it } from "vitest";
import {
  findNewMilestone,
  reachedMilestoneIds,
  type MilestoneStats,
} from "@/lib/milestones";

const none: MilestoneStats = { wordsSaved: 0, currentStreak: 0, puzzlePerfects: 0 };

describe("milestones", () => {
  it("returns nothing when no threshold is reached", () => {
    expect(findNewMilestone({ ...none, wordsSaved: 9 }, [])).toBeNull();
  });

  it("fires a milestone once and then stays quiet after it is seen", () => {
    const stats = { ...none, wordsSaved: 12 };
    const first = findNewMilestone(stats, []);

    expect(first?.id).toBe("words-10");
    expect(findNewMilestone(stats, ["words-10"])).toBeNull();
  });

  it("celebrates the highest newly-crossed milestone on a big jump", () => {
    // A fresh import of 60 words should honour fifty, not ten.
    expect(findNewMilestone({ ...none, wordsSaved: 60 }, [])?.id).toBe("words-50");
  });

  it("tracks streak and puzzle milestones independently", () => {
    expect(findNewMilestone({ ...none, currentStreak: 7 }, [])?.id).toBe("streak-7");
    expect(findNewMilestone({ ...none, puzzlePerfects: 1 }, [])?.id).toBe(
      "puzzle-perfect-1",
    );
  });

  it("lists every reached id for seeding seen-state", () => {
    expect(reachedMilestoneIds({ wordsSaved: 26, currentStreak: 8, puzzlePerfects: 2 })).toEqual(
      expect.arrayContaining(["words-10", "words-25", "streak-7", "puzzle-perfect-1"]),
    );
    expect(reachedMilestoneIds({ wordsSaved: 26, currentStreak: 8, puzzlePerfects: 2 })).not.toContain(
      "words-50",
    );
  });
});
