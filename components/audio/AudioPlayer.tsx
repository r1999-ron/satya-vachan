"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TtsResponse } from "@/types";

type AudioVariant = "natural" | "elevated";

type AudioPlayerProps = {
  autoPrepare?: boolean;
  className?: string;
  label?: string;
  text: string;
  variant?: AudioVariant;
};

type PlayerStatus = "idle" | "loading" | "ready" | "playing" | "error";

export function AudioPlayer({
  autoPrepare = false,
  className,
  label = "Listen",
  text,
  variant = "natural",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generatedUrlRef = useRef<string | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState("");

  const trimmedText = text.trim();
  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const hasAudio = Boolean(audioUrl);

  const clearGeneratedUrl = useCallback(() => {
    if (generatedUrlRef.current) {
      URL.revokeObjectURL(generatedUrlRef.current);
      generatedUrlRef.current = null;
    }
  }, []);

  const loadAudio = useCallback(async () => {
    if (!trimmedText || isLoading) {
      return null;
    }

    if (audioUrl) {
      return audioUrl;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedText, variant }),
        signal: controller.signal,
      });
      const payload = await readJsonResponse<
        TtsResponse & { error?: string; code?: string }
      >(response);

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Audio generation failed. Please try again.",
        );
      }

      const blob = base64ToAudioBlob(payload.audioBase64, payload.mimeType);
      const nextUrl = URL.createObjectURL(blob);

      clearGeneratedUrl();
      generatedUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
      setStatus("ready");

      return nextUrl;
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return null;
      }

      setStatus("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Audio generation failed. Please try again.",
      );
      return null;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [audioUrl, clearGeneratedUrl, isLoading, trimmedText, variant]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearGeneratedUrl();
    };
  }, [clearGeneratedUrl]);

  useEffect(() => {
    if (autoPrepare && trimmedText && status === "idle" && !audioUrl) {
      const prepareTimer = window.setTimeout(() => {
        void loadAudio();
      }, 0);

      return () => window.clearTimeout(prepareTimer);
    }
  }, [audioUrl, autoPrepare, loadAudio, status, trimmedText]);

  const handleTogglePlayback = async () => {
    if (!trimmedText || isLoading) {
      return;
    }

    const audioElement = audioRef.current;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setStatus("ready");
      return;
    }

    const nextUrl = await loadAudio();

    if (!nextUrl || !audioRef.current) {
      return;
    }

    try {
      audioRef.current.src = nextUrl;
      await audioRef.current.play();
      setStatus("playing");
    } catch {
      setStatus("ready");
      setError("Playback is ready. Use the audio controls to start listening.");
    }
  };

  const handleRetry = () => {
    setAudioUrl("");
    setError("");
    setStatus("idle");
    clearGeneratedUrl();
    void loadAudio();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!trimmedText || isLoading}
          onClick={handleTogglePlayback}
          className={cn(
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-paper active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-zinc-950",
            hasAudio
              ? "border border-emerald-200/70 bg-emerald-100/70 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/12 dark:text-emerald-100"
              : "border border-white/60 bg-white/50 text-ink shadow-sm hover:-translate-y-0.5 dark:border-white/12 dark:bg-white/8 dark:text-white",
          )}
          aria-label={`${label} ${variant} audio`}
        >
          {isLoading ? (
            <LoaderCircle className="motion-safe:animate-spin" size={16} aria-hidden="true" />
          ) : isPlaying ? (
            <Pause size={16} aria-hidden="true" />
          ) : hasAudio ? (
            <Play size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          {buttonLabel(status, label)}
        </button>

        {status === "error" ? (
          <button
            type="button"
            onClick={handleRetry}
            disabled={!trimmedText || isLoading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-100/55 px-3 py-2 text-xs font-bold text-rose-950 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-400/45 focus:ring-offset-2 focus:ring-offset-paper active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:border-rose-300/25 dark:bg-rose-300/12 dark:text-rose-100 dark:focus:ring-offset-zinc-950"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Retry
          </button>
        ) : null}
      </div>

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          preload="metadata"
          className="h-10 w-full max-w-sm rounded-full"
          aria-label={`${label} ${variant} playback controls`}
          onEnded={() => setStatus("ready")}
          onPause={() => setStatus((current) => (current === "playing" ? "ready" : current))}
          onPlay={() => setStatus("playing")}
        />
      ) : (
        <audio ref={audioRef} className="hidden" aria-hidden="true" />
      )}

      {error ? (
        <p className="flex items-start gap-2 text-xs leading-5 text-rose-900 dark:text-rose-100">
          <AlertCircle className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function buttonLabel(status: PlayerStatus, label: string) {
  switch (status) {
    case "loading":
      return "Preparing...";
    case "playing":
      return "Pause";
    case "ready":
      return label;
    case "error":
      return "Audio failed";
    case "idle":
    default:
      return label;
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function base64ToAudioBlob(audioBase64: string, mimeType: string) {
  if (!audioBase64 || mimeType !== "audio/mpeg") {
    throw new Error("The generated audio could not be read.");
  }

  try {
    const binaryString = window.atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let index = 0; index < binaryString.length; index += 1) {
      bytes[index] = binaryString.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
  } catch {
    throw new Error("The generated audio could not be read.");
  }
}
