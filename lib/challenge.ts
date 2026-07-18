import { containsTargetWord } from "@/lib/word-match";
import type { ChallengeResponse, WordEntry } from "@/types";

export function getSentenceStarters(wordEntry: WordEntry) {
  const starters = wordEntry.starters
    .map((starter) => starter.dev.trim())
    .filter(Boolean);

  return starters.length > 0 ? starters : [wordEntry.elevatedExample.dev];
}

export function evaluateChallengeLocally(
  transcript: string,
  wordEntry: WordEntry,
): ChallengeResponse {
  const usedTargetWord =
    containsTargetWord(transcript, wordEntry.elevated.roman) ||
    containsTargetWord(transcript, wordEntry.elevated.dev);
  const reasonableLength =
    transcript.trim().length >= 18 && transcript.trim().split(/\s+/).length >= 4;

  if (!usedTargetWord) {
    return {
      transcript,
      usedTargetWord: false,
      acceptableUsage: false,
      feedback: `Aapka vaakya achha aarambh hai. Is baar "${wordEntry.elevated.dev}" shabd ko seedhe vaakya mein jod kar phir se koshish kijiye.`,
      suggestedImprovement: `${wordEntry.elevated.dev} shabd ka prayog karte hue ek poora vaakya kahiye.`,
      completed: false,
    };
  }

  if (!reasonableLength) {
    return {
      transcript,
      usedTargetWord: true,
      acceptableUsage: false,
      feedback:
        "Target word mil gaya. Ab ise thoda aur poore, natural vaakya mein istemal kijiye.",
      suggestedImprovement: wordEntry.elevatedExample.dev,
      completed: false,
    };
  }

  return {
    transcript,
    usedTargetWord: true,
    acceptableUsage: true,
    feedback:
      "Sundar prayog. Target word vaakya mein spasht hai aur usage natural lag raha hai.",
    completed: true,
  };
}
