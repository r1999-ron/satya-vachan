/**
 * Rare, celebratory moments — deliberately sparse so each one lands. There is
 * no badge shelf: a milestone fires once, is marked seen, and is never shown
 * again.
 */

export type MilestoneStats = {
  wordsSaved: number;
  currentStreak: number;
  puzzlePerfects: number;
};

export type Milestone = {
  id: string;
  /** Large Devanagari headline. */
  headline: string;
  /** One quiet supporting line. */
  line: string;
};

type MilestoneDefinition = Milestone & {
  isReached: (stats: MilestoneStats) => boolean;
};

const MILESTONES: MilestoneDefinition[] = [
  {
    id: "words-10",
    headline: "दस शब्द आपके हुए",
    line: "Ten elegant words are now part of your Hindi.",
    isReached: (stats) => stats.wordsSaved >= 10,
  },
  {
    id: "words-25",
    headline: "पच्चीस शब्दों का संग्रह",
    line: "Twenty-five words saved — a vocabulary taking shape.",
    isReached: (stats) => stats.wordsSaved >= 25,
  },
  {
    id: "words-50",
    headline: "पचास शब्द — एक कोश",
    line: "Fifty words. Your own small dictionary of elegance.",
    isReached: (stats) => stats.wordsSaved >= 50,
  },
  {
    id: "words-100",
    headline: "सौ शब्द आपकी वाणी में",
    line: "One hundred words woven into how you speak.",
    isReached: (stats) => stats.wordsSaved >= 100,
  },
  {
    id: "streak-7",
    headline: "सात दिन निरंतर",
    line: "A full week of showing up. A habit is forming.",
    isReached: (stats) => stats.currentStreak >= 7,
  },
  {
    id: "streak-30",
    headline: "तीस दिन का अभ्यास",
    line: "Thirty days of daily practice — remarkable steadiness.",
    isReached: (stats) => stats.currentStreak >= 30,
  },
  {
    id: "streak-100",
    headline: "सौ दिन — एक साधना",
    line: "One hundred days. This is devotion.",
    isReached: (stats) => stats.currentStreak >= 100,
  },
  {
    id: "puzzle-perfect-1",
    headline: "पहला निर्दोष खेल",
    line: "Your first perfect word game — every choice elegant.",
    isReached: (stats) => stats.puzzlePerfects >= 1,
  },
];

/**
 * The single most significant newly-reached milestone the user has not seen.
 * Higher thresholds win when several cross at once, so a big leap celebrates
 * the big number rather than a lesser one.
 */
export function findNewMilestone(
  stats: MilestoneStats,
  seenIds: readonly string[],
): Milestone | null {
  const seen = new Set(seenIds);

  for (let index = MILESTONES.length - 1; index >= 0; index -= 1) {
    const milestone = MILESTONES[index];

    if (!seen.has(milestone.id) && milestone.isReached(stats)) {
      return {
        id: milestone.id,
        headline: milestone.headline,
        line: milestone.line,
      };
    }
  }

  return null;
}

/**
 * Every milestone already reached — used to seed "seen" on first run so a
 * long-time user is not retro-celebrated for thresholds crossed before the
 * feature existed.
 */
export function reachedMilestoneIds(stats: MilestoneStats): string[] {
  return MILESTONES.filter((milestone) => milestone.isReached(stats)).map(
    (milestone) => milestone.id,
  );
}
