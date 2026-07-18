import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import promptRegistry from "@/lib/prompts.json";

/** Central registry for all natural-language instructions sent to LLM APIs. */
export const PROMPTS = promptRegistry;

export const TRANSFORMATION_SYSTEM_PROMPT = PROMPTS.transformation.system;
export const TRANSFORMATION_USER_PROMPT = PROMPTS.transformation.userTemplate;

export const transformationResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "satya_vachan_practice_response",
    description:
      "A structured Satya-Vachan Hindi expression coaching response.",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "transcript",
        "naturalPolishedVersion",
        "elevatedVersion",
        "originalEleganceScore",
        "improvedEleganceScore",
        "feedback",
        "replacements",
        "saveableWords",
      ],
      properties: {
        transcript: { type: "string" },
        naturalPolishedVersion: {
          type: "object",
          additionalProperties: false,
          required: ["dev", "roman", "en"],
          properties: {
            dev: { type: "string" },
            roman: { type: "string" },
            en: { type: "string" },
          },
        },
        elevatedVersion: {
          type: "object",
          additionalProperties: false,
          required: ["dev", "roman", "en"],
          properties: {
            dev: { type: "string" },
            roman: { type: "string" },
            en: { type: "string" },
          },
        },
        originalEleganceScore: { type: "integer", minimum: 0, maximum: 100 },
        improvedEleganceScore: { type: "integer", minimum: 0, maximum: 100 },
        feedback: { type: "string" },
        replacements: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "original",
              "replacement",
              "meaning",
              "whyBetter",
              "naturalness",
            ],
            properties: {
              original: {
                type: "object",
                additionalProperties: false,
                required: ["dev", "roman", "en"],
                properties: {
                  dev: { type: "string" },
                  roman: { type: "string" },
                  en: { type: "string" },
                },
              },
              replacement: {
                type: "object",
                additionalProperties: false,
                required: ["dev", "roman", "en"],
                properties: {
                  dev: { type: "string" },
                  roman: { type: "string" },
                  en: { type: "string" },
                },
              },
              meaning: { type: "string" },
              whyBetter: { type: "string" },
              naturalness: {
                type: "string",
                enum: ["common", "formal", "literary"],
              },
            },
          },
        },
        saveableWords: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["word", "wordDev", "meaning", "simpleAlternative", "exampleSentence"],
            properties: {
              word: { type: "string" },
              wordDev: { type: "string" },
              meaning: { type: "string" },
              simpleAlternative: { type: "string" },
              exampleSentence: { type: "string" },
            },
          },
        },
      },
    },
  },
} satisfies ResponseFormatJSONSchema;

export function buildTransformationUserPrompt(transcript: string) {
  return TRANSFORMATION_USER_PROMPT.replace("{{TRANSCRIPT}}", transcript);
}

export const CHALLENGE_SYSTEM_PROMPT = PROMPTS.challenge.system;
export const CHALLENGE_USER_PROMPT = PROMPTS.challenge.userTemplate;

export const challengeResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "satya_vachan_challenge_response",
    description: "A structured Satya-Vachan daily challenge validation response.",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "transcript",
        "usedTargetWord",
        "acceptableUsage",
        "feedback",
        "suggestedImprovement",
        "completed",
      ],
      properties: {
        transcript: { type: "string" },
        usedTargetWord: { type: "boolean" },
        acceptableUsage: { type: "boolean" },
        feedback: { type: "string" },
        suggestedImprovement: { type: "string" },
        completed: { type: "boolean" },
      },
    },
  },
} satisfies ResponseFormatJSONSchema;

export function buildChallengeUserPrompt({
  transcript,
  targetWord,
  commonWord,
  meaning,
  usageNote,
  challengePrompt,
  elevatedExample,
}: {
  transcript: string;
  targetWord: string;
  commonWord: string;
  meaning: string;
  usageNote: string;
  challengePrompt: string;
  elevatedExample: string;
}) {
  return CHALLENGE_USER_PROMPT.replace("{{TARGET_WORD}}", targetWord)
    .replace("{{COMMON_WORD}}", commonWord)
    .replace("{{MEANING}}", meaning)
    .replace("{{USAGE_NOTE}}", usageNote)
    .replace("{{CHALLENGE_PROMPT}}", challengePrompt)
    .replace("{{ELEVATED_EXAMPLE}}", elevatedExample)
    .replace("{{TRANSCRIPT}}", transcript);
}
