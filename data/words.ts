import { bilingualWordEntry, type LegacyWordEntry } from "@/data/bilingual-corpus";
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
  synonyms: ["kaarya", "kartavya", "prayojan"],
  usageNote:
    "Karya sounds polished but remains natural for everyday professional speech.",
  challengePrompt:
    "Apne din ke kisi mahatvapurn karya ke baare mein ek vaakya kahiye.",
  tags: ["work", "daily speech", "professional"],
  difficulty: "easy",
};

export const fallbackWordEntry: WordEntry = bilingualWordEntry(legacyFallbackWordEntry);

const legacyWordCorpus = [
  {
    id: "karya",
    common: "kaam",
    elevated: "karya",
    englishMeaning: "work, task, or purposeful action",
    simpleExample: "Humne is kaam ko jaldi khatam kiya.",
    elevatedExample: "Humne is karya ko sheeghra samaapt kiya.",
    synonyms: ["kaarya", "kartavya", "prayojan"],
    usageNote:
      "Karya gives ordinary work a composed, purposeful tone without sounding heavy.",
    challengePrompt:
      "Aaj ke kisi mahatvapurn karya par ek spasht vaakya banaiye.",
    tags: ["work", "daily speech", "professional"],
    difficulty: "easy",
  },
  {
    id: "prayas",
    common: "koshish",
    elevated: "prayas",
    englishMeaning: "effort or attempt",
    simpleExample: "Maine samjhaane ki koshish ki.",
    elevatedExample: "Maine samjhaane ka prayas kiya.",
    synonyms: ["yatna", "mehnat", "chesta"],
    usageNote:
      "Prayas is graceful in speech and writing, especially when describing sincere effort.",
    challengePrompt:
      "Kisi aise prayas ka zikr kijiye jisse aapko sudhaar mehsoos hua.",
    tags: ["effort", "self improvement", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "sheeghra",
    common: "jaldi",
    elevated: "sheeghra",
    englishMeaning: "soon, quickly, or without delay",
    simpleExample: "Kripya mujhe jaldi jawab dijiye.",
    elevatedExample: "Kripya mujhe sheeghra uttar dijiye.",
    synonyms: ["turant", "tatkaal", "jaldi"],
    usageNote:
      "Sheeghra feels courteous and precise; use it when speed matters but the tone should stay calm.",
    challengePrompt:
      "Sheeghra shabd ka prayog karte hue kisi vinamra nivedan ka vaakya kahiye.",
    tags: ["time", "polite speech", "requests"],
    difficulty: "easy",
  },
  {
    id: "arth",
    common: "matlab",
    elevated: "arth",
    englishMeaning: "meaning or significance",
    simpleExample: "Is baat ka matlab kya hai?",
    elevatedExample: "Is baat ka arth kya hai?",
    synonyms: ["maayne", "bhaav", "tatparya"],
    usageNote:
      "Arth is concise and polished, useful whenever you are clarifying meaning.",
    challengePrompt:
      "Arth shabd ka prayog karte hue kisi vichaar ko samjhaiye.",
    tags: ["meaning", "clarity", "conversation"],
    difficulty: "easy",
  },
  {
    id: "arthaat",
    common: "yaani",
    elevated: "arthaat",
    englishMeaning: "that is, namely, or in other words",
    simpleExample: "Yaani humein ab faisla lena hoga.",
    elevatedExample: "Arthaat humein ab nirnay lena hoga.",
    synonyms: ["yaani", "tatparya yeh hai", "is arth mein"],
    usageNote:
      "Arthaat is best for explaining or restating a point with poise.",
    challengePrompt:
      "Arthaat ka prayog karke kisi baat ko aur spasht kijiye.",
    tags: ["clarity", "explanation", "formal"],
    difficulty: "medium",
  },
  {
    id: "vichaar",
    common: "soch",
    elevated: "vichaar",
    englishMeaning: "thought, idea, or considered view",
    simpleExample: "Meri soch thodi alag hai.",
    elevatedExample: "Mera vichaar thoda alag hai.",
    synonyms: ["raay", "manan", "drishti"],
    usageNote:
      "Vichaar sounds mature and reflective, especially for opinions and ideas.",
    challengePrompt:
      "Kisi vishay par apna vichaar ek santulit vaakya mein kahiye.",
    tags: ["ideas", "opinion", "reflection"],
    difficulty: "easy",
  },
  {
    id: "drishtikon",
    common: "nazariya",
    elevated: "drishtikon",
    englishMeaning: "perspective or point of view",
    simpleExample: "Aapka nazariya samajhna zaroori hai.",
    elevatedExample: "Aapka drishtikon samajhna avashyak hai.",
    synonyms: ["drishti", "raay", "pariprekshya"],
    usageNote:
      "Drishtikon is ideal for thoughtful discussions where perspective matters.",
    challengePrompt:
      "Apne drishtikon ko ek vinamra vaakya mein vyakt kijiye.",
    tags: ["perspective", "discussion", "professional"],
    difficulty: "medium",
  },
  {
    id: "uchit",
    common: "sahi",
    elevated: "uchit",
    englishMeaning: "appropriate, proper, or suitable",
    simpleExample: "Yeh sahi samay nahi hai.",
    elevatedExample: "Yeh uchit samay nahi hai.",
    synonyms: ["upayukt", "theek", "anukul"],
    usageNote:
      "Uchit adds tact when you want to say something is right or suitable.",
    challengePrompt:
      "Uchit shabd ka prayog karke kisi salah ka vaakya banaiye.",
    tags: ["judgment", "advice", "polite speech"],
    difficulty: "easy",
  },
  {
    id: "avashyak",
    common: "zaroori",
    elevated: "avashyak",
    englishMeaning: "necessary or essential",
    simpleExample: "Yeh baat samajhna zaroori hai.",
    elevatedExample: "Yeh baat samajhna avashyak hai.",
    synonyms: ["aavashyak", "anivarya", "mahatvapurn"],
    usageNote:
      "Avashyak sounds clear and composed without becoming too formal.",
    challengePrompt:
      "Kisi avashyak kaam ke baare mein ek seedha vaakya kahiye.",
    tags: ["importance", "clarity", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "sahayata",
    common: "madad",
    elevated: "sahayata",
    englishMeaning: "help or assistance",
    simpleExample: "Mujhe thodi madad chahiye.",
    elevatedExample: "Mujhe thodi sahayata chahiye.",
    synonyms: ["madad", "sahyog", "samarthan"],
    usageNote:
      "Sahayata keeps a request respectful and polished.",
    challengePrompt:
      "Sahayata maangte hue ek vinamra vaakya taiyar kijiye.",
    tags: ["help", "requests", "polite speech"],
    difficulty: "easy",
  },
  {
    id: "samasya",
    common: "problem",
    elevated: "samasya",
    englishMeaning: "problem, issue, or difficulty",
    simpleExample: "Is project mein ek problem aa gayi hai.",
    elevatedExample: "Is project mein ek samasya aa gayi hai.",
    synonyms: ["pareshani", "dikkat", "vighn"],
    usageNote:
      "Samasya replaces English-mixed phrasing cleanly while staying common in spoken Hindi.",
    challengePrompt:
      "Kisi chhoti samasya ko shaant bhaav se varnit kijiye.",
    tags: ["problem solving", "professional", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "samadhan",
    common: "solution",
    elevated: "samadhan",
    englishMeaning: "solution or resolution",
    simpleExample: "Humein iska solution mil gaya.",
    elevatedExample: "Humein iska samadhan mil gaya.",
    synonyms: ["hal", "upay", "nivarana"],
    usageNote:
      "Samadhan is natural in meetings, planning, and thoughtful conversation.",
    challengePrompt:
      "Samadhan shabd ka prayog karte hue kisi upay ka vaakya kahiye.",
    tags: ["problem solving", "professional", "clarity"],
    difficulty: "easy",
  },
  {
    id: "spasht",
    common: "clear",
    elevated: "spasht",
    englishMeaning: "clear, evident, or explicit",
    simpleExample: "Aapki baat ab clear hai.",
    elevatedExample: "Aapki baat ab spasht hai.",
    synonyms: ["saaf", "prakat", "sugam"],
    usageNote:
      "Spasht is a useful everyday upgrade for clarity without sounding stiff.",
    challengePrompt:
      "Spasht shabd ke saath kisi nirdesh ya vichaar ko kahiye.",
    tags: ["clarity", "communication", "professional"],
    difficulty: "easy",
  },
  {
    id: "aspashtata",
    common: "confusion",
    elevated: "aspashtata",
    englishMeaning: "lack of clarity or ambiguity",
    simpleExample: "Is point par thodi confusion hai.",
    elevatedExample: "Is bindu par thodi aspashtata hai.",
    synonyms: ["uljhan", "asmanjas", "sandigdhata"],
    usageNote:
      "Aspashtata names confusion gracefully, especially when you want to stay diplomatic.",
    challengePrompt:
      "Aspashtata door karne ke liye ek vinamra vaakya banaiye.",
    tags: ["clarity", "meetings", "professional"],
    difficulty: "medium",
  },
  {
    id: "nirnay",
    common: "faisla",
    elevated: "nirnay",
    englishMeaning: "decision",
    simpleExample: "Humein aaj faisla lena hai.",
    elevatedExample: "Humein aaj nirnay lena hai.",
    synonyms: ["faisla", "nishchay", "tai"],
    usageNote:
      "Nirnay is polished and common enough for everyday formal speech.",
    challengePrompt:
      "Nirnay shabd ka prayog karte hue ek sthir vaakya kahiye.",
    tags: ["decision", "planning", "professional"],
    difficulty: "easy",
  },
  {
    id: "samay",
    common: "time",
    elevated: "samay",
    englishMeaning: "time",
    simpleExample: "Mere paas time kam hai.",
    elevatedExample: "Mere paas samay kam hai.",
    synonyms: ["waqt", "avasar", "ghadi"],
    usageNote:
      "Samay is one of the easiest upgrades from English-mixed everyday Hindi.",
    challengePrompt:
      "Samay ka samman dikhate hue ek chhota vaakya kahiye.",
    tags: ["time", "daily speech", "planning"],
    difficulty: "easy",
  },
  {
    id: "avasar",
    common: "mauka",
    elevated: "avasar",
    englishMeaning: "opportunity or occasion",
    simpleExample: "Mujhe bolne ka mauka mila.",
    elevatedExample: "Mujhe bolne ka avasar mila.",
    synonyms: ["mauka", "sandhi", "avkaash"],
    usageNote:
      "Avasar sounds optimistic and cultured while staying easy to understand.",
    challengePrompt:
      "Kisi naye avasar ke baare mein ek utsaahbhara vaakya kahiye.",
    tags: ["opportunity", "growth", "positive"],
    difficulty: "easy",
  },
  {
    id: "sambhav",
    common: "possible",
    elevated: "sambhav",
    englishMeaning: "possible or feasible",
    simpleExample: "Yeh kaam possible hai.",
    elevatedExample: "Yeh karya sambhav hai.",
    synonyms: ["mumkin", "sakya", "ho sakta hai"],
    usageNote:
      "Sambhav keeps the sentence Hindi-forward and confident.",
    challengePrompt:
      "Sambhav shabd ka prayog karte hue kisi yojana par vaakya banaiye.",
    tags: ["planning", "confidence", "professional"],
    difficulty: "easy",
  },
  {
    id: "asambhav",
    common: "impossible",
    elevated: "asambhav",
    englishMeaning: "impossible or not feasible",
    simpleExample: "Itni jaldi yeh impossible hai.",
    elevatedExample: "Itni sheeghra yeh asambhav hai.",
    synonyms: ["namumkin", "durlabh", "akarya"],
    usageNote:
      "Asambhav is direct but composed; pair it with a reason for a softer tone.",
    challengePrompt:
      "Asambhav shabd ka prayog karte hue ek vinamra seema batayiye.",
    tags: ["limits", "planning", "professional"],
    difficulty: "medium",
  },
  {
    id: "sujhav",
    common: "suggestion",
    elevated: "sujhav",
    englishMeaning: "suggestion or recommendation",
    simpleExample: "Mera ek suggestion hai.",
    elevatedExample: "Mera ek sujhav hai.",
    synonyms: ["salah", "paramarsh", "raay"],
    usageNote:
      "Sujhav sounds collaborative and clear in group conversations.",
    challengePrompt:
      "Sujhav dete hue ek sahaj aur vinamra vaakya kahiye.",
    tags: ["advice", "collaboration", "professional"],
    difficulty: "easy",
  },
  {
    id: "uttar",
    common: "jawab",
    elevated: "uttar",
    englishMeaning: "answer or response",
    simpleExample: "Mujhe iska jawab nahi mila.",
    elevatedExample: "Mujhe iska uttar nahi mila.",
    synonyms: ["pratikriya", "jawab", "samadhan"],
    usageNote:
      "Uttar is especially good when asking or responding politely.",
    challengePrompt:
      "Uttar shabd ka prayog karte hue ek prashn ka sandarbh dijiye.",
    tags: ["response", "communication", "polite speech"],
    difficulty: "easy",
  },
  {
    id: "prashn",
    common: "sawaal",
    elevated: "prashn",
    englishMeaning: "question",
    simpleExample: "Mera ek sawaal hai.",
    elevatedExample: "Mera ek prashn hai.",
    synonyms: ["sawaal", "jigyasa", "puchh-taach"],
    usageNote:
      "Prashn is familiar, clean, and suitable for classrooms, meetings, and talks.",
    challengePrompt:
      "Prashn shabd ka prayog karte hue ek vinamra sawaal poochhiye.",
    tags: ["questions", "learning", "communication"],
    difficulty: "easy",
  },
  {
    id: "uttam",
    common: "bahut achchha",
    elevated: "uttam",
    englishMeaning: "excellent or very good",
    simpleExample: "Aapka kaam bahut achchha hai.",
    elevatedExample: "Aapka karya uttam hai.",
    synonyms: ["shreshth", "badhiya", "sarvottam"],
    usageNote:
      "Uttam is appreciative and refined; use it for genuine praise.",
    challengePrompt:
      "Uttam shabd ka prayog karte hue kisi ka sarahniya kaam batayiye.",
    tags: ["praise", "positive", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "sundar",
    common: "achchha",
    elevated: "sundar",
    englishMeaning: "beautiful, graceful, or pleasant",
    simpleExample: "Aapne achchhi baat kahi.",
    elevatedExample: "Aapne sundar baat kahi.",
    synonyms: ["manohar", "sushobhit", "sajag"],
    usageNote:
      "Sundar can praise words, ideas, or gestures, not only appearance.",
    challengePrompt:
      "Sundar shabd ka prayog karke kisi vichaar ki prashansa kijiye.",
    tags: ["praise", "expression", "positive"],
    difficulty: "easy",
  },
  {
    id: "sahaj",
    common: "easy",
    elevated: "sahaj",
    englishMeaning: "easy, natural, or effortless",
    simpleExample: "Yeh tareeka easy hai.",
    elevatedExample: "Yeh tareeka sahaj hai.",
    synonyms: ["saral", "sugam", "prakritik"],
    usageNote:
      "Sahaj is warmer than easy and suggests natural simplicity.",
    challengePrompt:
      "Sahaj shabd ka prayog karte hue kisi prakriya ko varnit kijiye.",
    tags: ["ease", "process", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "kathin",
    common: "mushkil",
    elevated: "kathin",
    englishMeaning: "difficult or demanding",
    simpleExample: "Yeh kaam mushkil hai.",
    elevatedExample: "Yeh karya kathin hai.",
    synonyms: ["dushkar", "kashtkar", "jatil"],
    usageNote:
      "Kathin is clear and balanced; it names difficulty without sounding dramatic.",
    challengePrompt:
      "Kathin shabd ka prayog karte hue kisi chunauti par vaakya kahiye.",
    tags: ["difficulty", "challenge", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "sankalp",
    common: "iraada",
    elevated: "sankalp",
    englishMeaning: "resolve or firm intention",
    simpleExample: "Mera iraada roz padhne ka hai.",
    elevatedExample: "Mera sankalp roz padhne ka hai.",
    synonyms: ["nishchay", "pratigya", "dridh ichchha"],
    usageNote:
      "Sankalp adds strength and dignity when speaking about commitment.",
    challengePrompt:
      "Apne kisi sankalp ko ek saaf vaakya mein vyakt kijiye.",
    tags: ["commitment", "self improvement", "motivation"],
    difficulty: "medium",
  },
  {
    id: "anubhav",
    common: "experience",
    elevated: "anubhav",
    englishMeaning: "experience",
    simpleExample: "Mera experience achchha raha.",
    elevatedExample: "Mera anubhav achchha raha.",
    synonyms: ["tajurba", "anubhuti", "gyaan"],
    usageNote:
      "Anubhav is natural in both personal reflection and professional settings.",
    challengePrompt:
      "Kisi yaadgaar anubhav ke baare mein ek vaakya kahiye.",
    tags: ["experience", "reflection", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "samvaad",
    common: "baatcheet",
    elevated: "samvaad",
    englishMeaning: "dialogue or meaningful conversation",
    simpleExample: "Humein is par baatcheet karni chahiye.",
    elevatedExample: "Humein is par samvaad karna chahiye.",
    synonyms: ["vaarta", "baatcheet", "charcha"],
    usageNote:
      "Samvaad suggests respectful exchange, not just casual talking.",
    challengePrompt:
      "Samvaad shabd ka prayog karke kisi zaroori baatcheet ka zikr kijiye.",
    tags: ["conversation", "respect", "collaboration"],
    difficulty: "medium",
  },
  {
    id: "charcha",
    common: "discussion",
    elevated: "charcha",
    englishMeaning: "discussion or deliberation",
    simpleExample: "Kal is topic par discussion hoga.",
    elevatedExample: "Kal is vishay par charcha hogi.",
    synonyms: ["samvaad", "vichar-vimarsh", "vaarta"],
    usageNote:
      "Charcha is familiar and polished for meetings, classes, and family decisions.",
    challengePrompt:
      "Charcha shabd ka prayog karte hue kisi vishay ka ullekh kijiye.",
    tags: ["discussion", "meetings", "learning"],
    difficulty: "easy",
  },
  {
    id: "vishay",
    common: "topic",
    elevated: "vishay",
    englishMeaning: "topic or subject",
    simpleExample: "Aaj ka topic bahut interesting hai.",
    elevatedExample: "Aaj ka vishay bahut rochak hai.",
    synonyms: ["mudda", "prasang", "adhyay"],
    usageNote:
      "Vishay is a clean replacement for topic in most Hindi conversations.",
    challengePrompt:
      "Vishay shabd ke saath kisi charcha ka aarambh kijiye.",
    tags: ["topic", "learning", "clarity"],
    difficulty: "easy",
  },
  {
    id: "rochak",
    common: "interesting",
    elevated: "rochak",
    englishMeaning: "interesting or engaging",
    simpleExample: "Yeh kahani interesting hai.",
    elevatedExample: "Yeh kahani rochak hai.",
    synonyms: ["dilchasp", "manohar", "akarshak"],
    usageNote:
      "Rochak is lively but still polished; it works well for stories and ideas.",
    challengePrompt:
      "Rochak shabd ka prayog karte hue kisi kahani ya vichaar ka varnan kijiye.",
    tags: ["interest", "stories", "expression"],
    difficulty: "easy",
  },
  {
    id: "mahatvapurn",
    common: "important",
    elevated: "mahatvapurn",
    englishMeaning: "important or significant",
    simpleExample: "Yeh meeting important hai.",
    elevatedExample: "Yeh baithak mahatvapurn hai.",
    synonyms: ["avashyak", "pramukh", "mool"],
    usageNote:
      "Mahatvapurn is useful when you want emphasis without exaggeration.",
    challengePrompt:
      "Mahatvapurn shabd ka prayog karte hue kisi prathamikta ko batayiye.",
    tags: ["importance", "professional", "planning"],
    difficulty: "easy",
  },
  {
    id: "pramukh",
    common: "main",
    elevated: "pramukh",
    englishMeaning: "main, chief, or primary",
    simpleExample: "Yeh hamara main goal hai.",
    elevatedExample: "Yeh hamara pramukh lakshya hai.",
    synonyms: ["mukhya", "mool", "kendriya"],
    usageNote:
      "Pramukh helps replace English-mixed main while keeping the sentence concise.",
    challengePrompt:
      "Pramukh shabd ke saath apni kisi priority ka vaakya banaiye.",
    tags: ["priority", "planning", "professional"],
    difficulty: "easy",
  },
  {
    id: "lakshya",
    common: "goal",
    elevated: "lakshya",
    englishMeaning: "goal or objective",
    simpleExample: "Mera goal Hindi sudhaarna hai.",
    elevatedExample: "Mera lakshya Hindi sudhaarna hai.",
    synonyms: ["uddeshya", "manzil", "dhyey"],
    usageNote:
      "Lakshya feels purposeful and is common in aspirational speech.",
    challengePrompt:
      "Apne kisi lakshya ko ek prernaadayak vaakya mein kahiye.",
    tags: ["goals", "motivation", "self improvement"],
    difficulty: "easy",
  },
  {
    id: "uddeshya",
    common: "purpose",
    elevated: "uddeshya",
    englishMeaning: "purpose or intent",
    simpleExample: "Is kaam ka purpose kya hai?",
    elevatedExample: "Is karya ka uddeshya kya hai?",
    synonyms: ["maqsad", "prayojan", "lakshya"],
    usageNote:
      "Uddeshya adds depth when explaining why something matters.",
    challengePrompt:
      "Uddeshya shabd ka prayog karte hue kisi kaam ka kaaran batayiye.",
    tags: ["purpose", "clarity", "reflection"],
    difficulty: "medium",
  },
  {
    id: "parinaam",
    common: "result",
    elevated: "parinaam",
    englishMeaning: "result or outcome",
    simpleExample: "Iska result achchha aaya.",
    elevatedExample: "Iska parinaam achchha aaya.",
    synonyms: ["natija", "phal", "prabhav"],
    usageNote:
      "Parinaam is polished and familiar, especially for outcomes and consequences.",
    challengePrompt:
      "Parinaam shabd ka prayog karte hue kisi kriya ka asar batayiye.",
    tags: ["results", "consequence", "professional"],
    difficulty: "easy",
  },
  {
    id: "prabhav",
    common: "impact",
    elevated: "prabhav",
    englishMeaning: "impact, influence, or effect",
    simpleExample: "Is decision ka impact bada hoga.",
    elevatedExample: "Is nirnay ka prabhav bada hoga.",
    synonyms: ["asar", "parinaam", "prerak bal"],
    usageNote:
      "Prabhav is strong but natural, useful for decisions and communication.",
    challengePrompt:
      "Prabhav shabd ka prayog karke kisi nirnay ke asar ko kahiye.",
    tags: ["impact", "decision", "professional"],
    difficulty: "medium",
  },
  {
    id: "sambandh",
    common: "relation",
    elevated: "sambandh",
    englishMeaning: "relationship or connection",
    simpleExample: "Is baat ka hamare kaam se relation hai.",
    elevatedExample: "Is baat ka hamare karya se sambandh hai.",
    synonyms: ["rishta", "jod", "nataa"],
    usageNote:
      "Sambandh neatly expresses connection between ideas, people, or topics.",
    challengePrompt:
      "Sambandh shabd ka prayog karte hue do baaton ko jodiye.",
    tags: ["connection", "ideas", "communication"],
    difficulty: "easy",
  },
  {
    id: "vishwas",
    common: "trust",
    elevated: "vishwas",
    englishMeaning: "trust or belief",
    simpleExample: "Mujhe aap par trust hai.",
    elevatedExample: "Mujhe aap par vishwas hai.",
    synonyms: ["bharosa", "aastha", "shraddha"],
    usageNote:
      "Vishwas is warm, direct, and suitable for personal or professional trust.",
    challengePrompt:
      "Vishwas shabd ka prayog karte hue ek sakaratmak vaakya kahiye.",
    tags: ["trust", "relationships", "positive"],
    difficulty: "easy",
  },
  {
    id: "aadar",
    common: "respect",
    elevated: "aadar",
    englishMeaning: "respect or regard",
    simpleExample: "Main aapki mehnat ka respect karta hoon.",
    elevatedExample: "Main aapki mehnat ka aadar karta hoon.",
    synonyms: ["samman", "maan", "shraddha"],
    usageNote:
      "Aadar is slightly softer than samman and works well for sincere appreciation.",
    challengePrompt:
      "Aadar shabd ka prayog karke kisi ki mehnat ko sarahiye.",
    tags: ["respect", "relationships", "appreciation"],
    difficulty: "easy",
  },
  {
    id: "samman",
    common: "izzat",
    elevated: "samman",
    englishMeaning: "honor or respect",
    simpleExample: "Humein sabki izzat karni chahiye.",
    elevatedExample: "Humein sabka samman karna chahiye.",
    synonyms: ["aadar", "maan", "gaurav"],
    usageNote:
      "Samman is dignified and widely understood in everyday speech.",
    challengePrompt:
      "Samman shabd ke saath ek samvedansheel vaakya kahiye.",
    tags: ["respect", "values", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "sanyam",
    common: "control",
    elevated: "sanyam",
    englishMeaning: "restraint, composure, or self-control",
    simpleExample: "Gusse mein control rakhna chahiye.",
    elevatedExample: "Gusse mein sanyam rakhna chahiye.",
    synonyms: ["niyantran", "dhairya", "santulan"],
    usageNote:
      "Sanyam is elegant for emotional balance and disciplined conduct.",
    challengePrompt:
      "Sanyam shabd ka prayog karte hue kisi kathin pal ka varnan kijiye.",
    tags: ["emotion", "discipline", "values"],
    difficulty: "medium",
  },
  {
    id: "dhairya",
    common: "patience",
    elevated: "dhairya",
    englishMeaning: "patience or calm endurance",
    simpleExample: "Is kaam mein patience chahiye.",
    elevatedExample: "Is karya mein dhairya chahiye.",
    synonyms: ["sabr", "sahan-shakti", "sanyam"],
    usageNote:
      "Dhairya feels steady and thoughtful, especially during challenges.",
    challengePrompt:
      "Dhairya shabd ka prayog karte hue ek shaant salah dijiye.",
    tags: ["patience", "challenge", "values"],
    difficulty: "easy",
  },
  {
    id: "sahas",
    common: "himmat",
    elevated: "sahas",
    englishMeaning: "courage",
    simpleExample: "Sach bolne ke liye himmat chahiye.",
    elevatedExample: "Sach bolne ke liye sahas chahiye.",
    synonyms: ["himmat", "veerata", "nirbhayata"],
    usageNote:
      "Sahas gives courage a dignified, inspiring tone.",
    challengePrompt:
      "Sahas shabd ka prayog karte hue kisi sahi nirnay ka zikr kijiye.",
    tags: ["courage", "values", "motivation"],
    difficulty: "easy",
  },
  {
    id: "zimmedari",
    common: "responsibility",
    elevated: "zimmedari",
    englishMeaning: "responsibility or accountability",
    simpleExample: "Yeh meri responsibility hai.",
    elevatedExample: "Yeh meri zimmedari hai.",
    synonyms: ["uttardayitva", "kartavya", "farz"],
    usageNote:
      "Zimmedari is natural, strong, and useful for ownership.",
    challengePrompt:
      "Zimmedari shabd ka prayog karte hue apni bhumika batayiye.",
    tags: ["responsibility", "work", "values"],
    difficulty: "easy",
  },
  {
    id: "vinamra",
    common: "polite",
    elevated: "vinamra",
    englishMeaning: "polite or humble",
    simpleExample: "Aapka tone polite tha.",
    elevatedExample: "Aapka swar vinamra tha.",
    synonyms: ["namra", "sabhya", "shisht"],
    usageNote:
      "Vinamra is excellent for describing tone, requests, and behavior.",
    challengePrompt:
      "Vinamra shabd ka prayog karte hue ek nivedan kijiye.",
    tags: ["politeness", "tone", "requests"],
    difficulty: "easy",
  },
  {
    id: "sabhya",
    common: "decent",
    elevated: "sabhya",
    englishMeaning: "civil, courteous, or refined",
    simpleExample: "Unka vyavahar decent tha.",
    elevatedExample: "Unka vyavahar sabhya tha.",
    synonyms: ["shisht", "sanskari", "vinamra"],
    usageNote:
      "Sabhya describes conduct that is courteous and socially graceful.",
    challengePrompt:
      "Sabhya shabd ke saath achchhe vyavahar ka vaakya banaiye.",
    tags: ["conduct", "politeness", "values"],
    difficulty: "medium",
  },
  {
    id: "vyavahar",
    common: "behavior",
    elevated: "vyavahar",
    englishMeaning: "behavior or conduct",
    simpleExample: "Unka behavior bahut achchha hai.",
    elevatedExample: "Unka vyavahar bahut achchha hai.",
    synonyms: ["aacharan", "bartav", "ravayya"],
    usageNote:
      "Vyavahar is common and refined, useful for personal and social settings.",
    challengePrompt:
      "Vyavahar shabd ka prayog karte hue kisi gun ka varnan kijiye.",
    tags: ["conduct", "relationships", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "parivartan",
    common: "change",
    elevated: "parivartan",
    englishMeaning: "change or transformation",
    simpleExample: "Humein system mein change chahiye.",
    elevatedExample: "Humein vyavastha mein parivartan chahiye.",
    synonyms: ["badlav", "rupantaran", "sanshodhan"],
    usageNote:
      "Parivartan sounds constructive, especially for improvement and reform.",
    challengePrompt:
      "Parivartan shabd ka prayog karke kisi sudhaar ka zikr kijiye.",
    tags: ["change", "improvement", "planning"],
    difficulty: "easy",
  },
  {
    id: "sudhaar",
    common: "improvement",
    elevated: "sudhaar",
    englishMeaning: "improvement or correction",
    simpleExample: "Is sentence mein improvement ho sakti hai.",
    elevatedExample: "Is vaakya mein sudhaar ho sakta hai.",
    synonyms: ["unnati", "sansthan", "behtari"],
    usageNote:
      "Sudhaar is supportive and practical; it fits the app's aspirational tone.",
    challengePrompt:
      "Sudhaar shabd ka prayog karte hue ek rachanatmak vaakya kahiye.",
    tags: ["improvement", "learning", "feedback"],
    difficulty: "easy",
  },
  {
    id: "unnati",
    common: "progress",
    elevated: "unnati",
    englishMeaning: "progress or advancement",
    simpleExample: "Aapki Hindi mein progress dikh rahi hai.",
    elevatedExample: "Aapki Hindi mein unnati dikh rahi hai.",
    synonyms: ["pragati", "vikas", "sudhaar"],
    usageNote:
      "Unnati has an aspirational quality and works beautifully for learning.",
    challengePrompt:
      "Unnati shabd ka prayog karte hue apni seekh par vaakya kahiye.",
    tags: ["progress", "learning", "motivation"],
    difficulty: "easy",
  },
  {
    id: "yojana",
    common: "plan",
    elevated: "yojana",
    englishMeaning: "plan or scheme",
    simpleExample: "Hamari plan simple hai.",
    elevatedExample: "Hamari yojana saral hai.",
    synonyms: ["rananeeti", "vidhi", "karyakram"],
    usageNote:
      "Yojana is a natural Hindi replacement for plan in everyday contexts.",
    challengePrompt:
      "Yojana shabd ka prayog karte hue agle kadam ka varnan kijiye.",
    tags: ["planning", "work", "daily speech"],
    difficulty: "easy",
  },
  {
    id: "disha",
    common: "direction",
    elevated: "disha",
    englishMeaning: "direction or guiding path",
    simpleExample: "Team ko direction chahiye.",
    elevatedExample: "Team ko spasht disha chahiye.",
    synonyms: ["marg", "raah", "nirdesh"],
    usageNote:
      "Disha is concise and graceful for guidance, planning, or purpose.",
    challengePrompt:
      "Disha shabd ka prayog karte hue kisi margdarshan par vaakya kahiye.",
    tags: ["guidance", "planning", "leadership"],
    difficulty: "easy",
  },
  {
    id: "margdarshan",
    common: "guidance",
    elevated: "margdarshan",
    englishMeaning: "guidance or direction",
    simpleExample: "Mujhe aapki guidance chahiye.",
    elevatedExample: "Mujhe aapka margdarshan chahiye.",
    synonyms: ["salah", "disha", "paramarsh"],
    usageNote:
      "Margdarshan is respectful and warm when seeking advice from someone experienced.",
    challengePrompt:
      "Margdarshan maangte hue ek vinamra vaakya kahiye.",
    tags: ["guidance", "respect", "learning"],
    difficulty: "medium",
  },
  {
    id: "paramarsh",
    common: "advice",
    elevated: "paramarsh",
    englishMeaning: "counsel or considered advice",
    simpleExample: "Mujhe aapki advice chahiye.",
    elevatedExample: "Mujhe aapka paramarsh chahiye.",
    synonyms: ["salah", "sujhav", "margdarshan"],
    usageNote:
      "Paramarsh is more formal than salah and suits thoughtful or expert advice.",
    challengePrompt:
      "Paramarsh shabd ka prayog karte hue kisi se salah maangiye.",
    tags: ["advice", "formal", "learning"],
    difficulty: "medium",
  },
  {
    id: "santulan",
    common: "balance",
    elevated: "santulan",
    englishMeaning: "balance or equilibrium",
    simpleExample: "Kaam aur aaraam ka balance zaroori hai.",
    elevatedExample: "Kaam aur aaraam ka santulan avashyak hai.",
    synonyms: ["samanjasya", "sanyam", "santushti"],
    usageNote:
      "Santulan is polished and useful for lifestyle, tone, and judgment.",
    challengePrompt:
      "Santulan shabd ka prayog karte hue jeevan ya kaam par vaakya kahiye.",
    tags: ["balance", "life", "reflection"],
    difficulty: "medium",
  },
  {
    id: "abhivyakti",
    common: "expression",
    elevated: "abhivyakti",
    englishMeaning: "expression or articulation",
    simpleExample: "Aapki expression clear hai.",
    elevatedExample: "Aapki abhivyakti spasht hai.",
    synonyms: ["prakatikaran", "vyakti", "bolne ka dhang"],
    usageNote:
      "Abhivyakti is central to polished speech and works well for language learning.",
    challengePrompt:
      "Abhivyakti shabd ka prayog karte hue bhasha ke mahatva par vaakya kahiye.",
    tags: ["expression", "language", "learning"],
    difficulty: "medium",
  },
  {
    id: "upyogi",
    common: "helpful",
    elevated: "upyogi",
    englishMeaning: "useful or helpful",
    simpleExample: "Yeh tip helpful hai.",
    elevatedExample: "Yeh sujhav upyogi hai.",
    synonyms: ["laabhdayak", "sahayak", "kaam ka"],
    usageNote:
      "Upyogi is a crisp upgrade for helpful, especially in practical contexts.",
    challengePrompt:
      "Upyogi shabd ka prayog karte hue kisi salah ki prashansa kijiye.",
    tags: ["useful", "advice", "positive"],
    difficulty: "easy",
  },
  {
    id: "sarthak",
    common: "meaningful",
    elevated: "sarthak",
    englishMeaning: "meaningful or worthwhile",
    simpleExample: "Aaj ki baatcheet meaningful thi.",
    elevatedExample: "Aaj ka samvaad sarthak tha.",
    synonyms: ["arthapurn", "moolyavaan", "upayogi"],
    usageNote:
      "Sarthak feels refined and heartfelt when describing time, work, or conversation.",
    challengePrompt:
      "Sarthak shabd ka prayog karte hue kisi anubhav ko varnit kijiye.",
    tags: ["meaning", "reflection", "positive"],
    difficulty: "medium",
  },
] satisfies LegacyWordEntry[];

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
