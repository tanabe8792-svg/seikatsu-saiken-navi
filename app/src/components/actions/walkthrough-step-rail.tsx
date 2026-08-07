"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface WalkthroughStepRailProps {
  total: number;
  /** 確認済みの数（0〜total） */
  completedCount: number;
  /** いま見ている手順番号（1始まり）。全部済みなら total */
  currentNumber: number;
}

/** 手順の中での進み（1→2→3）。丸は固定、間の線だけ均等に伸ばす */
export function WalkthroughStepRail({
  total,
  completedCount,
  currentNumber,
}: WalkthroughStepRailProps) {
  if (total <= 1) return null;

  const allDone = completedCount >= total;

  return (
    <div
      className="space-y-1.5"
      aria-label={`手順の進み ${completedCount}/${total}`}
    >
      <p className="text-xs text-muted-foreground">
        {allDone
          ? `手順は全部確認できました（${total}）`
          : `手順 ${currentNumber}/${total} を確認中`}
      </p>
      <div className="flex w-full items-center" role="list">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const done = n <= completedCount;
          const current = !allDone && n === currentNumber;
          const connectorDone = completedCount >= n;

          return (
            <Fragment key={n}>
              <span
                role="listitem"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  done && "border-brand-green bg-brand-green text-white",
                  current &&
                    "border-brand-orange bg-brand-orange text-white shadow-sm",
                  !done &&
                    !current &&
                    "border-border bg-background text-muted-foreground"
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? "✓" : n}
              </span>
              {i < total - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-0.5 min-w-0 flex-1 basis-0 rounded-full transition-colors",
                    connectorDone ? "bg-brand-green" : "bg-muted"
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
