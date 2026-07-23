/**
 * The canonical registry of persisted state keys.
 *
 * This lives apart from `lib/storage.ts` because both the browser storage
 * layer and the server-side sync route need it, and `lib/storage.ts` pulls in
 * React hooks and seed data that have no business in a route handler.
 */

export const STORAGE_KEYS = {
  learnedWords: "satya-vachan.learnedWords",
  streak: "satya-vachan.streak",
  practiceHistory: "satya-vachan.practiceHistory",
  preferences: "satya-vachan.preferences",
  reviewSchedules: "satya-vachan.reviewSchedules",
  puzzle: "satya-vachan.puzzle",
  puzzleStats: "satya-vachan.puzzleStats",
  twist: "satya-vachan.twist",
  activity: "satya-vachan.activity",
  milestonesSeen: "satya-vachan.milestonesSeen",
  recapSeen: "satya-vachan.recapSeen",
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

export const STORAGE_KEY_NAMES = Object.keys(STORAGE_KEYS) as StorageKeyName[];

/**
 * The stored value of every key, as raw parsed JSON. Keys absent from storage
 * are omitted rather than defaulted, so a merge can tell "never set" apart
 * from "deliberately empty".
 */
export type StateSnapshot = Partial<Record<StorageKeyName, unknown>>;
