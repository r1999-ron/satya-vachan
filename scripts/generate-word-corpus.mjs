import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(projectRoot, "data", "word-corpus.bilingual.csv");
const jsonOutputPath = path.join(projectRoot, "data", "word-corpus.generated.json");
const csv = await fs.readFile(csvPath, "utf8");
const rows = parseCsv(csv);
const [headerRow, ...dataRows] = rows;

if (!headerRow) throw new Error("Word corpus CSV is empty.");

const headers = headerRow.map((header) => header.replace(/^﻿/, "").trim());
const entries = dataRows
  .filter((row) => row.some((value) => value.trim()))
  .map((row, index) => toEntry(headers, row, index + 2));

const duplicateIds = entries
  .map((entry) => entry.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Word corpus contains duplicate ids: ${[...new Set(duplicateIds)].join(", ")}.`);
}

await fs.writeFile(jsonOutputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Generated ${entries.length} word corpus entries from data/word-corpus.bilingual.csv`);

function toEntry(headers, row, rowNumber) {
  const values = Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
  const required = [
    "id",
    "usual_word_dev", "usual_word_roman",
    "transformed_word_dev", "transformed_word_roman",
    "english_meaning",
    "everyday_sentence_dev", "everyday_sentence_roman",
    "improved_sentence_1_dev", "improved_sentence_1_roman",
    "improved_sentence_2_dev", "improved_sentence_2_roman",
    "synonyms_dev", "synonyms_roman",
    "usage_note", "challenge_prompt", "tags", "difficulty",
  ];
  const missing = required.filter((header) => !values[header]);

  if (missing.length > 0) throw new Error(`CSV row ${rowNumber} is missing: ${missing.join(", ")}.`);
  if (!/^[1-9]\d*$/.test(values.id)) {
    throw new Error(`CSV row ${rowNumber} must have a positive integer id.`);
  }
  if (!["easy", "medium", "advanced"].includes(values.difficulty)) {
    throw new Error(`CSV row ${rowNumber} has an invalid difficulty.`);
  }

  for (const header of ["usual_word_dev", "transformed_word_dev", "everyday_sentence_dev", "improved_sentence_1_dev", "improved_sentence_2_dev", "synonyms_dev"]) {
    if (!/[ऀ-ॿ]/u.test(values[header])) {
      throw new Error(`CSV row ${rowNumber} column ${header} must contain Devanagari text.`);
    }
  }
  for (const header of ["usual_word_roman", "transformed_word_roman", "everyday_sentence_roman", "improved_sentence_1_roman", "improved_sentence_2_roman", "synonyms_roman"]) {
    if (/[ऀ-ॿ]/u.test(values[header])) {
      throw new Error(`CSV row ${rowNumber} column ${header} must not contain Devanagari text.`);
    }
  }

  const synonymsDev = splitList(values.synonyms_dev);
  const synonymsRoman = splitList(values.synonyms_roman);

  if (synonymsDev.length === 0 || synonymsDev.length !== synonymsRoman.length) {
    throw new Error(
      `CSV row ${rowNumber} must have matching synonyms_dev and synonyms_roman lists.`,
    );
  }

  return {
    id: Number(values.id),
    common: { dev: values.usual_word_dev, roman: values.usual_word_roman },
    elevated: { dev: values.transformed_word_dev, roman: values.transformed_word_roman },
    englishMeaning: values.english_meaning,
    simpleExample: { dev: values.everyday_sentence_dev, roman: values.everyday_sentence_roman },
    elevatedExample: { dev: values.improved_sentence_1_dev, roman: values.improved_sentence_1_roman },
    scholarExample: { dev: values.improved_sentence_2_dev, roman: values.improved_sentence_2_roman },
    synonyms: synonymsDev.map((dev, index) => ({ dev, roman: synonymsRoman[index] })),
    usageNote: values.usage_note,
    challengePrompt: values.challenge_prompt,
    tags: splitList(values.tags),
    difficulty: values.difficulty,
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
