import { toDevanagari } from "@/data/bilingual-corpus";
import { wordCorpus } from "@/data/words";
import { makeHindiText } from "@/lib/hindi";
import type { LearnedWord, PracticeResponse, WordReplacement } from "@/types";

export const hintPracticeSentences = [
  "Humne is kaam ko jaldi khatam karne ki koshish ki.",
  "Mujhe aapki madad se problem ka solution mil gaya.",
  "Mera nazariya hai ki yeh decision important hai.",
  "Is topic par thodi confusion hai, kripya clear kar dijiye.",
  "Mera goal Hindi expression mein progress karna hai.",
  "Team ko ek better plan aur clear direction chahiye.",
].map((roman) => makeHindiText(toDevanagari(roman), roman));

const replacementLibrary = [
  ["kaam", "karya", "work or purposeful task"],
  ["jaldi", "sheeghra", "soon or without delay"],
  ["koshish", "prayas", "effort or attempt"],
  ["madad", "sahayata", "help or assistance"],
  ["problem", "samasya", "problem or issue"],
  ["solution", "samadhan", "solution or resolution"],
  ["clear", "spasht", "clear"],
  ["confusion", "aspashtata", "lack of clarity"],
] as const;

function replacement(original: string, upgraded: string, meaning: string): WordReplacement {
  return {
    original: makeHindiText(toDevanagari(original), original, meaning),
    replacement: makeHindiText(toDevanagari(upgraded), upgraded, meaning),
    meaning,
    whyBetter: `${upgraded} sentence ko zyada sundar aur spasht banata hai.`,
    naturalness: "formal",
  };
}

const defaultReplacements = replacementLibrary
  .slice(0, 3)
  .map(([original, upgraded, meaning]) => replacement(original, upgraded, meaning));

export const defaultTransformationExample: PracticeResponse = {
  transcript: hintPracticeSentences[0].roman,
  naturalElegantVersion: makeHindiText(
    "हमने इस कार्य को शीघ्र समाप्त करने का प्रयास किया।",
    "Humne is karya ko sheeghra samaapt karne ka prayas kiya.",
    "We tried to finish this work quickly.",
  ),
  elevatedVersion: makeHindiText(
    "हमने इस कार्य को अतिशीघ्र संपन्न करने का गंभीर प्रयत्न किया।",
    "Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya.",
    "We made a serious effort to complete this work very quickly.",
  ),
  replacements: defaultReplacements,
  saveableWords: defaultReplacements.map((item) => ({
    word: item.replacement.roman,
    wordDev: item.replacement.dev,
    meaning: item.meaning,
    simpleAlternative: item.original.roman,
    exampleSentence: "हमने इस कार्य को शीघ्र समाप्त करने का प्रयास किया।",
  })),
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getMockPracticeResponse(transcript: string): PracticeResponse {
  const cleanedTranscript = transcript.trim();
  const found = replacementLibrary
    .filter(([original]) => new RegExp(`\\b${escapeRegex(original)}\\b`, "i").test(cleanedTranscript))
    .slice(0, 3)
    .map(([original, upgraded, meaning]) => replacement(original, upgraded, meaning));
  const replacements = found.length ? found : defaultReplacements.slice(0, 2);
  const roman = replacements.reduce(
    (sentence, item) => sentence.replace(
      new RegExp(`\\b${escapeRegex(item.original.roman)}\\b`, "gi"),
      item.replacement.roman,
    ),
    cleanedTranscript,
  );
  const elegantRoman = roman === cleanedTranscript
    ? `${cleanedTranscript} Is baat ko aur spasht roop se kaha ja sakta hai.`
    : roman;
  const elevatedRoman = elegantRoman
    .replace(/\bsheeghra\b/gi, "atishighra")
    .replace(/\bprayas\b/gi, "gambhir prayatna")
    .replace(/\bsamadhan\b/gi, "uchit samadhan");

  return {
    transcript: cleanedTranscript,
    naturalElegantVersion: makeHindiText(
      toDevanagari(elegantRoman),
      elegantRoman,
      "A more elegant version of the original sentence.",
    ),
    elevatedVersion: makeHindiText(
      toDevanagari(elevatedRoman),
      elevatedRoman,
      "A more elevated version of the original sentence.",
    ),
    replacements,
    saveableWords: replacements.map((item) => ({
      word: item.replacement.roman,
      wordDev: item.replacement.dev,
      meaning: item.meaning,
      simpleAlternative: item.original.roman,
      exampleSentence: toDevanagari(elegantRoman),
    })),
  };
}

export const seedLearnedWords: LearnedWord[] = [
  ["karya", "कार्य", "work or purposeful task", "kaam", "हमने इस कार्य को समय पर पूरा किया।"],
  ["prayas", "प्रयास", "effort or attempt", "koshish", "आपका हर प्रयास आपकी अभिव्यक्ति को और साफ़ बनाता है।"],
  ["spasht", "स्पष्ट", "clear or explicit", "clear", "आपकी बात अब बहुत स्पष्ट है।"],
  ["sahayata", "सहायता", "help or assistance", "madad", "मुझे इस बिंदु पर थोड़ी सहायता चाहिए।"],
].map(([word, wordDev, meaning, simpleAlternative, exampleSentence]) => ({
  id: `seed-${word}`,
  word,
  wordDev,
  meaning,
  simpleAlternative,
  exampleSentence,
  savedAt: "2026-01-01",
  source: "seed" as const,
}));

export const emptyStateExamples = [
  { title: "Start with an elegant everyday word", body: "Save words like कार्य, प्रयास, and स्पष्ट as you practice." },
  { title: "Build by use, not memorization", body: "Each saved word should carry a sentence you would actually say." },
];

export function getDemoHints(limit = 4) {
  return hintPracticeSentences.slice(0, Math.max(0, limit));
}

export function getSeedLearnedWords(limit = seedLearnedWords.length) {
  return seedLearnedWords.slice(0, Math.max(0, limit));
}

export function getStarterWords(limit = 6) {
  return wordCorpus.slice(0, Math.max(0, limit));
}
