import type { RecordingResult } from "@/types";

export const RECORDING_MIME_TYPE_PREFERENCES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const;

export const DEFAULT_MAX_RECORDING_MS = 30_000;
export const RECORDING_WAVEFORM_BAR_COUNT = 21;

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

  return navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      channelCount: { ideal: 1 },
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
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

export function getRecordingWaveformLevels(
  frequencyData: Uint8Array,
  barCount = RECORDING_WAVEFORM_BAR_COUNT,
) {
  const normalizedBarCount = Math.max(1, Math.floor(barCount));

  if (frequencyData.length === 0) {
    return Array.from({ length: normalizedBarCount }, () => 0.08);
  }

  // Speech energy is concentrated in the lower/middle bins. Ignoring the
  // first bin also prevents low-frequency room noise from dominating the UI.
  const firstBin = Math.min(1, frequencyData.length - 1);
  const usableBinCount = Math.max(1, Math.ceil(frequencyData.length * 0.72));

  return Array.from({ length: normalizedBarCount }, (_, index) => {
    const start = Math.min(
      frequencyData.length - 1,
      firstBin + Math.floor((index / normalizedBarCount) * usableBinCount),
    );
    const end = Math.min(
      frequencyData.length,
      firstBin +
        Math.max(1, Math.ceil(((index + 1) / normalizedBarCount) * usableBinCount)),
    );
    let total = 0;

    for (let bin = start; bin < end; bin += 1) {
      total += frequencyData[bin] ?? 0;
    }

    const average = total / Math.max(1, end - start);
    const center = (normalizedBarCount - 1) / 2;
    const centerWeight = center
      ? 0.72 + 0.28 * (1 - Math.abs(index - center) / center)
      : 1;

    return Math.min(1, Math.max(0.08, (average / 210) * centerWeight));
  });
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
