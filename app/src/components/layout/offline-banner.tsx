"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function handleOnline() {
      setOffline(false);
    }
    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="sticky top-14 z-30 flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-900 dark:text-amber-200"
      role="alert"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>オフラインです。保存済みの情報は閲覧できます。</span>
    </div>
  );
}
