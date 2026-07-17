import type { RecordingResult } from "@/types";

export const RECORDING_MIME_TYPE_PREFERENCES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const;

export const DEFAULT_MAX_RECORDING_MS = 30_000;

export function isMediaRecorderSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export function getSupportedRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    RECORDING_MIME_TYPE_PREFERENCES.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) ?? ""
  );
}

export async function requestMicrophoneStream() {
  if (!isMediaRecorderSupported()) {
    throw new Error("Audio recording is not supported in this browser.");
  }

  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function stopMediaStreamTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function createRecordingBlob(chunks: Blob[], mimeType: string) {
  return new Blob(chunks, mimeType ? { type: mimeType } : undefined);
}

export function createRecordingResult(
  blob: Blob,
  mimeType: string,
  durationMs: number,
): RecordingResult {
  return {
    blob,
    mimeType: blob.type || mimeType || "audio/webm",
    durationMs: Math.max(0, Math.round(durationMs)),
  };
}

export function recordingToFile(
  recording: RecordingResult,
  filename = "satya-vachan-recording",
) {
  const extension = getRecordingFileExtension(recording.mimeType);

  return new File([recording.blob], `${filename}.${extension}`, {
    type: recording.mimeType,
    lastModified: Date.now(),
  });
}

export function formatRecordingDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getRecordingFileExtension(mimeType: string) {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  return "webm";
}
