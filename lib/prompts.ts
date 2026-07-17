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
