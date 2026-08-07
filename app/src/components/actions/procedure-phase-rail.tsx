"use client";

import { cn } from "@/lib/utils";

export type ProcedurePhase = {
  id: string;
  label: string;
  /** いまの段階のときだけ短く出す（例: 2/4） */
  detail?: string;
  status: "done" | "current" | "upcoming";
  /** 押すと該当箇所へスクロール */
  targetId?: string;
};

interface ProcedurePhaseRailProps {
  phases: ProcedurePhase[];
  /** いまの段階を一文で（例: いまは準備物の確認） */
  currentHint: string;
}

export function ProcedurePhaseRail({
  phases,
  currentHint,
}: ProcedurePhaseRailProps) {
  if (phases.length === 0) return null;

  function scrollTo(targetId?: string) {
    if (!targetId) return;
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-2" aria-label="この手続きの進み方">
      <p className="text-xs font-medium text-foreground">{currentHint}</p>
      <ol
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))`,
        }}
      >
        {phases.map((phase, index) => {
          const interactive = Boolean(phase.targetId);
          const Inner = interactive ? "button" : "div";
          return (
            <li key={phase.id} className="min-w-0">
              <Inner
                type={interactive ? "button" : undefined}
                onClick={
                  interactive ? () => scrollTo(phase.targetId) : undefined
                }
                className={cn(
                  "flex h-full w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition",
                  interactive && "active:scale-[0.98]"
                )}
                aria-current={phase.status === "current" ? "step" : undefined}
              >
                <span
                  className={cn(
                    "h-2 w-full rounded-full",
                    phase.status === "done" && "bg-brand-green",
                    phase.status === "current" && "bg-brand-orange",
                    phase.status === "upcoming" && "bg-muted"
                  )}
                />
                <span
                  className={cn(
                    "min-h-[2.5rem] text-[11px] leading-tight",
                    phase.status === "current"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {index + 1}.{phase.label}
                  {phase.status === "current" && phase.detail ? (
                    <>
                      <br />
                      <span className="font-normal text-muted-foreground">
                        {phase.detail}
                      </span>
                    </>
                  ) : null}
                </span>
              </Inner>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
