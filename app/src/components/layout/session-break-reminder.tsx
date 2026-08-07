"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ssn:breakAnchorMs";
const REMIND_MS = 30 * 60 * 1000;
const TICK_MS = 60 * 1000;

function readAnchor(): number {
  if (typeof window === "undefined") return Date.now();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function writeAnchor(ms: number) {
  sessionStorage.setItem(STORAGE_KEY, String(ms));
}

/** ページを開いてから約30分ごとに、無理のない休憩をやさしく促す（サーバー不要） */
export function SessionBreakReminder() {
  const [visible, setVisible] = useState(false);

  const evaluate = useCallback(() => {
    if (document.visibilityState === "hidden") return;
    const anchor = readAnchor();
    if (Date.now() - anchor >= REMIND_MS) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      writeAnchor(Date.now());
    }
    evaluate();
    const id = window.setInterval(evaluate, TICK_MS);
    return () => window.clearInterval(id);
  }, [evaluate]);

  function handleContinue() {
    writeAnchor(Date.now());
    setVisible(false);
  }

  function handleRest() {
    writeAnchor(Date.now());
    setVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/40"
    >
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
        30分ほど画面を見ています
      </p>
      <p className="mt-1 text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
        マイナポータルなどは何時間もかかることがあります。急がなくて大丈夫です。一度休んで、あとから続けても進捗は残ります。
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-9"
          onClick={handleRest}
        >
          いったん休む
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 bg-background"
          onClick={handleContinue}
        >
          このまま続ける
        </Button>
      </div>
    </div>
  );
}
