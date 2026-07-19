import { containsTargetWord } from "@/lib/word-match";
import type { ChallengeResponse, WordEntry } from "@/types";

export function getSentenceStarters(wordEntry: WordEntry) {
  const starters = wordEntry.starters
    .map((starter) => starter.dev.trim())
    .filter(Boolean);

  if (starters.length > 0) {
    return starters;
  }

  const derived = deriveStarter(wordEntry.elevatedExample.dev, wordEntry.elevated.dev);
  return derived ? [derived] : [];
}

// A starter must invite the user to finish the sentence themselves, so it stops
// before the target word ever appears. Sentences that open with the target word
// produce no starter at all rather than giving the answer away.
function deriveStarter(sentence: string, targetWord: string) {
  const tokens = sentence.replace(/[।.!?…]+\s*$/u, "").split(/\s+/).filter(Boolean);
  const targetIndex = targetWord
    ? tokens.findIndex((token) => token.includes(targetWord))
    : -1;
  const cutoff = targetIndex === -1 ? Math.min(4, tokens.length - 2) : targetIndex;

  if (cutoff < 2) {
    return null;
  }

  return `${tokens.slice(0, cutoff).join(" ")} …`;
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
