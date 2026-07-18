import { bilingualWordEntry, type LegacyWordEntry } from "@/data/bilingual-corpus";
import { generatedWordCorpus } from "@/data/word-corpus.generated";
import type { WordEntry } from "@/types";
import { getTodayKey } from "@/lib/dates";

const WORD_OF_DAY_EPOCH = "2026-01-01";

const legacyFallbackWordEntry: LegacyWordEntry = {
  id: "fallback-karya",
  common: "kaam",
  elevated: "karya",
  englishMeaning: "work, task, or purposeful action",
  simpleExample: "Humne yeh kaam samay par poora kiya.",
  elevatedExample: "Humne yeh karya samay par poora kiya.",
  scholarExample:
    "Nirdharit avadhi mein is karya ka sampadan safalatapurvak sampann hua.",
  synonyms: ["kaarya", "kartavya", "prayojan"],
  usageNote:
    "Karya sounds elegant but remains natural for everyday professional speech.",
  challengePrompt:
    "Apne din ke kisi mahatvapurn karya ke baare mein ek vaakya kahiye.",
  tags: ["work", "daily speech", "professional"],
  difficulty: "easy",
};

export const fallbackWordEntry: WordEntry = bilingualWordEntry(legacyFallbackWordEntry);

const legacyWordCorpus = generatedWordCorpus;

export const wordCorpus: WordEntry[] = legacyWordCorpus.map(bilingualWordEntry);

function getDaysSinceEpoch(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [epochYear, epochMonth, epochDay] = WORD_OF_DAY_EPOCH.split("-").map(Number);
  const dateUtc = Date.UTC(year, month - 1, day);
  const epochUtc = Date.UTC(epochYear, epochMonth - 1, epochDay);

  return Math.floor((dateUtc - epochUtc) / 86_400_000);
}

function validateWordCorpus(words: WordEntry[]) {
  const seenIds = new Set<string>();

  for (const word of words) {
    const requiredFields = [
      word.id,
      word.common.dev,
      word.common.roman,
      word.elevated.dev,
      word.elevated.roman,
      word.englishMeaning,
      word.simpleExample.dev,
      word.simpleExample.roman,
      word.simpleExample.en,
      word.elevatedExample.dev,
      word.elevatedExample.roman,
      word.elevatedExample.en,
      word.scholarExample.dev,
      word.scholarExample.roman,
      word.scholarExample.en,
      word.usageNote,
      word.challengePrompt,
    ].filter((field): field is string => typeof field === "string");

    if (requiredFields.some((field) => field.trim().length === 0)) {
      throw new Error(`Word corpus entry "${word.id || "unknown"}" is missing a required field.`);
    }

    if (seenIds.has(word.id)) {
      throw new Error(`Word corpus contains a duplicate id: ${word.id}`);
    }

    if (!Array.isArray(word.synonyms) || word.synonyms.length === 0) {
      throw new Error(`Word corpus entry "${word.id}" must include synonyms.`);
    }

    if (!Array.isArray(word.tags) || word.tags.length === 0) {
      throw new Error(`Word corpus entry "${word.id}" must include tags.`);
    }

    seenIds.add(word.id);
  }
}

validateWordCorpus(wordCorpus);

export function getWordOfTheDay(date: Date = new Date()) {
  if (wordCorpus.length === 0) {
    return fallbackWordEntry;
  }

  const todayKey = getTodayKey(date);
  const daysSinceEpoch = getDaysSinceEpoch(todayKey);
  const index = ((daysSinceEpoch % wordCorpus.length) + wordCorpus.length) % wordCorpus.length;

  return wordCorpus[index] ?? fallbackWordEntry;
}
