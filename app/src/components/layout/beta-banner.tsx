"use client";

import Link from "next/link";

/** 動画・試用向けの軽い表示。機能は制限しない。 */
export function BetaBanner() {
  return (
    <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-center text-xs leading-relaxed text-amber-950 dark:text-amber-100">
      ベータ版です。制度の最終判断は各公式案内を正としてください。
      <Link
        href="/about"
        className="ml-1 font-medium underline-offset-2 hover:underline"
      >
        このサービスについて
      </Link>
    </div>
  );
}
