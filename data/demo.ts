import { wordCorpus } from "@/data/words";
import { makeHindiText } from "@/lib/hindi";
import type { LearnedWord, PracticeResponse, WordReplacement } from "@/types";

export const hintPracticeSentences = [
  makeHindiText(
    "हमने इस काम को जल्दी ख़त्म करने की कोशिश की।",
    "Humne is kaam ko jaldi khatam karne ki koshish ki.",
  ),
  makeHindiText(
    "मुझे आपकी मदद से problem का solution मिल गया।",
    "Mujhe aapki madad se problem ka solution mil gaya.",
  ),
  makeHindiText(
    "मेरा नज़रिया है कि यह decision important है।",
    "Mera nazariya hai ki yeh decision important hai.",
  ),
  makeHindiText(
    "इस topic पर थोड़ी confusion है, कृपया clear कर दीजिए।",
    "Is topic par thodi confusion hai, kripya clear kar dijiye.",
  ),
  makeHindiText(
    "मेरा goal Hindi expression में progress करना है।",
    "Mera goal Hindi expression mein progress karna hai.",
  ),
  makeHindiText(
    "Team को एक better plan और clear direction चाहिए।",
    "Team ko ek better plan aur clear direction chahiye.",
  ),
];

const replacementLibrary = [
  ["kaam", "काम", "karya", "कार्य", "work or purposeful task"],
  ["jaldi", "जल्दी", "sheeghra", "शीघ्र", "soon or without delay"],
  ["koshish", "कोशिश", "prayas", "प्रयास", "effort or attempt"],
  ["madad", "मदद", "sahayata", "सहायता", "help or assistance"],
  ["problem", "प्रॉब्लम", "samasya", "समस्या", "problem or issue"],
  ["solution", "सॉल्यूशन", "samadhan", "समाधान", "solution or resolution"],
  ["clear", "क्लियर", "spasht", "स्पष्ट", "clear"],
  ["confusion", "कन्फ़्यूज़न", "aspashtata", "अस्पष्टता", "lack of clarity"],
] as const;

function replacement(
  original: string,
  originalDev: string,
  upgraded: string,
  upgradedDev: string,
  meaning: string,
): WordReplacement {
  return {
    original: makeHindiText(originalDev, original, meaning),
    replacement: makeHindiText(upgradedDev, upgraded, meaning),
    meaning,
    whyBetter: `${upgraded} sentence ko zyada sundar aur spasht banata hai.`,
    naturalness: "formal",
  };
}

const defaultReplacements = replacementLibrary
  .slice(0, 3)
  .map(([original, originalDev, upgraded, upgradedDev, meaning]) =>
    replacement(original, originalDev, upgraded, upgradedDev, meaning),
  );

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
    .map(([original, originalDev, upgraded, upgradedDev, meaning]) =>
      replacement(original, originalDev, upgraded, upgradedDev, meaning),
    );
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

  // Demo mode has no transliteration engine, so the romanized sentence stands in
  // for both scripts. Real AI responses always carry proper Devanagari.
  return {
    transcript: cleanedTranscript,
    naturalElegantVersion: makeHindiText(
      elegantRoman,
      elegantRoman,
      "A more elegant version of the original sentence.",
    ),
    elevatedVersion: makeHindiText(
      elevatedRoman,
      elevatedRoman,
      "A more elevated version of the original sentence.",
    ),
    replacements,
    saveableWords: replacements.map((item) => ({
      word: item.replacement.roman,
      wordDev: item.replacement.dev,
      meaning: item.meaning,
      simpleAlternative: item.original.roman,
      exampleSentence: elegantRoman,
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
