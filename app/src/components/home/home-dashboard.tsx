"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CalendarClock, CheckCircle2, ChevronRight } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";
import { IdentityRegisterPrompt } from "@/components/auth/identity-status-chip";
import { FontSizeQuickControl } from "@/components/settings/font-size-quick-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmergencyContacts } from "@/components/emergency/emergency-contacts";
import { NowBadge } from "@/components/actions/now-badge";
import { useUserSession } from "@/hooks/use-user-session";
import {
  formatCaseSituation,
  getCaseProgress,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import { getActionCompletionUIState } from "@/lib/case-management/evidence";
import { getPrimaryDeadlineDisplay } from "@/lib/case-management/deadlines";
import {
  canUserStartRecoveryPhase,
} from "@/lib/case-management/recovery-phase";
import { getContinuityDashboard } from "@/lib/case-management/continuity-dashboard";
import {
  buildPostJ00WelcomeMessage,
} from "@/lib/onboarding/onboarding-copy";
import { getActionDetailPath, getCaseActionDetailPath, getFirstIncompleteAction } from "@/lib/navigation";
import {
  formatActionCompanionDescription,
} from "@/lib/case-management/action-queue";
import { isRedundantCompanionCopy } from "@/lib/case-management/survivor-copy-quality";

export function HomeDashboard() {
  const router = useRouter();
  const {
    session,
    loading,
    startRecoveryPhase,
    dismissPostJ00Welcome,
  } = useUserSession();
  const { actions, caseFile, profile } = session;
  const nextAction = getFirstIncompleteAction(actions);
  const [showPostJ00Welcome] = useState(
    () => session.showPostJ00Welcome === true
  );

  useEffect(() => {
    if (!session.showPostJ00Welcome) return;
    dismissPostJ00Welcome();
  }, [session.showPostJ00Welcome, dismissPostJ00Welcome]);

  if (loading) {
    return (
      <p className="py-8 text-center text-muted-foreground">読み込み中…</p>
    );
  }

  if (profile.j00Completed && !caseFile) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        状況を整理しています…
      </p>
    );
  }

  if (caseFile) {
    const current = getCurrentAction(caseFile);
    const progress = getCaseProgress(caseFile);

    if (current) {
      const ui = getActionCompletionUIState(caseFile, current);
      const continuity = getContinuityDashboard(
        caseFile,
        profile,
        session.continuitySnapshot
      );
      const deadlineDisplay = getPrimaryDeadlineDisplay(caseFile);
      const postJ00Welcome =
        showPostJ00Welcome
          ? buildPostJ00WelcomeMessage(
              caseFile,
              profile,
              session.onboardingTimingHint
            )
          : null;
      const showRecoveryStart =
        canUserStartRecoveryPhase(caseFile) && !postJ00Welcome;

      function handlePrimaryClick() {
        router.push(getCaseActionDetailPath(current!.id));
      }

      const heroDescription = formatActionCompanionDescription(current);
      const showHeroDescription = !isRedundantCompanionCopy(
        continuity.nextAction.headline,
        heroDescription
      );
      const attentionItems = continuity.needsAttention.slice(0, 1);
      const primaryDeadline = continuity.deadlineNote ?? (deadlineDisplay
        ? {
            label: deadlineDisplay.deadline.label,
            displayText: deadlineDisplay.displayText,
          }
        : null);
      const progressPercent =
        progress.total > 0
          ? Math.round((progress.completed / progress.total) * 100)
          : 0;

      return (
        <div className="space-y-4 pb-2">
          {postJ00Welcome ? (
            <>
              <Card className="border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CardContent className="space-y-3 p-5">
                  <h2 className="text-2xl font-bold leading-snug">
                    {postJ00Welcome.title}
                  </h2>
                  <p className="text-base leading-relaxed">
                    {postJ00Welcome.situationSummary}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[hsl(24_90%_40%)] bg-accent/50">
                <CardContent className="space-y-4 p-5">
                  <NowBadge size="lg" />
                  <p className="text-xl font-bold leading-snug">
                    {postJ00Welcome.firstStepHeadline}
                  </p>
                  <Button
                    size="lg"
                    className="h-14 w-full text-lg"
                    onClick={() =>
                      router.push(getCaseActionDetailPath(current.id))
                    }
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    ここから進む
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-0.5">
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {progress.completed}/{progress.total}
                </span>
              </div>

              {showRecoveryStart && (
                <Card className="border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-base font-medium text-emerald-900 dark:text-emerald-100">
                      安全が確保できましたか？
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full border-emerald-300 bg-background/80 text-base"
                      onClick={() => startRecoveryPhase()}
                    >
                      安全のあとに、手続きの確認を始める
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="overflow-hidden border-2 border-[hsl(24_90%_40%)] bg-accent/50 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <NowBadge size="lg" />
                  <p className="text-xl font-bold leading-snug">
                    {continuity.nextAction.headline}
                  </p>
                  {showHeroDescription && (
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {heroDescription}
                    </p>
                  )}
                  {ui.evidenceHint && (
                    <p className="text-base leading-relaxed text-amber-800 dark:text-amber-200">
                      {ui.evidenceHint.replace(/証跡/g, "記録")}
                    </p>
                  )}
                  <Button
                    size="lg"
                    className="h-14 w-full text-lg"
                    onClick={handlePrimaryClick}
                  >
                    {ui.showEvidenceButton && !ui.hasEvidence ? (
                      <>
                        <Camera className="h-5 w-5" />
                        記録から進む
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        ここから進む
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {primaryDeadline && (
                <Link
                  href="/deadlines"
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-accent/30"
                >
                  <CalendarClock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">期限</p>
                    <p className="truncate text-base font-medium">
                      {primaryDeadline.label}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {primaryDeadline.displayText}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              )}

              {attentionItems.length > 0 && (
                <Link
                  href={
                    attentionItems[0].href ??
                    getCaseActionDetailPath(current.id)
                  }
                  className="flex items-start gap-2 rounded-xl border border-amber-200/60 px-4 py-3.5 text-base leading-snug dark:border-amber-900/40"
                >
                  <span className="flex-1">{attentionItems[0].message}</span>
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 opacity-60" />
                </Link>
              )}
            </div>
          )}

          <Link
            href="/info"
            className="flex items-center justify-between rounded-xl border px-4 py-3.5 text-base text-muted-foreground transition-colors hover:bg-muted/40"
          >
            <span>気象・ライフライン・相談</span>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Link>

          <details className="rounded-xl border border-destructive/20 bg-background px-4 py-3">
            <summary className="cursor-pointer text-base font-medium text-muted-foreground">
              緊急のとき（119・110など）
            </summary>
            <div className="mt-3">
              <EmergencyContacts compact />
            </div>
          </details>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <p className="text-base font-medium text-muted-foreground">
              あなたの状況
            </p>
            <p className="text-xl font-bold leading-snug">
              {formatCaseSituation(caseFile) !== "状況確認中"
                ? formatCaseSituation(caseFile)
                : "状況を整理しました"}
            </p>
            <Button asChild size="lg" className="h-14 w-full text-lg">
              <Link href="/actions">
                やることの一覧を見る
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Link
          href="/info"
          className="flex items-center justify-between rounded-xl border px-4 py-3.5 text-base text-muted-foreground transition-colors hover:bg-muted/40"
        >
          <span>気象・ライフライン・相談</span>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </Link>

        <details className="rounded-xl border border-destructive/20 bg-background px-4 py-3">
          <summary className="cursor-pointer text-base font-medium text-muted-foreground">
            緊急のとき（119・110など）
          </summary>
          <div className="mt-3">
            <EmergencyContacts compact />
          </div>
        </details>
      </div>
    );
  }

  if (nextAction) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-[hsl(24_90%_40%)] bg-accent/50">
          <CardContent className="space-y-4 p-6">
            <NowBadge size="lg" />
            <p className="text-2xl font-bold leading-snug">{nextAction.title}</p>
            <p className="text-base text-muted-foreground">
              {nextAction.description}
            </p>
            <Button asChild size="lg" className="h-14 w-full text-lg">
              <Link href={getActionDetailPath(nextAction)}>ここから進む</Link>
            </Button>
          </CardContent>
        </Card>
        <details className="rounded-xl border border-destructive/20 bg-background px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            緊急のとき（119・110など）
          </summary>
          <div className="mt-3">
            <EmergencyContacts compact />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-2">
      <div className="flex flex-col items-center gap-3 px-2 pt-2 text-center">
        <AppLogo size="hero" priority />
        <p className="text-lg leading-relaxed text-muted-foreground">
          一歩ずつ、暮らしを取り戻すために
        </p>
      </div>

      <Card className="border-2 border-primary/20 bg-card shadow-sm">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-2xl font-bold leading-snug">
            次に確認することを、順番に案内します
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            令和8年熊本地震向け。無料・登録なしで始められます。わからない項目はそのままで大丈夫です。
          </p>
          <Button asChild size="lg" className="h-16 w-full text-xl">
            <Link href="/start">状況を選んで案内を作る</Link>
          </Button>
          <p className="text-center text-base text-muted-foreground">
            約2分です
          </p>
        </CardContent>
      </Card>

      <IdentityRegisterPrompt />

      <FontSizeQuickControl className="mx-0" />

      <details className="rounded-xl border border-destructive/20 bg-background px-4 py-3">
        <summary className="cursor-pointer text-base font-medium text-muted-foreground">
          緊急のとき（119・110など）
        </summary>
        <div className="mt-3">
          <EmergencyContacts compact />
        </div>
      </details>
    </div>
  );
}
