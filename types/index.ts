export type RegisterLevel = "common" | "formal" | "literary";

export type WordEntry = {
  id: string;
  common: string;
  elevated: string;
  englishMeaning: string;
  simpleExample: string;
  elevatedExample: string;
  synonyms: string[];
  usageNote: string;
  challengePrompt: string;
  tags: string[];
  difficulty: "easy" | "medium" | "advanced";
};

export type WordReplacement = {
  original: string;
  replacement: string;
  meaning: string;
  whyBetter: string;
  naturalness: RegisterLevel;
};

export type PracticeResponse = {
  transcript: string;
  naturalPolishedVersion: string;
  elevatedVersion: string;
  originalEleganceScore: number;
  improvedEleganceScore: number;
  feedback: string;
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
  meaning: string;
  simpleAlternative?: string;
  exampleSentence: string;
  savedAt: string;
  source: "seed" | "practice" | "challenge" | "manual";
};

export type LearnedWordInput = {
  word: string;
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
