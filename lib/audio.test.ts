import { describe, expect, it, vi } from "vitest";
import {
  createRecordingBlob,
  createRecordingResult,
  formatRecordingDuration,
  getSupportedRecordingMimeType,
  isMediaRecorderSupported,
  recordingToFile,
  stopMediaStreamTracks,
} from "@/lib/audio";

describe("audio helpers", () => {
  it("reports recorder support only when browser APIs are present", () => {
    expect(isMediaRecorderSupported()).toBe(false);
  });

  it("selects the first supported recording MIME type", () => {
    class TestMediaRecorder {
      static isTypeSupported(mimeType: string) {
        return mimeType === "audio/webm";
      }
    }

    vi.stubGlobal("MediaRecorder", TestMediaRecorder);

    expect(getSupportedRecordingMimeType()).toBe("audio/webm");
  });

  it("creates recording blobs, results, files, and formatted durations", () => {
    const blob = createRecordingBlob([new Blob(["abc"])], "audio/mp4");
    const result = createRecordingResult(blob, "audio/mp4", 1234.56);
    const file = recordingToFile(result, "clip");

    expect(blob.type).toBe("audio/mp4");
    expect(result).toMatchObject({
      blob,
      mimeType: "audio/mp4",
      durationMs: 1235,
    });
    expect(file.name).toBe("clip.m4a");
    expect(file.type).toBe("audio/mp4");
    expect(formatRecordingDuration(65_900)).toBe("1:05");
    expect(formatRecordingDuration(-1)).toBe("0:00");
  });

  it("stops every track on an optional media stream", () => {
    const stopOne = vi.fn();
    const stopTwo = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopOne }, { stop: stopTwo }],
    } as unknown as MediaStream;

    stopMediaStreamTracks(stream);
    stopMediaStreamTracks(null);

    expect(stopOne).toHaveBeenCalledOnce();
    expect(stopTwo).toHaveBeenCalledOnce();
  });
});
