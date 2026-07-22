import { getTodayKey } from "@/lib/dates";
import { containsTargetWord } from "@/lib/word-match";
import type { WordEntry } from "@/types";

/**
 * A bonus constraint layered over the daily challenge after it is complete.
 * `localCheck` is the no-API fallback: `null` means only the model can judge,
 * in which case the local path accepts the attempt with a notice.
 */
export type TwistDefinition = {
  id: string;
  labelDev: string;
  labelRoman: string;
  /** The extra condition, phrased for the validation model. */
  constraint: string;
  localCheck: (transcript: string, word: WordEntry) => boolean | null;
};

const QUESTION_WORDS =
  /(क्या|क्यों|कौन|कब|कहाँ|कहां|कैसे|कितन)|\b(kya|kyon|kyun|kaun|kab|kahan|kaise|kitna|kitne|kitni)\b/iu;

function countWords(transcript: string) {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}

function countTargetOccurrences(transcript: string, word: WordEntry) {
  const haystack = transcript.toLocaleLowerCase();
  const needles = [word.elevated.dev, word.elevated.roman]
    .map((form) => form.trim().toLocaleLowerCase())
    .filter(Boolean);

  let count = 0;

  for (const needle of needles) {
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      count += 1;
      index = haystack.indexOf(needle, index + needle.length);
    }
  }

  return count;
}

export const TWISTS: TwistDefinition[] = [
  {
    id: "question",
    labelDev: "प्रश्न के रूप में",
    labelRoman: "As a question",
    constraint: "The sentence must be phrased as a question.",
    localCheck: (transcript) =>
      transcript.includes("?") || QUESTION_WORDS.test(transcript),
  },
  {
    id: "short",
    labelDev: "आठ शब्दों से कम में",
    labelRoman: "In under 8 words",
    constraint: "The sentence must contain fewer than 8 words.",
    localCheck: (transcript) => countWords(transcript) < 8,
  },
  {
    id: "twice",
    labelDev: "शब्द का दो बार प्रयोग",
    labelRoman: "Use the word twice",
    constraint: "The target word must appear at least twice in the sentence.",
    localCheck: (transcript, word) => countTargetOccurrences(transcript, word) >= 2,
  },
  {
    id: "about-today",
    labelDev: "अपने आज के दिन के बारे में",
    labelRoman: "About your day today",
    constraint: "The sentence must be about the speaker's own day today.",
    // Whether a sentence is genuinely about the speaker's day needs judgement;
    // offline we only verify the target word and accept with a notice.
    localCheck: () => null,
  },
];

/** The twist rotates daily on a fixed cycle, shared by everyone. */
export function getTodaysTwist(dateKey: string = getTodayKey()): TwistDefinition {
  const [year, month, day] = dateKey.split("-").map(Number);
  const days = Math.floor(Date.UTC(year, (month || 1) - 1, day || 1) / 86_400_000);

  return TWISTS[((days % TWISTS.length) + TWISTS.length) % TWISTS.length];
}

/**
 * Offline verdict for a twist attempt: the target word must be present, then
 * the twist's own check applies. Returns the notice to show when the check
 * could not actually be evaluated locally.
 */
export function evaluateTwistLocally(
  transcript: string,
  word: WordEntry,
  twist: TwistDefinition,
): { acceptable: boolean; unverified: boolean } {
  const usedTargetWord =
    containsTargetWord(transcript, word.elevated.roman) ||
    containsTargetWord(transcript, word.elevated.dev);

  if (!usedTargetWord) {
    return { acceptable: false, unverified: false };
  }

  const verdict = twist.localCheck(transcript, word);

  if (verdict === null) {
    return { acceptable: true, unverified: true };
  }

  return { acceptable: verdict, unverified: false };
}
