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
import { isApiRequestErrorCode, requestJson } from "@/lib/api-client";
import { cacheTtsAudio, getCachedTtsAudio } from "@/lib/tts-cache";
import { cn } from "@/lib/utils";
import { normalizeTtsResponse } from "@/lib/validators";
import type { TtsResponse } from "@/types";

type AudioVariant = "natural" | "elevated";

type AudioPlayerProps = {
  autoPlay?: boolean;
  className?: string;
  label?: string;
  onStatusChange?: (status: PlayerStatus) => void;
  text: string;
  variant?: AudioVariant;
};

type PlayerStatus = "idle" | "loading" | "ready" | "playing" | "error";

export function AudioPlayer({
  autoPlay = false,
  className,
  label = "Listen",
  onStatusChange,
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

  useEffect(() => {
    if (status !== "idle") {
      onStatusChange?.(status);
    }
  }, [onStatusChange, status]);

  const clearGeneratedUrl = useCallback(() => {
    if (generatedUrlRef.current) {
      URL.revokeObjectURL(generatedUrlRef.current);
      generatedUrlRef.current = null;
    }
  }, []);

  const loadAudio = useCallback(async (force = false) => {
    if (!trimmedText || isLoading) {
      return null;
    }

    if (audioUrl && !force) {
      return audioUrl;
    }

    const cachedAudio = force
      ? undefined
      : getCachedTtsAudio(trimmedText, variant);

    if (cachedAudio) {
      const cachedUrl = URL.createObjectURL(cachedAudio);
      clearGeneratedUrl();
      generatedUrlRef.current = cachedUrl;
      setAudioUrl(cachedUrl);
      setStatus("ready");
      setError("");
      return cachedUrl;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");

    try {
      const payload = await requestJson<TtsResponse>("/api/tts", {
        method: "POST",
        body: { text: trimmedText, variant },
        signal: controller.signal,
        fallbackMessage: "Audio generation failed. Please try again.",
        timeoutMs: 20_000,
        validate: normalizeTtsResponse,
      });

      const blob = base64ToAudioBlob(payload.audioBase64, payload.mimeType);
      const nextUrl = URL.createObjectURL(blob);
      cacheTtsAudio(trimmedText, variant, blob);

      clearGeneratedUrl();
      generatedUrlRef.current = nextUrl;
      setAudioUrl(nextUrl);
      setStatus("ready");

      return nextUrl;
    } catch (caughtError) {
      if (isApiRequestErrorCode(caughtError, "ABORTED")) {
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

  const playAudio = useCallback(async (nextUrl: string) => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    setError("");

    try {
      audioElement.src = nextUrl;
      await audioElement.play();
      setStatus("playing");
    } catch {
      setStatus("ready");
      setError("Playback could not start. Try Listen again.");
    }
  }, []);

  useEffect(() => {
    if (autoPlay && trimmedText && status === "idle" && !audioUrl) {
      const playTimer = window.setTimeout(() => {
        void loadAudio().then((nextUrl) => {
          if (nextUrl) {
            void playAudio(nextUrl);
          }
        });
      }, 0);

      return () => window.clearTimeout(playTimer);
    }
  }, [audioUrl, autoPlay, loadAudio, playAudio, status, trimmedText]);

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

    if (!nextUrl) {
      return;
    }

    await playAudio(nextUrl);
  };

  const handleRetry = async () => {
    setAudioUrl("");
    setError("");
    setStatus("idle");
    clearGeneratedUrl();
    const nextUrl = await loadAudio(true);

    if (nextUrl && autoPlay) {
      await playAudio(nextUrl);
    }
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
          aria-pressed={isPlaying}
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

      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        className="hidden"
        aria-hidden="true"
        onEnded={() => setStatus("ready")}
        onPause={() => setStatus((current) => (current === "playing" ? "ready" : current))}
        onPlay={() => setStatus("playing")}
      />

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
