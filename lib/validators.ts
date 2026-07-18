import type {
  ChallengeResponse,
  HindiText,
  LearnedWordInput,
  PracticeResponse,
  RegisterLevel,
  TtsResponse,
  WordEntry,
  WordReplacement,
} from "@/types";

export const VALIDATION_LIMITS = {
  transcriptChars: 1000,
  challengeTranscriptChars: 800,
  ttsChars: 800,
  audioBytes: 10 * 1024 * 1024,
  modelTextChars: 1600,
} as const;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

const REGISTER_LEVELS = new Set<RegisterLevel>([
  "common",
  "formal",
  "literary",
]);

const AUDIO_EXTENSIONS = [
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".ogg",
  ".wav",
  ".webm",
];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getTrimmedString(
  value: unknown,
  maxLength: number = VALIDATION_LIMITS.modelTextChars,
) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

export function validateTranscript(
  value: unknown,
  maxLength: number = VALIDATION_LIMITS.transcriptChars,
): ValidationResult<string> {
  const transcript = getTrimmedString(value, maxLength + 1) ?? "";

  if (!transcript) {
    return { ok: false, message: "Please add a sentence before continuing." };
  }

  if (transcript.length > maxLength) {
    return {
      ok: false,
      message: `Please keep the transcript under ${maxLength} characters.`,
    };
  }

  return { ok: true, value: transcript };
}

export function validateTtsText(value: unknown): ValidationResult<string> {
  const text = getTrimmedString(value, VALIDATION_LIMITS.ttsChars + 1) ?? "";

  if (!text) {
    return { ok: false, message: "Please add text before requesting audio." };
  }

  if (text.length > VALIDATION_LIMITS.ttsChars) {
    return {
      ok: false,
      message: `Please keep TTS text under ${VALIDATION_LIMITS.ttsChars} characters.`,
    };
  }

  return { ok: true, value: text };
}

export function validateAudioFile(file: unknown): ValidationResult<File> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please include a recorded audio file." };
  }

  if (file.size > VALIDATION_LIMITS.audioBytes) {
    return { ok: false, message: "Please keep recordings under 10 MB." };
  }

  if (!isSupportedAudioFile(file)) {
    return { ok: false, message: "Please upload a supported audio recording." };
  }

  return { ok: true, value: file };
}

export function normalizePracticeResponse(
  rawValue: unknown,
  fallbackTranscript = "",
): PracticeResponse | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const transcript =
    getTrimmedString(rawValue.transcript, VALIDATION_LIMITS.transcriptChars) ??
    fallbackTranscript.trim();
  const naturalElegantVersion = normalizeHindiText(rawValue.naturalElegantVersion);
  const elevatedVersion = normalizeHindiText(rawValue.elevatedVersion);

  if (
    !transcript ||
    !naturalElegantVersion.dev ||
    !naturalElegantVersion.roman ||
    !elevatedVersion.dev ||
    !elevatedVersion.roman
  ) {
    return null;
  }

  return {
    transcript,
    naturalElegantVersion,
    elevatedVersion,
    replacements: Array.isArray(rawValue.replacements)
      ? rawValue.replacements
          .map(normalizeReplacement)
          .filter((replacement): replacement is WordReplacement => Boolean(replacement))
          .slice(0, 6)
      : [],
    saveableWords: Array.isArray(rawValue.saveableWords)
      ? rawValue.saveableWords
          .map(normalizeSaveableWord)
          .filter((word): word is LearnedWordInput => Boolean(word))
          .slice(0, 6)
      : [],
  };
}

export function normalizeChallengeResponse(
  rawValue: unknown,
  fallbackTranscript = "",
): ChallengeResponse | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const transcript =
    getTrimmedString(rawValue.transcript, VALIDATION_LIMITS.challengeTranscriptChars) ??
    fallbackTranscript.trim();
  const feedback = getTrimmedString(rawValue.feedback);

  if (!transcript || !feedback) {
    return null;
  }

  const usedTargetWord = Boolean(rawValue.usedTargetWord);
  const acceptableUsage = usedTargetWord && Boolean(rawValue.acceptableUsage);
  const suggestedImprovement = getTrimmedString(rawValue.suggestedImprovement);

  return {
    transcript,
    usedTargetWord,
    acceptableUsage,
    feedback,
    ...(suggestedImprovement ? { suggestedImprovement } : {}),
    completed: acceptableUsage,
  };
}

export function normalizeWordEntry(rawValue: unknown, targetWord: string): WordEntry {
  if (!isRecord(rawValue)) {
    return createFallbackWordEntry(targetWord);
  }

  return {
    id: getTrimmedString(rawValue.id) ?? targetWord,
    common: normalizeHindiText(rawValue.common, ""),
    elevated: normalizeHindiText(rawValue.elevated, targetWord),
    englishMeaning: getTrimmedString(rawValue.englishMeaning) ?? "",
    simpleExample: normalizeHindiText(rawValue.simpleExample, ""),
    elevatedExample: normalizeHindiText(rawValue.elevatedExample, ""),
    scholarExample: normalizeHindiText(rawValue.scholarExample, ""),
    synonyms: Array.isArray(rawValue.synonyms)
      ? rawValue.synonyms
          .map((synonym) => normalizeHindiText(synonym))
          .filter((synonym): synonym is HindiText => Boolean(synonym.dev && synonym.roman))
      : [],
    usageNote: getTrimmedString(rawValue.usageNote) ?? "",
    challengePrompt: getTrimmedString(rawValue.challengePrompt) ?? "",
    starters: Array.isArray(rawValue.starters)
      ? rawValue.starters
          .map((starter) => normalizeHindiText(starter))
          .filter((starter): starter is HindiText => Boolean(starter.dev && starter.roman))
      : [],
    tags: Array.isArray(rawValue.tags)
      ? rawValue.tags
          .map((tag) => getTrimmedString(tag, 40))
          .filter((tag): tag is string => Boolean(tag))
      : [],
    difficulty:
      rawValue.difficulty === "medium" || rawValue.difficulty === "advanced"
        ? rawValue.difficulty
        : "easy",
  };
}

export function normalizeTtsResponse(rawValue: unknown): TtsResponse | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  return typeof rawValue.audioBase64 === "string" &&
    rawValue.audioBase64.trim() &&
    rawValue.mimeType === "audio/mpeg"
    ? {
        audioBase64: rawValue.audioBase64.trim(),
        mimeType: "audio/mpeg",
      }
    : null;
}

function normalizeReplacement(rawValue: unknown): WordReplacement | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const original = normalizeHindiText(rawValue.original);
  const replacement = normalizeHindiText(rawValue.replacement);
  const meaning = getTrimmedString(rawValue.meaning, 240);

  if (!original.dev || !original.roman || !replacement.dev || !replacement.roman || !meaning) {
    return null;
  }

  return {
    original,
    replacement,
    meaning,
    whyBetter:
      getTrimmedString(rawValue.whyBetter, 400) ??
      `${replacement.roman} is a more elegant option in this sentence.`,
    naturalness: getRegisterLevel(rawValue.naturalness),
  };
}

function normalizeSaveableWord(rawValue: unknown): LearnedWordInput | null {
  if (!isRecord(rawValue)) {
    return null;
  }

  const word = getTrimmedString(rawValue.word, 120);
  const wordDev = getTrimmedString(rawValue.wordDev, 120) ?? word;
  const meaning = getTrimmedString(rawValue.meaning, 240);
  const exampleSentence = getTrimmedString(rawValue.exampleSentence);

  if (!word || !wordDev || !meaning || !exampleSentence) {
    return null;
  }

  const simpleAlternative = getTrimmedString(rawValue.simpleAlternative, 120);

  return {
    word,
    wordDev,
    meaning,
    ...(simpleAlternative ? { simpleAlternative } : {}),
    exampleSentence,
  };
}

function createFallbackWordEntry(targetWord: string): WordEntry {
  return {
    id: targetWord,
    common: { dev: "", roman: "" },
    elevated: { dev: targetWord, roman: targetWord },
    englishMeaning: "",
    simpleExample: { dev: "", roman: "" },
    elevatedExample: { dev: "", roman: "" },
    scholarExample: { dev: "", roman: "" },
    synonyms: [],
    usageNote: "",
    challengePrompt: "",
    starters: [],
    tags: [],
    difficulty: "easy",
  };
}

function normalizeHindiText(rawValue: unknown, fallback = ""): HindiText {
  if (typeof rawValue === "string") {
    const text = getTrimmedString(rawValue) ?? fallback;
    return { dev: text, roman: text };
  }

  if (isRecord(rawValue)) {
    const dev = getTrimmedString(rawValue.dev) ?? fallback;
    const roman = getTrimmedString(rawValue.roman) ?? fallback;
    const en = getTrimmedString(rawValue.en, 400);
    return { dev, roman, ...(en ? { en } : {}) };
  }

  return { dev: fallback, roman: fallback };
}

function getRegisterLevel(value: unknown): RegisterLevel {
  if (typeof value === "string" && REGISTER_LEVELS.has(value as RegisterLevel)) {
    return value as RegisterLevel;
  }

  return "formal";
}

function isSupportedAudioFile(file: File) {
  if (file.type.startsWith("audio/")) {
    return true;
  }

  const lowerName = file.name.toLocaleLowerCase();
  return AUDIO_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}
