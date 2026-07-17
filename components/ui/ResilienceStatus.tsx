"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { canUseLocalStorage } from "@/lib/storage";

export function ResilienceStatus() {
  const [online, setOnline] = useState(true);
  const [storageReady, setStorageReady] = useState(true);

  useEffect(() => {
    const refreshStatus = () => {
      setOnline(navigator.onLine);
      setStorageReady(canUseLocalStorage());
    };
    const refreshTimer = window.setTimeout(refreshStatus, 0);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && storageReady) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!online ? <StatusBadge tone="rose">Offline</StatusBadge> : null}
      {!storageReady ? (
        <StatusBadge tone="gold">Progress not saved</StatusBadge>
      ) : null}
    </div>
  );
}
