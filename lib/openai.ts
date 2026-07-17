import "server-only";

import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  cachedClient ??= new OpenAI({ apiKey });

  return cachedClient;
}
