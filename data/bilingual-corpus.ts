import { makeHindiText } from "@/lib/hindi";
import type { HindiText, WordEntry } from "@/types";

export type LegacyWordEntry = Omit<
  WordEntry,
  | "common"
  | "elevated"
  | "simpleExample"
  | "elevatedExample"
  | "scholarExample"
  | "synonyms"
  | "starters"
> & {
  common: string;
  elevated: string;
  simpleExample: string;
  elevatedExample: string;
  scholarExample?: string;
  synonyms: string[];
  starters?: string[];
};

const DEV_OVERRIDES: Record<string, string> = {
  kaam: "काम", karya: "कार्य", kaarya: "कार्य", kartavya: "कर्तव्य", prayojan: "प्रयोजन",
  koshish: "कोशिश", prayas: "प्रयास", yatna: "यत्न", mehnat: "मेहनत", chesta: "चेष्टा",
  jaldi: "जल्दी", sheeghra: "शीघ्र", turant: "तुरंत", tatkaal: "तत्काल",
  matlab: "मतलब", arth: "अर्थ", maayne: "मायने", bhaav: "भाव", tatparya: "तात्पर्य",
  yaani: "यानी", arthaat: "अर्थात्", soch: "सोच", vichaar: "विचार", raay: "राय",
  manan: "मनन", drishti: "दृष्टि", nazariya: "नज़रिया", drishtikon: "दृष्टिकोण",
  pariprekshya: "परिप्रेक्ष्य", sahi: "सही", uchit: "उचित", upayukt: "उपयुक्त",
  theek: "ठीक", anukul: "अनुकूल", zaroori: "ज़रूरी", avashyak: "आवश्यक",
  aavashyak: "आवश्यक", anivarya: "अनिवार्य", mahatvapurn: "महत्वपूर्ण", madad: "मदद",
  sahayata: "सहायता", sahyog: "सहयोग", samarthan: "समर्थन", problem: "प्रॉब्लम",
  samasya: "समस्या", pareshani: "परेशानी", dikkat: "दिक्कत", vighn: "विघ्न",
  solution: "सॉल्यूशन", samadhan: "समाधान", hal: "हल", upay: "उपाय", nivarana: "निवारण",
  clear: "क्लियर", spasht: "स्पष्ट", saaf: "साफ़", prakat: "प्रकट", sugam: "सुगम",
  confusion: "कन्फ़्यूज़न", aspashtata: "अस्पष्टता", uljhan: "उलझन", asmanjas: "असमंजस",
  sandigdhata: "संदिग्धता", faisla: "फ़ैसला", nirnay: "निर्णय", nishchay: "निश्चय", tai: "तय",
  time: "टाइम", samay: "समय", waqt: "वक़्त", ghadi: "घड़ी", mauka: "मौका", avasar: "अवसर",
  sandhi: "संधि", avkaash: "अवकाश", possible: "पॉसिबल", sambhav: "संभव", mumkin: "मुमकिन",
  sakya: "शक्य", impossible: "इम्पॉसिबल", asambhav: "असंभव", namumkin: "नामुमकिन",
  durlabh: "दुर्लभ", akarya: "अकार्य", suggestion: "सजेशन", sujhav: "सुझाव", salah: "सलाह",
  paramarsh: "परामर्श", jawab: "जवाब", uttar: "उत्तर", pratikriya: "प्रतिक्रिया",
  sawaal: "सवाल", prashn: "प्रश्न", jigyasa: "जिज्ञासा", "puchh-taach": "पूछताछ",
  "bahut achchha": "बहुत अच्छा", uttam: "उत्तम", shreshth: "श्रेष्ठ", badhiya: "बढ़िया",
  sarvottam: "सर्वोत्तम", achchha: "अच्छा", sundar: "सुंदर", manohar: "मनोहर",
  sushobhit: "सुशोभित", sajag: "सजग", easy: "ईज़ी", sahaj: "सहज", saral: "सरल",
  prakritik: "प्राकृतिक", mushkil: "मुश्किल", kathin: "कठिन", dushkar: "दुष्कर",
  kashtkar: "कष्टकर", jatil: "जटिल", iraada: "इरादा", sankalp: "संकल्प",
  pratigya: "प्रतिज्ञा", "dridh ichchha": "दृढ़ इच्छा", experience: "एक्सपीरियंस",
  anubhav: "अनुभव", tajurba: "तजुर्बा", anubhuti: "अनुभूति", gyaan: "ज्ञान",
  baatcheet: "बातचीत", samvaad: "संवाद", vaarta: "वार्ता", charcha: "चर्चा",
  discussion: "डिस्कशन", "vichar-vimarsh": "विचार-विमर्श", topic: "टॉपिक", vishay: "विषय",
  mudda: "मुद्दा", prasang: "प्रसंग", adhyay: "अध्याय", interesting: "इंटरेस्टिंग",
  rochak: "रोचक", dilchasp: "दिलचस्प", akarshak: "आकर्षक", important: "इम्पॉर्टेंट",
  pramukh: "प्रमुख", mool: "मूल", main: "मेन", mukhya: "मुख्य", kendriya: "केंद्रीय",
  goal: "गोल", lakshya: "लक्ष्य", uddeshya: "उद्देश्य", manzil: "मंज़िल", dhyey: "ध्येय",
  purpose: "पर्पज़", maqsad: "मक़सद", result: "रिज़ल्ट", parinaam: "परिणाम", natija: "नतीजा",
  phal: "फल", impact: "इम्पैक्ट", prabhav: "प्रभाव", asar: "असर", "prerak bal": "प्रेरक बल",
  relation: "रिलेशन", sambandh: "संबंध", rishta: "रिश्ता", jod: "जोड़", nataa: "नाता",
  trust: "ट्रस्ट", vishwas: "विश्वास", bharosa: "भरोसा", aastha: "आस्था", shraddha: "श्रद्धा",
  respect: "रिस्पेक्ट", aadar: "आदर", samman: "सम्मान", maan: "मान", izzat: "इज़्ज़त",
  gaurav: "गौरव", control: "कंट्रोल", sanyam: "संयम", niyantran: "नियंत्रण",
  dhairya: "धैर्य", santulan: "संतुलन", patience: "पेशेंस", sabr: "सब्र",
  "sahan-shakti": "सहन-शक्ति", himmat: "हिम्मत", sahas: "साहस", veerata: "वीरता",
  nirbhayata: "निर्भयता", responsibility: "रिस्पॉन्सिबिलिटी", zimmedari: "ज़िम्मेदारी",
  uttardayitva: "उत्तरदायित्व", farz: "फ़र्ज़", polite: "पोलाइट", vinamra: "विनम्र",
  namra: "नम्र", sabhya: "सभ्य", shisht: "शिष्ट", decent: "डिसेंट", sanskari: "संस्कारी",
  behavior: "बिहेवियर", vyavahar: "व्यवहार", aacharan: "आचरण", bartav: "बर्ताव",
  ravayya: "रवैया", change: "चेंज", parivartan: "परिवर्तन", badlav: "बदलाव",
  rupantaran: "रूपांतरण", sanshodhan: "संशोधन", improvement: "इम्प्रूवमेंट", sudhaar: "सुधार",
  unnati: "उन्नति", behtari: "बेहतरी", progress: "प्रोग्रेस", pragati: "प्रगति", vikas: "विकास",
  plan: "प्लान", yojana: "योजना", rananeeti: "रणनीति", vidhi: "विधि", karyakram: "कार्यक्रम",
  direction: "डायरेक्शन", disha: "दिशा", marg: "मार्ग", raah: "राह", nirdesh: "निर्देश",
  guidance: "गाइडेंस", margdarshan: "मार्गदर्शन", advice: "एडवाइस", balance: "बैलेंस",
  samanjasya: "सामंजस्य", santushti: "संतुष्टि", expression: "एक्सप्रेशन",
  abhivyakti: "अभिव्यक्ति", prakatikaran: "प्रकटीकरण", vyakti: "व्यक्ति",
  "bolne ka dhang": "बोलने का ढंग", helpful: "हेल्पफुल", upyogi: "उपयोगी",
  upayogi: "उपयोगी", laabhdayak: "लाभदायक", sahayak: "सहायक", "kaam ka": "काम का",
  meaningful: "मीनिंगफुल", sarthak: "सार्थक", arthapurn: "अर्थपूर्ण", moolyavaan: "मूल्यवान",
  haan: "हाँ", "main nahi maanta": "मैं नहीं मानता", request: "रिक्वेस्ट", permission: "परमिशन", wait: "वेट",
  der: "देर", ready: "रेडी", priority: "प्रायोरिटी", support: "सपोर्ट", achievement: "अचीवमेंट",
  capability: "केपेबिलिटी", quality: "क्वालिटी", option: "ऑप्शन", reason: "रीज़न", context: "कॉन्टेक्स्ट",
  example: "एग्ज़ाम्पल", process: "प्रोसेस", information: "इन्फॉर्मेशन", update: "अपडेट", safety: "सेफ़्टी",
  convenience: "कन्वीनियंस", careful: "केयरफ़ुल", sensitive: "सेंसिटिव", honesty: "ऑनेस्टी", accept: "एक्सेप्ट",
  reject: "रिजेक्ट", praise: "प्रेज़", thanks: "थैंक्स", sorry: "सॉरी", curiosity: "क्यूरियोसिटी",
  focus: "फ़ोकस", motivation: "मोटिवेशन", excitement: "एक्साइटमेंट", worry: "वरी", relief: "रिलीफ़",
  regular: "रेगुलर", urgent: "अर्जेंट", present: "प्रेज़ेंट", absent: "एब्सेंट",
  sahmati: "सहमति", asahmati: "असहमति", anurodh: "अनुरोध", nivedan: "निवेदन", anumati: "अनुमति",
  pratiksha: "प्रतीक्षा", vilamb: "विलंब", tatpar: "तत्पर", prathamikta: "प्राथमिकता", upalabdhi: "उपलब्धि",
  kshamata: "क्षमता", gunvatta: "गुणवत्ता", vikalp: "विकल्प", kaaran: "कारण", sandarbh: "संदर्भ",
  udaharan: "उदाहरण", prakriya: "प्रक्रिया", jaankari: "जानकारी", soochna: "सूचना", suraksha: "सुरक्षा",
  suvidha: "सुविधा", savdhaani: "सावधानी", samvedansheel: "संवेदनशील", imaandari: "ईमानदारी",
  sweekar: "स्वीकार", asweekar: "अस्वीकार", prashansa: "प्रशंसा", aabhar: "आभार", kshama: "क्षमा",
  ekagrata: "एकाग्रता", prerna: "प्रेरणा", utsah: "उत्साह", chinta: "चिंता", raahat: "राहत",
  niyamit: "नियमित", upasthit: "उपस्थित", anupasthit: "अनुपस्थित",
  aupacharik: "औपचारिक", shabd: "शब्द", prayog: "प्रयोग", sarvatha: "सर्वथा",
  evam: "एवं", prateet: "प्रतीत", hota: "होता",
  humne: "हमने", hum: "हम", maine: "मैंने", mera: "मेरा", meri: "मेरी", mere: "मेरे",
  mujhe: "मुझे", humein: "हमें", aap: "आप", aapka: "आपका", aapki: "आपकी", unka: "उनका",
  is: "इस", iska: "इसका", yeh: "यह", ab: "अब", aaj: "आज", kal: "कल", ek: "एक",
  ka: "का", ki: "की", ko: "को", se: "से", par: "पर", mein: "में", aur: "और", ke: "के",
  kya: "क्या", hai: "है", hain: "हैं", tha: "था", thi: "थी", hoga: "होगा", hogi: "होगी",
  nahi: "नहीं", mila: "मिला", gayi: "गई", gaya: "गया", chahiye: "चाहिए", lena: "लेना",
  karna: "करना", karni: "करनी", karta: "करता", karte: "करते", kahiye: "कहिए", dijiye: "दीजिए",
  samajhna: "समझना", samjhaane: "समझाने", bolne: "बोलने", padhne: "पढ़ने", rakhna: "रखना",
  khatam: "ख़त्म", samaapt: "समाप्त", poora: "पूरा", praapt: "प्राप्त", bahut: "बहुत",
  thoda: "थोड़ा", thodi: "थोड़ी", itni: "इतनी", sabka: "सबका", sabki: "सबकी", sach: "सच",
  liye: "लिए", roz: "रोज़", baat: "बात", baithak: "बैठक", kahani: "कहानी", tareeka: "तरीका",
  swar: "स्वर", gusse: "गुस्से", vyavastha: "व्यवस्था", vaakya: "वाक्य", dikh: "दिख",
  rahi: "रही", hamari: "हमारी", team: "टीम", project: "प्रोजेक्ट", tip: "टिप", hindi: "हिंदी",
};

const EXAMPLE_EN: Record<string, string> = {
  karya: "We finished this work quickly.", prayas: "I tried to explain.", sheeghra: "Please reply to me promptly.",
  arth: "What does this mean?", arthaat: "That is, we must now make a decision.", vichaar: "My view is slightly different.",
  drishtikon: "It is important to understand your perspective.", uchit: "This is not the appropriate time.",
  avashyak: "It is necessary to understand this.", sahayata: "I need a little assistance.",
  samasya: "A problem has arisen in this project.", samadhan: "We found its solution.", spasht: "Your point is clear now.",
  aspashtata: "There is some ambiguity on this point.", nirnay: "We must make a decision today.", samay: "I have little time.",
  avasar: "I got an opportunity to speak.", sambhav: "This task is possible.", asambhav: "This is impossible so quickly.",
  sujhav: "I have a suggestion.", uttar: "I did not receive its answer.", prashn: "I have a question.",
  uttam: "Your work is excellent.", sundar: "You said something beautiful.", sahaj: "This method is easy.",
  kathin: "This task is difficult.", sankalp: "I resolve to read every day.", anubhav: "My experience was good.",
  samvaad: "We should discuss this.", charcha: "This topic will be discussed tomorrow.", vishay: "Today's topic is very interesting.",
  rochak: "This story is interesting.", mahatvapurn: "This meeting is important.", pramukh: "This is our main goal.",
  lakshya: "My goal is to improve my Hindi.", uddeshya: "What is the purpose of this work?", parinaam: "The result was good.",
  prabhav: "This decision will have a major impact.", sambandh: "This is connected with our work.", vishwas: "I trust you.",
  aadar: "I respect your effort.", samman: "We should respect everyone.", sanyam: "One should exercise restraint in anger.",
  dhairya: "This work requires patience.", sahas: "It takes courage to speak the truth.", zimmedari: "This is my responsibility.",
  vinamra: "Your tone was polite.", sabhya: "Their conduct was civil.", vyavahar: "Their behavior is very good.",
  parivartan: "We need change in the system.", sudhaar: "This sentence can be improved.", unnati: "Your Hindi is improving.",
  yojana: "Our plan is simple.", disha: "The team needs clear direction.", margdarshan: "I need your guidance.",
  paramarsh: "I need your advice.", santulan: "Balance between work and rest is essential.", abhivyakti: "Your expression is clear.",
  upyogi: "This suggestion is useful.", sarthak: "Today's conversation was meaningful.",
  sahmati: "Yes, I agree with your plan.", asahmati: "I do not agree that the price should be raised now.",
  anurodh: "I have a request: please send the file today.", nivedan: "Please keep your phone on silent.",
  anumati: "May I have permission to work from home tomorrow?", pratiksha: "Please wait two minutes; I am coming.",
  vilamb: "Sorry, I was a little late today.", tatpar: "I am ready; please tell me when to leave.",
  prathamikta: "Finishing this report is my current priority.", sahyog: "I need your support on this project.",
  upalabdhi: "This is a significant achievement worth celebrating.", kshamata: "They have the ability to lead the team.",
  gunvatta: "The product quality is good, but the packaging needs work.", vikalp: "If this option is expensive, we can consider another.",
  kaaran: "Was there a reason for your delay?", sandarbh: "Please give some context so the point is clear.",
  udaharan: "An example will make this easier to understand.", prakriya: "How long will this process take?",
  jaankari: "Please send me the complete event information.", soochna: "Please message me when there is an update.",
  suraksha: "Please wear a helmet for safety.", suvidha: "I will change the time for your convenience.",
  savdhaani: "The road is wet, so please be careful.", samvedansheel: "This is a sensitive topic; please discuss it calmly.",
  imaandari: "I genuinely appreciate your honesty.", sweekar: "I accept my mistake and will correct it.",
  asweekar: "I am sorry, but I must decline this offer.", prashansa: "My manager praised my work today.",
  aabhar: "Thank you sincerely for all this help.", kshama: "I am sorry I could not answer your call.",
  jigyasa: "I am curious about how this machine works.", ekagrata: "Put the phone aside and focus for a while.",
  prerna: "Your story gave me a great deal of inspiration.", utsah: "I am very excited about the new job.",
  chinta: "I am a little worried about the result.", raahat: "The normal report brought great relief.",
  niyamit: "I am trying to exercise regularly now.", tatkaal: "This task is urgent, so please handle it first.",
  upasthit: "Everyone should be present at tomorrow's meeting.", anupasthit: "I will be absent from the office tomorrow.",
};

const VOWELS: Record<string, [string, string]> = {
  aa: ["आ", "ा"], ee: ["ई", "ी"], ii: ["ई", "ी"], oo: ["ऊ", "ू"], uu: ["ऊ", "ू"],
  ai: ["ऐ", "ै"], au: ["औ", "ौ"], a: ["अ", ""], i: ["इ", "ि"], u: ["उ", "ु"], e: ["ए", "े"], o: ["ओ", "ो"],
};
const CONSONANTS: Record<string, string> = {
  chh: "छ", kh: "ख", gh: "घ", ch: "च", jh: "झ", th: "थ", dh: "ध", ph: "फ", bh: "भ",
  sh: "श", ng: "ङ", ny: "ञ", k: "क", g: "ग", c: "च", j: "ज", t: "त", d: "द", n: "न",
  p: "प", b: "ब", m: "म", y: "य", r: "र", l: "ल", v: "व", w: "व", s: "स", h: "ह", f: "फ़", z: "ज़", q: "क़", x: "क्स",
};

export function toDevanagari(value: string) {
  const direct = DEV_OVERRIDES[value.trim().toLocaleLowerCase()];
  if (direct) return direct;
  return value.replace(/[A-Za-z]+(?:-[A-Za-z]+)*/g, (token) => transliterateToken(token));
}

function transliterateToken(token: string) {
  const lower = token.toLocaleLowerCase();
  if (DEV_OVERRIDES[lower]) return DEV_OVERRIDES[lower];
  let result = "";
  let index = 0;
  let hasPendingConsonant = false;

  while (index < lower.length) {
    const vowelKey = Object.keys(VOWELS).find((key) => lower.startsWith(key, index));
    if (vowelKey) {
      const [independent, matra] = VOWELS[vowelKey];
      result += hasPendingConsonant ? matra : independent;
      hasPendingConsonant = false;
      index += vowelKey.length;
      continue;
    }

    const consonantKey = Object.keys(CONSONANTS).find((key) => lower.startsWith(key, index));
    if (consonantKey) {
      if (hasPendingConsonant) result += "्";
      result += CONSONANTS[consonantKey];
      hasPendingConsonant = true;
      index += consonantKey.length;
      continue;
    }

    result += token[index];
    hasPendingConsonant = false;
    index += 1;
  }

  return result;
}

export function bilingualWordEntry(entry: LegacyWordEntry): WordEntry {
  const english = EXAMPLE_EN[entry.id] ?? entry.englishMeaning;
  const scholarExample = entry.scholarExample ?? createScholarExample(entry.elevated);
  const starters = entry.starters ?? [entry.elevatedExample];
  return {
    ...entry,
    common: wordText(entry.common),
    elevated: wordText(entry.elevated),
    simpleExample: makeHindiText(toDevanagari(entry.simpleExample), entry.simpleExample, english),
    elevatedExample: makeHindiText(toDevanagari(entry.elevatedExample), entry.elevatedExample, english),
    scholarExample: makeHindiText(
      toDevanagari(scholarExample),
      scholarExample,
      `In a formal setting, the use of “${entry.elevated}” is especially appropriate and meaningful.`,
    ),
    synonyms: entry.synonyms.map(wordText),
    starters: starters.map((starter) =>
      makeHindiText(toDevanagari(starter), starter),
    ),
  };
}

function createScholarExample(elevatedWord: string) {
  return `Aupacharik samvaad mein ${elevatedWord} shabd ka prayog sarvatha uchit evam sarthak prateet hota hai.`;
}

function wordText(roman: string): HindiText {
  return makeHindiText(toDevanagari(roman), roman);
}
