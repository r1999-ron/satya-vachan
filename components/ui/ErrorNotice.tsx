import { AlertCircle, RefreshCw } from "lucide-react";

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
    <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-100/55 p-4 text-sm leading-6 text-rose-950 dark:border-rose-300/25 dark:bg-rose-300/12 dark:text-rose-100">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
        <p className="min-w-0 flex-1">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-400/45 focus:ring-offset-2 focus:ring-offset-paper active:translate-y-0 dark:bg-rose-200 dark:text-rose-950 dark:focus:ring-offset-zinc-950"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
