"use client";

import Link from "next/link";
import { getCaseActionDetailPath } from "@/lib/navigation";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActionCompanionDescription,
  formatActionCompanionHeadline,
  formatActionFriendlyReason,
  formatCaseSituation,
  getCaseProgress,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import { getActionWalkthrough } from "@/lib/case-management/action-walkthrough";
import { getRecoveryPhaseDisplay } from "@/lib/case-management/recovery-dashboard";
import type { CaseAction, CaseFile } from "@/lib/case-management/types";

const PRIORITY_LABELS: Record<CaseAction["priority"], string> = {
  critical: "最優先",
  high: "重要",
  medium: "通常",
  low: "あとで",
};

interface CaseActionsDashboardProps {
  caseFile: CaseFile;
}

function actionKeyword(action: CaseAction): string {
  return getActionWalkthrough(action.id, action.title).plainTitle;
}

export function CaseActionsDashboard({ caseFile }: CaseActionsDashboardProps) {
  const current = getCurrentAction(caseFile);
  const progress = getCaseProgress(caseFile);
  const phaseMode = caseFile.recoveryPhase?.mode ?? "recovery";
  const phaseDisplay = getRecoveryPhaseDisplay(phaseMode);
  const situation = formatCaseSituation(caseFile);
  const pending = caseFile.pendingActions;
  const completed = caseFile.completedActions;
  const remaining = pending.filter(
    (a) => a.status === "todo" || a.status === "doing"
  ).length;
  const percent =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-5 pb-28">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium text-primary">
              {phaseDisplay.title}
            </p>
            {situation && situation !== "状況確認中" && (
              <p className="mt-1 text-base font-semibold">{situation}</p>
            )}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ここまで来た進み具合</p>
              <p className="text-2xl font-bold tabular-nums">
                {progress.completed}
                <span className="text-lg font-medium text-muted-foreground">
                  {" "}
                  / {progress.total}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {progress.completed === 0
                  ? "これから一緒に進めましょう"
                  : `${progress.completed}件確認できました（${percent}%）`}
              </p>
            </div>
            <p className="text-right text-sm text-muted-foreground">
              これから
              <br />
              <span className="text-base font-semibold text-foreground">
                残り {remaining} 件
              </span>
            </p>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-primary/15">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {completed.length > 0 && (
            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                ここまで確認できたこと
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-950/90 dark:text-emerald-50/90">
                {completed.map((a) => actionKeyword(a)).join(" → ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold text-muted-foreground">
              やること一覧
            </h2>
            <p className="text-xs text-muted-foreground">どれでも開けます</p>
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            スクロールして全体を見てから、「詳しく確認する」を押してください。順番は目安です。
          </p>
          <ul className="space-y-3">
            {pending.map((action, index) => (
              <li key={action.id}>
                <ActionRow
                  action={action}
                  step={progress.completed + index + 1}
                  isCurrent={current?.id === action.id}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {current && (
        <Card className="border border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold text-primary">
              迷ったらここから（任意）
            </p>
            <ActionPreview action={current} isCurrent />
            <Button asChild size="lg" className="h-12 w-full">
              <Link href={getCaseActionDetailPath(current.id)}>
                この項目を詳しく確認する
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">
            ここまで確認できたこと
          </h2>
          <ul className="space-y-2">
            {completed.map((action) => (
              <li key={action.id}>
                <ActionRow action={action} done />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ActionPreview({
  action,
  isCurrent,
}: {
  action: CaseAction;
  isCurrent?: boolean;
}) {
  const keyword = actionKeyword(action);
  const reason = formatActionFriendlyReason(action);
  const description = formatActionCompanionDescription(action);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {isCurrent && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            いま
          </span>
        )}
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {PRIORITY_LABELS[action.priority]}
        </span>
      </div>
      <p className="text-xl font-bold leading-snug">{keyword}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description || reason}
      </p>
    </div>
  );
}

function ActionRow({
  action,
  step,
  isCurrent,
  done,
}: {
  action: CaseAction;
  step?: number;
  isCurrent?: boolean;
  done?: boolean;
}) {
  const keyword = actionKeyword(action);
  const reason = formatActionFriendlyReason(action);
  const companion = formatActionCompanionHeadline(action, reason);

  return (
    <Link
      href={getCaseActionDetailPath(action.id)}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={
          done
            ? "border-border/60 bg-muted/20 transition-colors hover:bg-muted/40"
            : isCurrent
              ? "border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10"
              : "transition-colors hover:bg-accent/40"
        }
      >
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 shrink-0">
            {done ? (
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
            ) : (
              <Circle
                className={`h-5 w-5 ${isCurrent ? "text-primary" : "text-muted-foreground/50"}`}
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {step != null && !done && (
                <span className="text-xs font-medium text-muted-foreground">
                  {step}.
                </span>
              )}
              {isCurrent && !done && (
                <span className="text-xs font-semibold text-primary">いま</span>
              )}
              {done && (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  確認済み
                </span>
              )}
            </div>
            <p
              className={`text-base font-semibold leading-snug ${
                done ? "text-muted-foreground" : ""
              }`}
            >
              {keyword}
            </p>
            {!done && companion !== keyword && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {companion}
              </p>
            )}
            {!done && (
              <p className="pt-1 text-sm font-medium text-primary">
                詳しく確認する
              </p>
            )}
          </div>
          <ChevronRight
            className={`mt-1 h-5 w-5 shrink-0 ${
              isCurrent && !done
                ? "text-primary"
                : "text-muted-foreground/60"
            }`}
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
