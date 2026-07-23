"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Check, CloudOff, LogOut, RefreshCw, TriangleAlert, UserRound } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";
import { useAuth } from "@/lib/auth/AuthProvider";
import { scaleIn, transitions } from "@/lib/motion";
import { useCloudSync } from "@/lib/sync/CloudSyncProvider";
import { cn } from "@/lib/utils";

/**
 * Sign-in entry point. Signing in is always optional — the copy says so
 * plainly, because guest progress is a first-class path rather than a
 * degraded one.
 */
export function AccountMenu() {
  const { isConfigured, mode, user, error, signInWithGoogle, signOut, dismissError } =
    useAuth();
  const { status, syncNow } = useCloudSync();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    dismissError();
  }, [dismissError]);

  useDismissOnOutside(containerRef, isOpen, close);

  // Without Supabase credentials there is nothing to sign in to, so the app
  // renders exactly as it did before accounts existed.
  if (!isConfigured) {
    return null;
  }

  const signedIn = mode === "signed-in" && user !== null;

  const handleSignIn = async () => {
    setIsBusy(true);
    await signInWithGoogle();
    setIsBusy(false);
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    await signOut();
    setIsBusy(false);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={signedIn ? `Account: ${user.displayName}` : "Sign in"}
        title={signedIn ? user.displayName : "Sign in"}
        whileTap={{ scale: 0.92 }}
        transition={transitions.snappy}
        className={cn("icon-btn size-9 overflow-hidden", mode === "loading" && "opacity-60")}
      >
        {signedIn && user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={36}
            height={36}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <UserRound size={17} aria-hidden="true" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            role="dialog"
            aria-label="Account"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top right" }}
            className="popover absolute right-0 top-11 z-50 w-72 p-3"
          >
            {signedIn ? (
              <SignedInPanel
                displayName={user.displayName}
                email={user.email}
                isBusy={isBusy}
                status={status}
                onSyncNow={syncNow}
                onSignOut={handleSignOut}
              />
            ) : (
              <SignedOutPanel isBusy={isBusy} onSignIn={handleSignIn} />
            )}

            {error ? (
              <p
                role="alert"
                className="mt-3 flex items-start gap-1.5 rounded-btn bg-danger/10 p-2 text-[11px] leading-4 text-danger"
              >
                <TriangleAlert size={13} aria-hidden="true" className="mt-px shrink-0" />
                {error}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SignedOutPanel({
  isBusy,
  onSignIn,
}: {
  isBusy: boolean;
  onSignIn: () => void;
}) {
  return (
    <>
      <p className="eyebrow">Save your progress</p>
      <p className="mt-1.5 text-[11px] leading-4 text-content-muted">
        <span lang="hi" className="font-hindi">
          साइन इन करें
        </span>{" "}
        to keep your words and streak across devices.
      </p>

      <button
        type="button"
        onClick={onSignIn}
        disabled={isBusy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn border-theme border-line bg-surface px-3 py-2.5 text-xs font-bold shadow-btn transition hover:bg-content/5 disabled:opacity-60"
      >
        <GoogleMark size={15} />
        {isBusy ? "Opening Google…" : "Continue with Google"}
      </button>

      <div className="mt-3 border-t border-line/60 pt-2.5">
        <p className="flex items-start gap-1.5 text-[11px] leading-4 text-content-subtle">
          <CloudOff size={13} aria-hidden="true" className="mt-px shrink-0" />
          You&rsquo;re practising as a guest. Everything already works — progress
          is saved on this device only.
        </p>
      </div>
    </>
  );
}

function SignedInPanel({
  displayName,
  email,
  isBusy,
  status,
  onSyncNow,
  onSignOut,
}: {
  displayName: string;
  email: string | null;
  isBusy: boolean;
  status: ReturnType<typeof useCloudSync>["status"];
  onSyncNow: () => void;
  onSignOut: () => void;
}) {
  return (
    <>
      <p className="eyebrow">Signed in</p>
      <p className="mt-1 truncate text-sm font-bold">{displayName}</p>
      {email ? (
        <p className="truncate text-[11px] text-content-subtle">{email}</p>
      ) : null}

      <div className="mt-3 border-t border-line/60 pt-2.5">
        <SyncIndicator status={status} />
        <button
          type="button"
          onClick={onSyncNow}
          disabled={status === "syncing"}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-btn px-3 py-2 text-[11px] font-semibold text-content-muted transition hover:bg-content/5 disabled:opacity-60"
        >
          <RefreshCw size={12} aria-hidden="true" />
          Sync now
        </button>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        disabled={isBusy}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-btn px-3 py-2 text-[11px] font-semibold text-content-muted transition hover:bg-content/5 disabled:opacity-60"
      >
        <LogOut size={12} aria-hidden="true" />
        Sign out
      </button>
      <p className="mt-1.5 text-center text-[10px] leading-4 text-content-subtle">
        Your words stay on this device after signing out.
      </p>
    </>
  );
}

function SyncIndicator({ status }: { status: ReturnType<typeof useCloudSync>["status"] }) {
  if (status === "syncing") {
    return (
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-content-muted">
        <RefreshCw size={12} aria-hidden="true" className="animate-spin" />
        Syncing…
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="flex items-start gap-1.5 text-[11px] font-semibold text-danger">
        <TriangleAlert size={12} aria-hidden="true" className="mt-px shrink-0" />
        Sync paused — your progress is safe on this device.
      </p>
    );
  }

  if (status === "synced") {
    return (
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success">
        <Check size={12} aria-hidden="true" />
        Progress synced
      </p>
    );
  }

  return (
    <p className="text-[11px] font-semibold text-content-muted">Waiting to sync…</p>
  );
}
