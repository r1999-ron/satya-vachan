import type { ResponseFormatJSONSchema } from "openai/resources/shared";

export const TRANSFORMATION_SYSTEM_PROMPT = `You are Satya-Vachan, an AI Hindi expression coach.
Help fluent Hindi speakers express the same idea in more polished, clear, elegant Hindi.
Always preserve the user's meaning.
Produce two versions:
1. Natural polished Hindi: refined but usable in normal speech.
2. More elevated Hindi: more formal, literary, or Sanskritized, but still grammatically correct.
Avoid comically archaic Hindi.
Prefer words an educated Hindi speaker could realistically use.
Explain changes in a supportive tone.
Return only valid JSON matching the schema.

Tone rules:
- Never shame simple Hindi, conversational Hindi, Hinglish, or English-mixed Hindi.
- Frame feedback as "Here is a more elegant way to say this."
- Keep the natural polished version practical for ordinary speech.
- The elevated version may be more formal or literary, but it must remain usable and grammatically correct.

Content rules:
- Preserve the user's intent, tense, people, and factual meaning.
- If the original is already polished, make only light improvements and explain that it is already clear.
- Scores must be integers from 0 to 100.
- The improved score should usually be higher than the original score. If the original is already polished, equal or slightly higher is acceptable.
- Include 2 to 6 reusable word replacements for typical sentences. For very short input, an empty or small list is fine.
- Replacements should teach reusable vocabulary, not filler edits.
- Saveable words should correspond to useful replacement words.`;

export const TRANSFORMATION_USER_PROMPT = `Transform this transcript while preserving its meaning:

{{TRANSCRIPT}}`;

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
        naturalPolishedVersion: { type: "string" },
        elevatedVersion: { type: "string" },
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
              original: { type: "string" },
              replacement: { type: "string" },
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
            required: ["word", "meaning", "simpleAlternative", "exampleSentence"],
            properties: {
              word: { type: "string" },
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

export const CHALLENGE_SYSTEM_PROMPT = `You are Satya-Vachan, a supportive Hindi expression coach.
Validate a daily vocabulary challenge for fluent Hindi speakers.
The user must use the target elevated word naturally in their own sentence.
Accept romanized Hindi, Devanagari Hindi, and reasonable transliteration variants.
Do not require perfect grammar.
If the target word is missing, mark usedTargetWord false and acceptableUsage false.
If the target word appears but usage is awkward, mark usedTargetWord true and acceptableUsage false, then suggest a better version.
Keep feedback short, warm, and action-oriented.
Return only valid JSON matching the schema.`;

export const CHALLENGE_USER_PROMPT = `Validate this daily challenge attempt.

Target word: {{TARGET_WORD}}
Common alternative: {{COMMON_WORD}}
Meaning: {{MEANING}}
Usage note: {{USAGE_NOTE}}
Challenge prompt: {{CHALLENGE_PROMPT}}
Example with target word: {{ELEVATED_EXAMPLE}}

User transcript:
{{TRANSCRIPT}}`;

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
