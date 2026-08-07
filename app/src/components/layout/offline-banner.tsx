"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, WifiOff } from "lucide-react";
import { isBrowserOnline, subscribeOnlineStatus } from "@/lib/offline/network";
import { hasPendingOutbox, loadOutbox } from "@/lib/offline/outbox";
import { summarizePendingForBanner } from "@/lib/offline/flush-outbox";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setOffline(!isBrowserOnline());
      setPendingLabel(summarizePendingForBanner());
    }

    refresh();
    const unsub = subscribeOnlineStatus(() => refresh());
    window.addEventListener("offline-outbox-changed", refresh);
    return () => {
      unsub();
      window.removeEventListener("offline-outbox-changed", refresh);
    };
  }, []);

  if (offline) {
    return (
      <div
        className="sticky top-14 z-30 flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-950 dark:text-amber-100"
        role="alert"
      >
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span className="leading-relaxed">
          オフラインです。入力した内容はこの端末に残します。ネットにつながると正式に反映します。
        </span>
      </div>
    );
  }

  if (pendingLabel && hasPendingOutbox(loadOutbox())) {
    return (
      <div
        className="sticky top-14 z-30 flex items-start gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-950 dark:text-emerald-100"
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span className="leading-relaxed">
          つながっています。仮保存の内容（{pendingLabel}
          ）を正式に反映しています。
        </span>
      </div>
    );
  }

  return null;
}
