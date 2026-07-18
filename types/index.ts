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
  naturalPolishedVersion: HindiText;
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
  source: "seed" | "practice" | "challenge" | "manual";
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
