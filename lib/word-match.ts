export function containsTargetWord(transcript: string, targetWord: string) {
  const normalizedTranscript = normalizeForMatch(transcript);
  const normalizedTarget = normalizeForMatch(targetWord);
  const compactTranscript = compactLongVowels(normalizedTranscript);
  const compactTarget = compactLongVowels(normalizedTarget);

  return (
    hasTokenMatch(normalizedTranscript, normalizedTarget) ||
    hasTokenMatch(compactTranscript, compactTarget)
  );
}

function hasTokenMatch(transcript: string, targetWord: string) {
  if (!targetWord) {
    return false;
  }

  const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escapedTarget}(?=$|\\s)`, "i").test(transcript);
}

function normalizeForMatch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function compactLongVowels(value: string) {
  return value
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u");
}
