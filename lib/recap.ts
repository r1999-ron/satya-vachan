import { getMonthKey, shiftDateKey } from "@/lib/dates";
import type { LearnedWord, MonthlyActivity } from "@/types";

export type MonthlyRecap = {
  monthKey: string;
  activity: MonthlyActivity;
  /** Words saved during this month, newest first. */
  savedWords: LearnedWord[];
  /** Longest run of consecutive completed challenge days within the month. */
  longestStreakInMonth: number;
  hasActivity: boolean;
};

/** Longest chain of consecutive date keys, all assumed within one month. */
function longestConsecutiveRun(dateKeys: string[]): number {
  const unique = Array.from(new Set(dateKeys)).sort();

  if (unique.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < unique.length; index += 1) {
    if (shiftDateKey(unique[index - 1], 1) === unique[index]) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * Pure aggregation for the monthly recap — everything the page needs, derived
 * from data the caller has already loaded so it stays trivially testable.
 */
export function buildMonthlyRecap(
  monthKey: string,
  activity: MonthlyActivity,
  learnedWords: LearnedWord[],
  completedChallenges: string[],
): MonthlyRecap {
  const savedWords = learnedWords
    .filter((word) => getMonthKey(word.savedAt) === monthKey)
    .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));

  const monthChallenges = completedChallenges.filter(
    (dateKey) => getMonthKey(dateKey) === monthKey,
  );

  const hasActivity =
    Object.values(activity).some((count) => count > 0) || savedWords.length > 0;

  return {
    monthKey,
    activity,
    savedWords,
    longestStreakInMonth: longestConsecutiveRun(monthChallenges),
    hasActivity,
  };
}
