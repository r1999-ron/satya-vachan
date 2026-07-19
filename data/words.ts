import generatedWordCorpus from "@/data/word-corpus.generated.json";
import type { HindiText, WordEntry } from "@/types";
import { getTodayKey } from "@/lib/dates";

const WORD_OF_DAY_EPOCH = "2026-01-01";

type GeneratedWordEntry = {
  id: number;
  common: HindiText;
  elevated: HindiText;
  englishMeaning: string;
  simpleExample: HindiText;
  elevatedExample: HindiText;
  scholarExample: HindiText;
  synonyms: HindiText[];
  usageNote: string;
  challengePrompt: string;
  tags: string[];
  difficulty: WordEntry["difficulty"];
};

export const fallbackWordEntry: WordEntry = {
  id: "0",
  common: { dev: "काम", roman: "kaam" },
  elevated: { dev: "कार्य", roman: "karya" },
  englishMeaning: "work, task, or purposeful action",
  simpleExample: {
    dev: "हमने यह काम समय पर पूरा किया।",
    roman: "Humne yeh kaam samay par poora kiya.",
  },
  elevatedExample: {
    dev: "हमने यह कार्य समय पर पूरा किया।",
    roman: "Humne yeh karya samay par poora kiya.",
  },
  scholarExample: {
    dev: "निर्धारित अवधि में इस कार्य का संपादन सफलतापूर्वक संपन्न हुआ।",
    roman: "Nirdharit avadhi mein is karya ka sampadan safalatapurvak sampann hua.",
  },
  synonyms: [
    { dev: "कर्तव्य", roman: "kartavya" },
    { dev: "प्रयोजन", roman: "prayojan" },
  ],
  usageNote: "Karya sounds elegant but remains natural for everyday professional speech.",
  challengePrompt: "Apne din ke kisi mahatvapurn karya ke baare mein ek vaakya kahiye.",
  starters: [],
  tags: ["work", "daily speech", "professional"],
  difficulty: "easy",
};

export const wordCorpus: WordEntry[] = (generatedWordCorpus as GeneratedWordEntry[]).map(
  (entry) => ({
    ...entry,
    id: String(entry.id),
    starters: [],
  }),
);

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
      word.elevatedExample.dev,
      word.elevatedExample.roman,
      word.scholarExample.dev,
      word.scholarExample.roman,
      word.usageNote,
      word.challengePrompt,
    ];

    if (requiredFields.some((field) => typeof field !== "string" || field.trim().length === 0)) {
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
