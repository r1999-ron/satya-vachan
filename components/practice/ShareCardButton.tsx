"use client";

import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { transitions } from "@/lib/motion";
import { shareTransformationCard } from "@/lib/share-card";
import { cn } from "@/lib/utils";
import type { HindiText } from "@/types";

type ShareCardButtonProps = {
  original: string;
  polished: HindiText;
};

/**
 * Turns a completed transformation into a shareable image. On mobile it opens
 * the native share sheet; elsewhere it downloads a PNG.
 */
export function ShareCardButton({ original, polished }: ShareCardButtonProps) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  const handleShare = useCallback(async () => {
    if (status === "working") {
      return;
    }

    setStatus("working");

    try {
      await shareTransformationCard({ original, polished });
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2600);
    }
  }, [original, polished, status]);

  return (
    <motion.button
      type="button"
      onClick={() => void handleShare()}
      disabled={status === "working"}
      whileTap={{ scale: 0.94 }}
      transition={transitions.snappy}
      aria-label="Share this transformation as an image"
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-chip border-theme border-line bg-surface px-3 text-xs font-bold text-content-muted transition-colors hover:text-content",
        status === "done" && "text-success",
      )}
    >
      {status === "done" ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Share2 size={14} aria-hidden="true" />
      )}
      {status === "working"
        ? "Preparing..."
        : status === "done"
          ? "Ready"
          : status === "error"
            ? "Try again"
            : "Share"}
    </motion.button>
  );
}
