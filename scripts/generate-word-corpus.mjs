import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(projectRoot, "data", "word-corpus.csv");
const outputPath = path.join(projectRoot, "data", "word-corpus.generated.ts");
const csv = await fs.readFile(csvPath, "utf8");
const rows = parseCsv(csv);
const [headerRow, ...dataRows] = rows;

if (!headerRow) throw new Error("Word corpus CSV is empty.");

const headers = headerRow.map((header) => header.replace(/^\uFEFF/, "").trim());
const entries = dataRows
  .filter((row) => row.some((value) => value.trim()))
  .map((row, index) => toEntry(headers, row, index + 2));

await fs.writeFile(
  outputPath,
  `// This file is generated from data/word-corpus.csv. Do not edit it directly.\n` +
    `import type { LegacyWordEntry } from "@/data/bilingual-corpus";\n\n` +
    `export const generatedWordCorpus = ${JSON.stringify(entries, null, 2)} satisfies LegacyWordEntry[];\n`,
  "utf8",
);

console.log(`Generated ${entries.length} entries from data/word-corpus.csv`);

function toEntry(headers, row, rowNumber) {
  const values = Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
  const required = [
    "id", "everyday_word", "transformed_word", "everyday_sentence", "improved_sentence_1",
    "improved_sentence_2", "difficulty_level", "synonyms", "usage_note", "english_meaning",
    "challenge_prompt", "tags",
  ];
  const missing = required.filter((header) => !values[header]);

  if (missing.length > 0) throw new Error(`CSV row ${rowNumber} is missing: ${missing.join(", ")}.`);
  if (!["easy", "medium", "advanced"].includes(values.difficulty_level)) {
    throw new Error(`CSV row ${rowNumber} has an invalid difficulty_level.`);
  }

  return {
    id: values.id,
    common: values.everyday_word,
    elevated: values.transformed_word,
    simpleExample: values.everyday_sentence,
    elevatedExample: values.improved_sentence_1,
    scholarExample: values.improved_sentence_2,
    difficulty: values.difficulty_level,
    synonyms: splitList(values.synonyms),
    usageNote: values.usage_note,
    englishMeaning: values.english_meaning,
    challengePrompt: values.challenge_prompt,
    tags: splitList(values.tags),
  };
}

function splitList(value) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (inQuotes) throw new Error("Word corpus CSV has an unclosed quoted value.");
  if (value || row.length > 0) rows.push([...row, value]);

  return rows;
}
