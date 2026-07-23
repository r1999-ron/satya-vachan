"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { SyncStatus } from "@/lib/auth/types";
import {
  STORAGE_EVENT,
  readLocalSnapshot,
  writeLocalSnapshot,
} from "@/lib/storage";
import type { StateSnapshot } from "@/lib/sync/keys";
import { mergeSnapshots } from "@/lib/sync/merge";

/**
 * Mirrors local progress to Postgres for signed-in users.
 *
 * The app stays local-first: localStorage remains the synchronous source of
 * truth every screen reads, so guests are unaffected and a signed-in user
 * whose network drops keeps practising normally. This provider only adds a
 * background pull-merge-push cycle on top.
 */

type CloudSyncContextValue = {
  status: SyncStatus;
  lastSyncedAt: number | null;
  /** Pushes pending local changes immediately. */
  syncNow: () => Promise<void>;
};

const IDLE_CONTEXT: CloudSyncContextValue = {
  status: "idle",
  lastSyncedAt: null,
  syncNow: async () => {},
};

const CloudSyncContext = createContext<CloudSyncContextValue>(IDLE_CONTEXT);

/** Coalesces a burst of writes (saving a word bumps several keys) into one push. */
const PUSH_DEBOUNCE_MS = 2_000;

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { mode, user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const userId = user?.id ?? null;
  // Until the first pull completes, a local write must not overwrite the cloud
  // copy with a snapshot that has not seen remote history yet.
  const hasPulledRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  const push = useCallback(async () => {
    if (!hasPulledRef.current) {
      return;
    }

    if (inFlightRef.current) {
      // Remember that more changes landed mid-flight; the loop below picks
      // them up rather than starting a second overlapping request.
      pendingRef.current = true;
      return;
    }

    inFlightRef.current = true;
    setStatus("syncing");

    try {
      do {
        pendingRef.current = false;

        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot: readLocalSnapshot() }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed with ${response.status}`);
        }
      } while (pendingRef.current);

      setStatus("synced");
      setLastSyncedAt(Date.now());
    } catch {
      // A failed push is not user-facing damage: local state is intact and the
      // next change (or next sign-in) retries.
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      pendingRef.current = false;
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
    }

    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      void push();
    }, PUSH_DEBOUNCE_MS);
  }, [push]);

  // Pull on sign-in, merge with whatever this device already has, then push
  // the reconciled result back so both sides end up identical.
  useEffect(() => {
    hasPulledRef.current = false;

    if (mode !== "signed-in" || !userId) {
      queueMicrotask(() => setStatus("idle"));
      return;
    }

    let isActive = true;

    const pull = async () => {
      setStatus("syncing");

      try {
        const response = await fetch("/api/state", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Pull failed with ${response.status}`);
        }

        const payload = (await response.json()) as { snapshot?: StateSnapshot };

        if (!isActive) {
          return;
        }

        const merged = mergeSnapshots(readLocalSnapshot(), payload.snapshot ?? {});
        writeLocalSnapshot(merged);
        hasPulledRef.current = true;

        await push();
      } catch {
        if (isActive) {
          setStatus("error");
        }
      }
    };

    // Deferred off the effect body so the "syncing" status update does not
    // cascade a render synchronously.
    queueMicrotask(() => {
      if (isActive) {
        void pull();
      }
    });

    return () => {
      isActive = false;
    };
  }, [mode, push, userId]);

  // Any local write schedules a push, but only once the initial pull has run.
  useEffect(() => {
    if (mode !== "signed-in") {
      return;
    }

    const handleChange = () => {
      if (hasPulledRef.current) {
        schedulePush();
      }
    };

    window.addEventListener(STORAGE_EVENT, handleChange);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleChange);
    };
  }, [mode, schedulePush]);

  // Don't leave the last few seconds of practice unsynced when a tab closes.
  useEffect(() => {
    if (mode !== "signed-in") {
      return;
    }

    const flush = () => {
      if (document.visibilityState === "hidden" && pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
        void push();
      }
    };

    document.addEventListener("visibilitychange", flush);

    return () => {
      document.removeEventListener("visibilitychange", flush);
    };
  }, [mode, push]);

  useEffect(
    () => () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }
    },
    [],
  );

  const syncNow = useCallback(async () => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }

    await push();
  }, [push]);

  const value = useMemo<CloudSyncContextValue>(
    () => ({ status, lastSyncedAt, syncNow }),
    [lastSyncedAt, status, syncNow],
  );

  return (
    <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  return useContext(CloudSyncContext);
}
