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

const mockPracticeResponses: PracticeResponse[] = [
  defaultTransformationExample,
  {
    transcript: "Mujhe aapki madad se problem ka solution mil gaya.",
    naturalPolishedVersion:
      "Mujhe aapki sahayata se samasya ka samadhan mil gaya.",
    elevatedVersion:
      "Aapki sahayata se is samasya ka uchit samadhan praapt hua.",
    originalEleganceScore: 48,
    improvedEleganceScore: 82,
    feedback:
      "Sentence ka bhaav wahi hai, lekin English-mixed shabdon ki jagah spasht Hindi vikalp aane se tone zyada refined lagti hai.",
    replacements: [
      {
        original: "madad",
        replacement: "sahayata",
        meaning: "help or assistance",
        whyBetter:
          "Sahayata vinamra aur professional sandarbh mein zyada sundar lagta hai.",
        naturalness: "formal",
      },
      {
        original: "problem",
        replacement: "samasya",
        meaning: "problem or issue",
        whyBetter:
          "Samasya rozmarra ke saath-saath formal Hindi mein bhi natural hai.",
        naturalness: "formal",
      },
      {
        original: "solution",
        replacement: "samadhan",
        meaning: "solution or resolution",
        whyBetter:
          "Samadhan baat ko zyada poorn aur shisht dhvani deta hai.",
        naturalness: "formal",
      },
    ],
    saveableWords: [
      {
        word: "sahayata",
        meaning: "help or assistance",
        simpleAlternative: "madad",
        exampleSentence: "Mujhe is vishay mein aapki sahayata chahiye.",
      },
      {
        word: "samasya",
        meaning: "problem or issue",
        simpleAlternative: "problem",
        exampleSentence: "Is samasya par shaant hokar vichaar karte hain.",
      },
      {
        word: "samadhan",
        meaning: "solution or resolution",
        simpleAlternative: "solution",
        exampleSentence: "Humein iska uchit samadhan mil gaya.",
      },
    ],
  },
  {
    transcript: "Mera nazariya hai ki yeh decision important hai.",
    naturalPolishedVersion:
      "Mera drishtikon hai ki yeh nirnay avashyak hai.",
    elevatedVersion:
      "Mere drishtikon se yah nirnay atyant avashyak prateet hota hai.",
    originalEleganceScore: 46,
    improvedEleganceScore: 80,
    feedback:
      "Nazariya ko drishtikon aur decision ko nirnay karne se vakya zyada saaf, sthir, aur confident lagta hai.",
    replacements: [
      {
        original: "nazariya",
        replacement: "drishtikon",
        meaning: "perspective or point of view",
        whyBetter:
          "Drishtikon vichaar ko zyada mature aur precise tareeke se rakhta hai.",
        naturalness: "formal",
      },
      {
        original: "decision",
        replacement: "nirnay",
        meaning: "decision",
        whyBetter:
          "Nirnay Hindi mein natural aur polished dono lagta hai.",
        naturalness: "formal",
      },
      {
        original: "important",
        replacement: "avashyak",
        meaning: "necessary or important",
        whyBetter:
          "Avashyak zaroorat ko garima ke saath vyakt karta hai.",
        naturalness: "formal",
      },
    ],
    saveableWords: [
      {
        word: "drishtikon",
        meaning: "perspective or point of view",
        simpleAlternative: "nazariya",
        exampleSentence: "Mera drishtikon is vishay par thoda alag hai.",
      },
      {
        word: "nirnay",
        meaning: "decision",
        simpleAlternative: "decision",
        exampleSentence: "Yeh nirnay soch-samajhkar lena chahiye.",
      },
      {
        word: "avashyak",
        meaning: "necessary or important",
        simpleAlternative: "important",
        exampleSentence: "Is baat ko spasht karna avashyak hai.",
      },
    ],
  },
  {
    transcript: "Is topic par thodi confusion hai, kripya clear kar dijiye.",
    naturalPolishedVersion:
      "Is vishay par thodi aspashtata hai, kripya ise spasht kar dijiye.",
    elevatedVersion:
      "Is vishay mein kuch aspashtata hai; kripya ise spasht roop se samjha dijiye.",
    originalEleganceScore: 44,
    improvedEleganceScore: 81,
    feedback:
      "Topic, confusion, aur clear jaise shabdon ke Hindi vikalp sentence ko zyada ekroop aur vinamra bana dete hain.",
    replacements: [
      {
        original: "topic",
        replacement: "vishay",
        meaning: "topic or subject",
        whyBetter:
          "Vishay simple hai, lekin Hindi vakya mein turant polish laata hai.",
        naturalness: "formal",
      },
      {
        original: "confusion",
        replacement: "aspashtata",
        meaning: "lack of clarity",
        whyBetter:
          "Aspashtata confusion se zyada exact aur graceful lagta hai.",
        naturalness: "formal",
      },
      {
        original: "clear",
        replacement: "spasht",
        meaning: "clear",
        whyBetter:
          "Spasht ek chhota, natural, aur refined Hindi vikalp hai.",
        naturalness: "formal",
      },
    ],
    saveableWords: [
      {
        word: "vishay",
        meaning: "topic or subject",
        simpleAlternative: "topic",
        exampleSentence: "Is vishay par hum kal vichaar karenge.",
      },
      {
        word: "aspashtata",
        meaning: "lack of clarity",
        simpleAlternative: "confusion",
        exampleSentence: "Is bindu par abhi thodi aspashtata hai.",
      },
      {
        word: "spasht",
        meaning: "clear",
        simpleAlternative: "clear",
        exampleSentence: "Aapka sandesh ab spasht hai.",
      },
    ],
  },
  {
    transcript: "Mera goal Hindi expression mein progress karna hai.",
    naturalPolishedVersion:
      "Mera lakshya Hindi abhivyakti mein pragati karna hai.",
    elevatedVersion:
      "Mera lakshya Hindi abhivyakti ko aur adhik sashakt banana hai.",
    originalEleganceScore: 49,
    improvedEleganceScore: 83,
    feedback:
      "Goal, expression, aur progress ke Hindi roop sentence ko zyada kendrit aur aspirational bana dete hain.",
    replacements: [
      {
        original: "goal",
        replacement: "lakshya",
        meaning: "goal or aim",
        whyBetter:
          "Lakshya ambition ko polished Hindi mein seedhe tareeke se batata hai.",
        naturalness: "formal",
      },
      {
        original: "expression",
        replacement: "abhivyakti",
        meaning: "expression",
        whyBetter:
          "Abhivyakti bolne aur vyakt karne ki kala ko zyada sundar dhvani deta hai.",
        naturalness: "literary",
      },
      {
        original: "progress",
        replacement: "pragati",
        meaning: "progress",
        whyBetter:
          "Pragati growth ko graceful aur natural Hindi mein rakhta hai.",
        naturalness: "formal",
      },
    ],
    saveableWords: [
      {
        word: "lakshya",
        meaning: "goal or aim",
        simpleAlternative: "goal",
        exampleSentence: "Mera lakshya aur spasht bolna hai.",
      },
      {
        word: "abhivyakti",
        meaning: "expression",
        simpleAlternative: "expression",
        exampleSentence: "Aapki abhivyakti bahut saaf ho rahi hai.",
      },
      {
        word: "pragati",
        meaning: "progress",
        simpleAlternative: "progress",
        exampleSentence: "Roz thoda abhyas pragati laata hai.",
      },
    ],
  },
  {
    transcript: "Team ko ek better plan aur clear direction chahiye.",
    naturalPolishedVersion:
      "Team ko ek behtar yojana aur spasht disha chahiye.",
    elevatedVersion:
      "Team ko ek suvyavasthit yojana aur spasht disha ki avashyakta hai.",
    originalEleganceScore: 45,
    improvedEleganceScore: 82,
    feedback:
      "Better, plan, clear, aur direction ko Hindi vikalpon se badalne par sentence zyada composed aur leadership-ready lagta hai.",
    replacements: [
      {
        original: "better",
        replacement: "behtar",
        meaning: "better",
        whyBetter:
          "Behtar English sense ko natural Hindustani flow mein rakhta hai.",
        naturalness: "common",
      },
      {
        original: "plan",
        replacement: "yojana",
        meaning: "plan",
        whyBetter:
          "Yojana formal baat-cheet mein plan ka elegant vikalp hai.",
        naturalness: "formal",
      },
      {
        original: "direction",
        replacement: "disha",
        meaning: "direction",
        whyBetter:
          "Disha short, memorable, aur professional lagta hai.",
        naturalness: "formal",
      },
    ],
    saveableWords: [
      {
        word: "behtar",
        meaning: "better",
        simpleAlternative: "better",
        exampleSentence: "Humein iske liye behtar tareeka chahiye.",
      },
      {
        word: "yojana",
        meaning: "plan",
        simpleAlternative: "plan",
        exampleSentence: "Yeh yojana practical aur spasht hai.",
      },
      {
        word: "disha",
        meaning: "direction",
        simpleAlternative: "direction",
        exampleSentence: "Is project ko ab spasht disha mil gayi hai.",
      },
    ],
  },
];

const replacementLibrary = [
  {
    original: "kaam",
    replacement: "karya",
    meaning: "work or purposeful task",
  },
  {
    original: "jaldi",
    replacement: "sheeghra",
    meaning: "soon or without delay",
  },
  {
    original: "koshish",
    replacement: "prayas",
    meaning: "effort or attempt",
  },
  {
    original: "madad",
    replacement: "sahayata",
    meaning: "help or assistance",
  },
  {
    original: "problem",
    replacement: "samasya",
    meaning: "problem or issue",
  },
  {
    original: "solution",
    replacement: "samadhan",
    meaning: "solution or resolution",
  },
  {
    original: "clear",
    replacement: "spasht",
    meaning: "clear",
  },
  {
    original: "confusion",
    replacement: "aspashtata",
    meaning: "lack of clarity",
  },
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSentence(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getMockPracticeResponse(transcript: string): PracticeResponse {
  const cleanedTranscript = transcript.trim();
  const exactMatch = mockPracticeResponses.find(
    (response) => normalizeSentence(response.transcript) === normalizeSentence(cleanedTranscript),
  );

  if (exactMatch) {
    return exactMatch;
  }

  const foundReplacements = replacementLibrary
    .filter(({ original }) => new RegExp(`\\b${escapeRegex(original)}\\b`, "i").test(cleanedTranscript))
    .slice(0, 3)
    .map(({ original, replacement, meaning }) => ({
      original,
      replacement,
      meaning,
      whyBetter: `${replacement} sentence ko zyada polished aur spasht banata hai.`,
      naturalness: "formal" as const,
    }));

  const replacements =
    foundReplacements.length > 0
      ? foundReplacements
      : defaultTransformationExample.replacements.slice(0, 2);
  const naturalPolishedVersion = replacements.reduce(
    (sentence, replacement) =>
      sentence.replace(
        new RegExp(`\\b${escapeRegex(replacement.original)}\\b`, "gi"),
        replacement.replacement,
      ),
    cleanedTranscript,
  );
  const improvedSentence =
    naturalPolishedVersion === cleanedTranscript
      ? `${cleanedTranscript} Is baat ko thoda aur spasht aur vinamra roop se kaha ja sakta hai.`
      : naturalPolishedVersion;

  return {
    transcript: cleanedTranscript,
    naturalPolishedVersion: improvedSentence,
    elevatedVersion:
      improvedSentence === cleanedTranscript
        ? `${cleanedTranscript} Kripya is vichaar ko aur spasht roop se vyakt kijiye.`
        : improvedSentence
            .replace(/\bsheeghra\b/gi, "atishighra")
            .replace(/\bprayas\b/gi, "gambhir prayatna")
            .replace(/\bsamadhan\b/gi, "uchit samadhan"),
    originalEleganceScore: cleanedTranscript.length < 28 ? 42 : 50,
    improvedEleganceScore: cleanedTranscript.length < 28 ? 68 : 78,
    feedback:
      "Mock practice ne aapke sentence mein polish ke liye upyogi shabd-chayan dikhaya hai. Is flow mein AI ki jagah deterministic demo data use ho raha hai.",
    replacements,
    saveableWords: replacements.map((replacement) => ({
      word: replacement.replacement,
      meaning: replacement.meaning,
      simpleAlternative: replacement.original,
      exampleSentence: improvedSentence,
    })),
  };
}

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
