import "server-only";

import { observeOpenAI, type LangfuseConfig } from "@langfuse/openai";
import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isLangfuseConfigured() {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY?.trim() &&
      process.env.LANGFUSE_SECRET_KEY?.trim(),
  );
}

export function isLocalDemoMockModeEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.SATYA_VACHAN_DEMO_MODE === "true"
  );
}

export function getOpenAIClient(langfuseConfig?: LangfuseConfig) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  cachedClient ??= new OpenAI({ apiKey });

  return isLangfuseConfigured()
    ? observeOpenAI(cachedClient, langfuseConfig)
    : cachedClient;
}
