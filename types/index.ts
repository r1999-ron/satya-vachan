export type RegisterLevel = "common" | "formal" | "literary";

export type HindiText = {
  dev: string;
  roman: string;
  en?: string;
};

export type ScriptPreference = "dev" | "roman" | "both";

export type WordEntry = {
  id: string;
  common: HindiText;
  elevated: HindiText;
  englishMeaning: string;
  simpleExample: HindiText;
  elevatedExample: HindiText;
  scholarExample: HindiText;
  synonyms: HindiText[];
  usageNote: string;
  challengePrompt: string;
  starters: HindiText[];
  tags: string[];
  difficulty: "easy" | "medium" | "advanced";
};

export type WordReplacement = {
  original: HindiText;
  replacement: HindiText;
  meaning: string;
  whyBetter: string;
  naturalness: RegisterLevel;
};

export type PracticeResponse = {
  transcript: string;
  naturalElegantVersion: HindiText;
  elevatedVersion: HindiText;
  replacements: WordReplacement[];
  saveableWords: LearnedWordInput[];
};

export type RecordingResult = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
};

export type LearnedWord = {
  id: string;
  word: string;
  wordDev: string;
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
  savedAt: string;
  source: "seed" | "practice" | "challenge" | "manual" | "game";
};

export type LearnedWordInput = {
  word: string;
  wordDev?: string;
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
};

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  completedChallenges: string[];
  /** Earned rest days ("विश्राम दिन") that can absorb a single missed day. */
  restDayBank: number;
  /** Date keys of missed days a rest day was spent on. */
  restDaysUsed: string[];
};

export type ReviewGrade = "again" | "good";

export type ReviewSchedule = {
  wordId: string;
  /** Date key for the next time this word should come back. */
  dueOn: string;
  /** Index into REVIEW_INTERVALS_DAYS. */
  stepIndex: number;
  lapses: number;
  reviewCount: number;
  lastReviewedOn: string | null;
};

export type ChallengeResponse = {
  transcript: string;
  usedTargetWord: boolean;
  acceptableUsage: boolean;
  feedback: string;
  suggestedImprovement?: string;
  completed: boolean;
};

export type TtsResponse = {
  audioBase64: string;
  mimeType: "audio/mpeg";
};

export type PuzzleRoundResult = {
  wordId: string;
  correct: boolean;
};

/** Progress through the shared daily word puzzle, persisted per date. */
export type PuzzleState = {
  dateKey: string;
  results: PuzzleRoundResult[];
  completed: boolean;
};

export type PuzzleLifetimeStats = {
  played: number;
  perfect: number;
};

/** Per-month counters that power the monthly recap. */
export type MonthlyActivity = {
  practices: number;
  challenges: number;
  twists: number;
  puzzlesCompleted: number;
  puzzlePerfects: number;
  wordsSaved: number;
  reviews: number;
};
