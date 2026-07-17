import type { LearnedWord, PracticeResponse } from "@/types";
import { wordCorpus } from "@/data/words";

export const hintPracticeSentences = [
  "Humne is kaam ko jaldi khatam karne ki koshish ki.",
  "Mujhe aapki madad se problem ka solution mil gaya.",
  "Mera nazariya hai ki yeh decision important hai.",
  "Is topic par thodi confusion hai, kripya clear kar dijiye.",
  "Mera goal Hindi expression mein progress karna hai.",
  "Team ko ek better plan aur clear direction chahiye.",
];

export const defaultTransformationExample: PracticeResponse = {
  transcript: "Humne is kaam ko jaldi khatam karne ki koshish ki.",
  naturalPolishedVersion:
    "Humne is karya ko sheeghra samaapt karne ka prayas kiya.",
  elevatedVersion:
    "Humne is karya ko atishighra sampann karne ka gambhir prayatna kiya.",
  originalEleganceScore: 52,
  improvedEleganceScore: 84,
  feedback:
    "Baat wahi rahi, lekin shabd-chayan zyada spasht, vinamra, aur sajeev ho gaya.",
  replacements: [
    {
      original: "kaam",
      replacement: "karya",
      meaning: "work or purposeful task",
      whyBetter:
        "Karya sentence ko professional aur sthir dhvani deta hai.",
      naturalness: "formal",
    },
    {
      original: "jaldi",
      replacement: "sheeghra",
      meaning: "soon or without delay",
      whyBetter:
        "Sheeghra urgency ko calm aur polished tareeke se vyakt karta hai.",
      naturalness: "formal",
    },
    {
      original: "koshish",
      replacement: "prayas",
      meaning: "effort or attempt",
      whyBetter:
        "Prayas mehnat ko zyada garima aur saaf bhaav ke saath batata hai.",
      naturalness: "formal",
    },
  ],
  saveableWords: [
    {
      word: "karya",
      meaning: "work or purposeful task",
      simpleAlternative: "kaam",
      exampleSentence: "Humne is karya ko sheeghra samaapt kiya.",
    },
    {
      word: "sheeghra",
      meaning: "soon or without delay",
      simpleAlternative: "jaldi",
      exampleSentence: "Kripya mujhe sheeghra uttar dijiye.",
    },
    {
      word: "prayas",
      meaning: "effort or attempt",
      simpleAlternative: "koshish",
      exampleSentence: "Maine samjhaane ka prayas kiya.",
    },
  ],
};

export const seedLearnedWords: LearnedWord[] = [
  {
    id: "seed-karya",
    word: "karya",
    meaning: "work or purposeful task",
    simpleAlternative: "kaam",
    exampleSentence: "Humne is karya ko samay par poora kiya.",
    savedAt: "2026-01-01",
    source: "seed",
  },
  {
    id: "seed-prayas",
    word: "prayas",
    meaning: "effort or attempt",
    simpleAlternative: "koshish",
    exampleSentence: "Aapka har prayas aapki abhivyakti ko aur saaf banata hai.",
    savedAt: "2026-01-01",
    source: "seed",
  },
  {
    id: "seed-spasht",
    word: "spasht",
    meaning: "clear or explicit",
    simpleAlternative: "clear",
    exampleSentence: "Aapki baat ab bahut spasht hai.",
    savedAt: "2026-01-01",
    source: "seed",
  },
  {
    id: "seed-sahayata",
    word: "sahayata",
    meaning: "help or assistance",
    simpleAlternative: "madad",
    exampleSentence: "Mujhe is bindu par thodi sahayata chahiye.",
    savedAt: "2026-01-01",
    source: "seed",
  },
];

export const emptyStateExamples = [
  {
    title: "Start with a polished everyday word",
    body: "Save words like karya, prayas, and spasht as you practice.",
  },
  {
    title: "Build by use, not memorization",
    body: "Each saved word should carry a sentence you would actually say.",
  },
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
