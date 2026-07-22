import { wordCorpus } from "@/data/words";
import { getTodayKey } from "@/lib/dates";
import type { HindiText, WordEntry } from "@/types";

/** Rounds per set — matches the review session's "about ninety seconds" feel. */
export const PUZZLE_ROUND_COUNT = 5;
const OPTION_COUNT = 4;
export const PUZZLE_BLANK = "＿＿＿";

export type PuzzleOption = {
  wordId: string;
  text: HindiText;
};

export type PuzzleRound = {
  word: WordEntry;
  /**
   * The elevated example with the elevated word masked — a cloze the correct
   * option genuinely completes. Null when the word never appears verbatim in
   * its example; the UI then falls back to a direct "उन्नत रूप चुनिए" prompt.
   */
  blankedSentence: HindiText | null;
  options: PuzzleOption[];
  answerWordId: string;
};

/**
 * Deterministic PRNG (mulberry32) so the daily set is identical for every
 * player and across reloads, Wordle-style.
 */
function createRng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

/** First-occurrence mask that keeps surrounding punctuation intact. */
export function blankWord(sentence: string, word: string): string | null {
  const trimmedWord = word.trim();

  if (!trimmedWord || !sentence.includes(trimmedWord)) {
    return null;
  }

  return sentence.replace(trimmedWord, PUZZLE_BLANK);
}

function blankWordCaseInsensitive(sentence: string, word: string): string | null {
  const trimmedWord = word.trim();

  if (!trimmedWord) {
    return null;
  }

  const index = sentence.toLocaleLowerCase().indexOf(trimmedWord.toLocaleLowerCase());

  if (index === -1) {
    return null;
  }

  return `${sentence.slice(0, index)}${PUZZLE_BLANK}${sentence.slice(index + trimmedWord.length)}`;
}

function buildBlankedSentence(word: WordEntry): HindiText | null {
  const dev = blankWord(word.elevatedExample.dev, word.elevated.dev);

  if (!dev) {
    return null;
  }

  // The roman line mirrors the mask when it can; an unmasked roman rendering
  // would print the answer right below the blank.
  const roman =
    blankWordCaseInsensitive(word.elevatedExample.roman, word.elevated.roman) ?? "";

  return { dev, roman };
}

function buildOptions(word: WordEntry, pool: WordEntry[], rng: () => number): PuzzleOption[] {
  const seenForms = new Set([word.elevated.dev]);
  const sameDifficulty: WordEntry[] = [];
  const others: WordEntry[] = [];

  for (const candidate of pool) {
    if (candidate.id === word.id || seenForms.has(candidate.elevated.dev)) {
      continue;
    }

    seenForms.add(candidate.elevated.dev);
    (candidate.difficulty === word.difficulty ? sameDifficulty : others).push(candidate);
  }

  const distractors = [
    ...shuffle(sameDifficulty, rng),
    ...shuffle(others, rng),
  ].slice(0, OPTION_COUNT - 1);
  const options = [
    { wordId: word.id, text: word.elevated },
    ...distractors.map((entry) => ({ wordId: entry.id, text: entry.elevated })),
  ];

  return shuffle(options, rng);
}

function buildRounds(words: WordEntry[], pool: WordEntry[], rng: () => number): PuzzleRound[] {
  return words.map((word) => ({
    word,
    blankedSentence: buildBlankedSentence(word),
    options: buildOptions(word, pool, rng),
    answerWordId: word.id,
  }));
}

/** The shared daily set: same five words, options, and order for everyone. */
export function getDailyPuzzle(dateKey: string = getTodayKey()): PuzzleRound[] {
  const rng = createRng(hashString(`satya-vachan-puzzle:${dateKey}`));
  const words = shuffle(wordCorpus, rng).slice(0, PUZZLE_ROUND_COUNT);

  return buildRounds(words, wordCorpus, rng);
}

/** A fresh random set for free replay after the daily set is done. */
export function getRandomPuzzle(): PuzzleRound[] {
  const rng = createRng((Math.random() * 4294967296) >>> 0);
  const words = shuffle(wordCorpus, rng).slice(0, PUZZLE_ROUND_COUNT);

  return buildRounds(words, wordCorpus, rng);
}
