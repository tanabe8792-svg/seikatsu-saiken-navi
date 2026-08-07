"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface WalkthroughStepRailProps {
  stepIds: string[];
  /** 確認済みの数（0〜total） */
  completedCount: number;
  /** いま見ている手順番号（1始まり）。全部済みなら total */
  currentNumber: number;
  onJumpToStep: (stepId: string) => void;
}

/** 手順の中での進み（1→2→3）。丸は固定、間の線だけ均等。押すとその手順へ。 */
export function WalkthroughStepRail({
  stepIds,
  completedCount,
  currentNumber,
  onJumpToStep,
}: WalkthroughStepRailProps) {
  const total = stepIds.length;
  if (total <= 1) return null;

  const allDone = completedCount >= total;

  return (
    <div
      className="space-y-1.5"
      aria-label={`手順の進み ${completedCount}/${total}`}
    >
      <p className="text-xs text-muted-foreground">
        {allDone
          ? `手順は全部確認できました（${total}） · 番号を押すとその手順へ`
          : `手順 ${currentNumber}/${total} を確認中 · 番号を押すとその手順へ`}
      </p>
      <div className="flex w-full items-center" role="list">
        {stepIds.map((stepId, i) => {
          const n = i + 1;
          const done = n <= completedCount;
          const current = !allDone && n === currentNumber;
          const connectorDone = completedCount >= n;

          return (
            <Fragment key={stepId}>
              <button
                type="button"
                role="listitem"
                onClick={() => onJumpToStep(stepId)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition active:scale-95",
                  done && "border-brand-green bg-brand-green text-white",
                  current &&
                    "border-brand-orange bg-brand-orange text-white shadow-sm",
                  !done &&
                    !current &&
                    "border-border bg-background text-muted-foreground"
                )}
                aria-label={`手順${n}へ移動`}
                aria-current={current ? "step" : undefined}
              >
                {done ? "✓" : n}
              </button>
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
