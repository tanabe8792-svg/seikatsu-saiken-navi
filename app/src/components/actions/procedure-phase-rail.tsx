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
      <ol className="flex items-stretch gap-1.5">
        {phases.map((phase, index) => {
          const interactive = Boolean(phase.targetId);
          const Inner = interactive ? "button" : "div";
          return (
            <li key={phase.id} className="min-w-0 flex-1">
              <Inner
                type={interactive ? "button" : undefined}
                onClick={
                  interactive ? () => scrollTo(phase.targetId) : undefined
                }
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition",
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
                    "text-[11px] leading-tight",
                    phase.status === "current"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {index + 1}.{phase.label}
                </span>
                {phase.status === "current" && phase.detail ? (
                  <span className="text-[10px] text-muted-foreground">
                    {phase.detail}
                  </span>
                ) : null}
              </Inner>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
