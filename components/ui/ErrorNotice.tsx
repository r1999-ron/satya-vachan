"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, transitions } from "@/lib/motion";

type ErrorNoticeProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
};

export function ErrorNotice({
  actionLabel,
  message,
  onAction,
}: ErrorNoticeProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      role="alert"
      className="mt-4 rounded-card border-theme border-danger/50 bg-danger-soft p-4 text-sm leading-6 text-content"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} aria-hidden="true" />
        <p className="min-w-0 flex-1">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <motion.button
          type="button"
          onClick={onAction}
          whileTap={{ scale: 0.97 }}
          transition={transitions.snappy}
          className="btn btn-outline mt-3 min-h-10 text-xs"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {actionLabel}
        </motion.button>
      ) : null}
    </motion.div>
  );
}
