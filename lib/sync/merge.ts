import type { StateSnapshot, StorageKeyName } from "@/lib/sync/keys";

/**
 * Merging local and remote state.
 *
 * A user can practise on their phone offline and on a laptop in the same day,
 * so neither side can simply win. Every key is merged by what that key
 * *means*: counters take the maximum, day logs take the union, and per-item
 * collections take the more advanced record. The result is that syncing never
 * loses a saved word or silently shortens a streak.
 *
 * These are pure functions over raw parsed JSON — they never touch
 * localStorage — which is what makes them straightforward to test.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringList(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === "string");
}

/** The later of two date-like strings; both formats here sort lexicographically. */
function laterString(left: unknown, right: unknown): string | null {
  const leftValue = typeof left === "string" ? left : null;
  const rightValue = typeof right === "string" ? right : null;

  if (leftValue === null) return rightValue;
  if (rightValue === null) return leftValue;

  return leftValue >= rightValue ? leftValue : rightValue;
}

function unionStrings(left: unknown, right: unknown): string[] {
  return Array.from(new Set([...asStringList(left), ...asStringList(right)])).sort();
}

/* ------------------------------------------------------------------ */
/* Per-key merges                                                      */
/* ------------------------------------------------------------------ */

/**
 * Saved words are the data a user would most resent losing, so the union is
 * keyed on the word itself and keeps the earliest save date. Field-level gaps
 * are filled from whichever side has them.
 */
export function mergeLearnedWords(local: unknown, remote: unknown): unknown[] {
  const byWord = new Map<string, Record<string, unknown>>();

  const absorb = (entry: unknown) => {
    if (!isRecord(entry) || typeof entry.word !== "string" || !entry.word.trim()) {
      return;
    }

    const key = entry.word.trim().toLocaleLowerCase();
    const existing = byWord.get(key);

    if (!existing) {
      byWord.set(key, { ...entry });
      return;
    }

    const existingSavedAt = typeof existing.savedAt === "string" ? existing.savedAt : "";
    const incomingSavedAt = typeof entry.savedAt === "string" ? entry.savedAt : "";
    // Whichever record is older establishes identity and save date; the other
    // only contributes fields the older one is missing.
    const [base, extra] =
      incomingSavedAt && (!existingSavedAt || incomingSavedAt < existingSavedAt)
        ? [entry, existing]
        : [existing, entry];
    const merged: Record<string, unknown> = { ...extra, ...base };

    for (const [field, value] of Object.entries(merged)) {
      if (value === undefined || value === null || value === "") {
        const fallback = (extra as Record<string, unknown>)[field];
        if (fallback !== undefined && fallback !== null && fallback !== "") {
          merged[field] = fallback;
        }
      }
    }

    byWord.set(key, merged);
  };

  for (const entry of asArray(remote)) absorb(entry);
  for (const entry of asArray(local)) absorb(entry);

  // Newest first, matching how saveLearnedWord prepends.
  return [...byWord.values()].sort((left, right) => {
    const leftSaved = typeof left.savedAt === "string" ? left.savedAt : "";
    const rightSaved = typeof right.savedAt === "string" ? right.savedAt : "";
    return rightSaved.localeCompare(leftSaved);
  });
}

/**
 * Streak counters take the maximum and the completed-day log takes the union,
 * so a day practised on either device counts exactly once.
 */
export function mergeStreak(local: unknown, remote: unknown): Record<string, unknown> {
  const localState = isRecord(local) ? local : {};
  const remoteState = isRecord(remote) ? remote : {};
  const currentStreak = Math.max(
    asFiniteNumber(localState.currentStreak),
    asFiniteNumber(remoteState.currentStreak),
  );

  return {
    currentStreak,
    longestStreak: Math.max(
      currentStreak,
      asFiniteNumber(localState.longestStreak),
      asFiniteNumber(remoteState.longestStreak),
    ),
    lastCompletedDate: laterString(
      localState.lastCompletedDate,
      remoteState.lastCompletedDate,
    ),
    completedChallenges: unionStrings(
      localState.completedChallenges,
      remoteState.completedChallenges,
    ),
    restDayBank: Math.max(
      asFiniteNumber(localState.restDayBank),
      asFiniteNumber(remoteState.restDayBank),
    ),
    restDaysUsed: unionStrings(localState.restDaysUsed, remoteState.restDaysUsed),
  };
}

/** History entries are immutable once written, so a union by id is enough. */
export function mergePracticeHistory(local: unknown, remote: unknown): unknown[] {
  const byId = new Map<string, Record<string, unknown>>();

  for (const entry of [...asArray(remote), ...asArray(local)]) {
    if (isRecord(entry) && typeof entry.id === "string") {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()].sort((left, right) => {
    const leftSaved = typeof left.savedAt === "string" ? left.savedAt : "";
    const rightSaved = typeof right.savedAt === "string" ? right.savedAt : "";
    return rightSaved.localeCompare(leftSaved);
  });
}

/**
 * A review schedule is a position in a spaced-repetition ladder; the record
 * reviewed most recently is the current one.
 */
export function mergeReviewSchedules(local: unknown, remote: unknown): unknown[] {
  const byWordId = new Map<string, Record<string, unknown>>();

  const absorb = (entry: unknown) => {
    if (!isRecord(entry) || typeof entry.wordId !== "string") {
      return;
    }

    const existing = byWordId.get(entry.wordId);

    if (!existing) {
      byWordId.set(entry.wordId, entry);
      return;
    }

    const existingReviewed =
      typeof existing.lastReviewedOn === "string" ? existing.lastReviewedOn : "";
    const incomingReviewed =
      typeof entry.lastReviewedOn === "string" ? entry.lastReviewedOn : "";

    if (incomingReviewed > existingReviewed) {
      byWordId.set(entry.wordId, entry);
      return;
    }

    // Same day on both devices — the one with more reviews is further along.
    if (
      incomingReviewed === existingReviewed &&
      asFiniteNumber(entry.reviewCount) > asFiniteNumber(existing.reviewCount)
    ) {
      byWordId.set(entry.wordId, entry);
    }
  };

  for (const entry of asArray(remote)) absorb(entry);
  for (const entry of asArray(local)) absorb(entry);

  return [...byWordId.values()];
}

/** Only one puzzle is live at a time: the newest date, or the further progress. */
export function mergePuzzle(local: unknown, remote: unknown): unknown {
  const localState = isRecord(local) ? local : null;
  const remoteState = isRecord(remote) ? remote : null;

  if (!localState) return remoteState;
  if (!remoteState) return localState;

  const localDate = typeof localState.dateKey === "string" ? localState.dateKey : "";
  const remoteDate = typeof remoteState.dateKey === "string" ? remoteState.dateKey : "";

  if (localDate !== remoteDate) {
    return localDate > remoteDate ? localState : remoteState;
  }

  if (localState.completed !== remoteState.completed) {
    return localState.completed ? localState : remoteState;
  }

  return asArray(localState.results).length >= asArray(remoteState.results).length
    ? localState
    : remoteState;
}

export function mergePuzzleStats(local: unknown, remote: unknown): Record<string, number> {
  const localStats = isRecord(local) ? local : {};
  const remoteStats = isRecord(remote) ? remote : {};

  return {
    played: Math.max(asFiniteNumber(localStats.played), asFiniteNumber(remoteStats.played)),
    perfect: Math.max(asFiniteNumber(localStats.perfect), asFiniteNumber(remoteStats.perfect)),
  };
}

/** Monthly counters take the per-field maximum rather than a sum, because the
 * same activity may already be counted on both sides. */
export function mergeActivity(local: unknown, remote: unknown): Record<string, unknown> {
  const localLog = isRecord(local) ? local : {};
  const remoteLog = isRecord(remote) ? remote : {};
  const merged: Record<string, Record<string, number>> = {};

  for (const monthKey of new Set([...Object.keys(localLog), ...Object.keys(remoteLog)])) {
    const localMonth = isRecord(localLog[monthKey]) ? localLog[monthKey] : {};
    const remoteMonth = isRecord(remoteLog[monthKey]) ? remoteLog[monthKey] : {};
    const month: Record<string, number> = {};

    for (const counter of new Set([
      ...Object.keys(localMonth),
      ...Object.keys(remoteMonth),
    ])) {
      month[counter] = Math.max(
        asFiniteNumber(localMonth[counter]),
        asFiniteNumber(remoteMonth[counter]),
      );
    }

    merged[monthKey] = month;
  }

  return merged;
}

/* ------------------------------------------------------------------ */
/* Snapshot merge                                                      */
/* ------------------------------------------------------------------ */

type MergeFn = (local: unknown, remote: unknown) => unknown;

const MERGE_BY_KEY: Record<StorageKeyName, MergeFn> = {
  learnedWords: mergeLearnedWords,
  streak: mergeStreak,
  practiceHistory: mergePracticeHistory,
  reviewSchedules: mergeReviewSchedules,
  puzzle: mergePuzzle,
  puzzleStats: mergePuzzleStats,
  activity: mergeActivity,
  milestonesSeen: (local, remote) => unionStrings(local, remote),
  // Date markers: the later one already implies the earlier was seen.
  twist: (local, remote) => laterString(local, remote),
  recapSeen: (local, remote) => laterString(local, remote),
  // A display preference is device-level intent; the device doing the sync wins.
  preferences: (local, remote) => (local === undefined ? remote : local),
};

/**
 * Combines this browser's state with the copy stored for the signed-in user.
 * A key present on only one side is carried over untouched.
 */
export function mergeSnapshots(
  local: StateSnapshot,
  remote: StateSnapshot,
): StateSnapshot {
  const merged: StateSnapshot = {};

  for (const [key, mergeFn] of Object.entries(MERGE_BY_KEY) as [
    StorageKeyName,
    MergeFn,
  ][]) {
    const localValue = local[key];
    const remoteValue = remote[key];

    if (localValue === undefined && remoteValue === undefined) {
      continue;
    }

    if (localValue === undefined) {
      merged[key] = remoteValue;
      continue;
    }

    if (remoteValue === undefined) {
      merged[key] = localValue;
      continue;
    }

    const result = mergeFn(localValue, remoteValue);

    if (result !== undefined) {
      merged[key] = result;
    }
  }

  return merged;
}
