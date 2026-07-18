import type { VoicePreference } from "@/types";

type TtsVariant = "natural" | "elevated";

const MAX_CACHE_ENTRIES = 12;
const audioCache = new Map<string, Blob>();

export function getCachedTtsAudio(
  text: string,
  variant: TtsVariant,
  voice: VoicePreference,
) {
  const key = getCacheKey(text, variant, voice);
  const cached = audioCache.get(key);

  if (cached) {
    audioCache.delete(key);
    audioCache.set(key, cached);
  }

  return cached;
}

export function cacheTtsAudio(
  text: string,
  variant: TtsVariant,
  voice: VoicePreference,
  audio: Blob,
) {
  const key = getCacheKey(text, variant, voice);
  audioCache.delete(key);
  audioCache.set(key, audio);

  while (audioCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;

    if (typeof oldestKey !== "string") {
      break;
    }

    audioCache.delete(oldestKey);
  }
}

function getCacheKey(text: string, variant: TtsVariant, voice: VoicePreference) {
  return `${voice}\u0000${variant}\u0000${text.trim()}`;
}
