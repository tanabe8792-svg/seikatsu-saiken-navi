"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CalendarClock, CheckCircle2, ChevronRight, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmergencyContacts } from "@/components/emergency/emergency-contacts";
import { useUserSession } from "@/hooks/use-user-session";
import {
  formatCaseSituation,
  getCaseProgress,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import { getActionCompletionUIState } from "@/lib/case-management/evidence";
import { buildActionDecisionExplanation } from "@/lib/case-management/decision-explanation";
import { getPrimaryDeadlineDisplay } from "@/lib/case-management/deadlines";
import {
  canUserStartRecoveryPhase,
} from "@/lib/case-management/recovery-phase";
import {
  getAcuteExternalLinksForRecovery,
  getProcedureOverview,
} from "@/lib/case-management/recovery-dashboard";
import { getContinuityDashboard } from "@/lib/case-management/continuity-dashboard";
import {
  buildPostJ00WelcomeMessage,
  buildPostJ00ProfileBullets,
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
      const explanation = buildActionDecisionExplanation(
        caseFile,
        current,
        profile
      );
      const continuity = getContinuityDashboard(
        caseFile,
        profile,
        session.continuitySnapshot
      );
      const deadlineDisplay = getPrimaryDeadlineDisplay(caseFile);
      const procedureOverview = getProcedureOverview(caseFile, current);
      const acuteExternalLinks = getAcuteExternalLinksForRecovery(
        profile,
        caseFile
      );
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

      const profileBullets = buildPostJ00ProfileBullets(profile);
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
        <div className="space-y-4">
          {postJ00Welcome ? (
            <>
              <Card className="border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      はじめに — 状況の整理
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-snug">
                      {postJ00Welcome.title}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed">
                      {postJ00Welcome.situationSummary}
                    </p>
                  </div>

                  {profileBullets.length > 0 && (
                    <ul className="space-y-2 rounded-xl border border-emerald-200/70 bg-background/80 px-4 py-4 dark:border-emerald-900/40">
                      {profileBullets.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm leading-relaxed"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {postJ00Welcome.timingNote && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {postJ00Welcome.timingNote}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="space-y-4 p-6">
                  <p className="text-sm font-medium text-primary">
                    {postJ00Welcome.firstStepLead}
                  </p>
                  <p className="text-xl font-bold leading-snug">
                    {postJ00Welcome.firstStepHeadline}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {continuity.nextAction.description}
                  </p>
                  <Button
                    size="lg"
                    className="h-14 w-full text-lg"
                    onClick={handlePrimaryClick}
                  >
                  {ui.showEvidenceButton && !ui.hasEvidence ? (
                    <>
                      <Camera className="h-5 w-5" />
                      写真の記録から確認する
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      最初の確認をはじめる
                    </>
                  )}
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 w-full">
                    <Link href="/actions">やること一覧を見る</Link>
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
            </>
          ) : (
            <div className="space-y-3 pb-2">
              <div className="flex items-center gap-3 px-0.5">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {progress.completed}/{progress.total}
                </span>
              </div>

              {showRecoveryStart && (
                <Card className="border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      安全が確保できましたか？
                    </p>
                    <p className="text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
                      被害記録・支援制度・手続きの再建伴走を一緒に始められます。
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-emerald-300 bg-background/80"
                      onClick={() => startRecoveryPhase()}
                    >
                      再建伴走を開始する
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="overflow-hidden border-2 border-primary/45 shadow-md">
                <CardContent className="space-y-4 p-5">
                  <p className="text-sm font-medium text-primary">
                    次に一緒に確認すること
                  </p>
                  <p className="text-xl font-bold leading-snug">
                    {continuity.nextAction.headline}
                  </p>
                  {showHeroDescription && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {heroDescription}
                    </p>
                  )}
                  {ui.evidenceHint && (
                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
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
                        記録から確認する
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        詳しく確認する
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {primaryDeadline && (
                <Link
                  href="/deadlines"
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/30"
                >
                  <CalendarClock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">期限</p>
                    <p className="truncate text-sm font-medium">
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
                  href={attentionItems[0].href ?? getCaseActionDetailPath(current.id)}
                  className="flex items-start gap-2 rounded-xl border border-amber-200/60 px-4 py-3 text-sm leading-snug dark:border-amber-900/40"
                >
                  <span className="flex-1">{attentionItems[0].message}</span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                </Link>
              )}

              <details className="rounded-xl border bg-card px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  状況の詳細
                </summary>
                <div className="mt-3 space-y-3 text-sm leading-relaxed">
                  {continuity.situationContext && (
                    <p className="font-medium">{continuity.situationContext}</p>
                  )}
                  <p className="text-muted-foreground">
                    {continuity.currentSituation}
                  </p>
                  {continuity.changesSinceLastVisit.length > 0 && (
                    <ul className="space-y-1">
                      {continuity.changesSinceLastVisit.map((item) => (
                        <li
                          key={`${item.kind}-${item.summary}`}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{item.summary}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(continuity.progressReassurance ||
                    continuity.completedItems.length > 0) && (
                    <div className="space-y-1 border-t pt-3">
                      {continuity.progressReassurance && (
                        <p className="text-primary">{continuity.progressReassurance}</p>
                      )}
                      {continuity.completedItems.slice(0, 4).map((item) => (
                        <p key={item.summary} className="text-muted-foreground">
                          ✓ {item.summary}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </details>

              <details className="rounded-xl border bg-card px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  なぜこの案内が出ているか
                </summary>
                <div className="mt-3 space-y-3">
                  <p className="text-sm leading-relaxed">
                    {continuity.whyThisGuidance}
                  </p>
                  {continuity.relatedSupportNames.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        関連する支援
                      </p>
                      <ul className="mt-1 space-y-1">
                        {continuity.relatedSupportNames.map((name) => (
                          <li key={name} className="text-sm">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {continuity.hasExplanationSources &&
                    explanation.sources.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          出典
                        </p>
                        <ul className="mt-1 space-y-1">
                          {explanation.sources.map((s) => (
                            <li key={s.sourceUrl}>
                              <a
                                href={s.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary underline-offset-2 hover:underline"
                              >
                                {s.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </details>

              {procedureOverview.length > 0 && (
                <details className="rounded-xl border bg-card px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    進行中の手続き（{procedureOverview.length}件）
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {procedureOverview.map((item) => (
                      <li
                        key={item.name}
                        className={
                          item.isPrimary
                            ? "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
                            : "px-1 py-1"
                        }
                      >
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.statusLabel}
                          {item.hint ? ` · ${item.hint}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {acuteExternalLinks.length > 0 && (
                <details className="rounded-xl border bg-card px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    ライフライン・避難情報（外部）
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {acuteExternalLinks.map((link) => (
                      <li key={link.sourceUrl}>
                        <a
                          href={link.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-sm text-primary underline-offset-2 hover:underline"
                        >
                          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{link.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <details className="rounded-xl border border-destructive/20 bg-background px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  緊急のとき（119・110など）
                </summary>
                <div className="mt-3">
                  <EmergencyContacts compact />
                </div>
              </details>

              <details className="rounded-xl border bg-card px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  ほかに相談したいとき（任意）
                </summary>
                <div className="mt-3">
                  <Button asChild variant="outline" className="h-12 w-full">
                    <Link href="/chat">
                      <MessageCircle className="h-4 w-4" />
                      AI相談（任意）
                    </Link>
                  </Button>
                </div>
              </details>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-medium text-primary">あなたの状況</p>
            <p className="text-lg font-bold leading-snug">
              {formatCaseSituation(caseFile) !== "状況確認中"
                ? formatCaseSituation(caseFile)
                : "状況を整理しました"}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {progress.total > 0 && progress.completed >= progress.total
                ? "いま優先して確認する項目は一通り終えています。やること一覧で見返せます。"
                : "次に確認することは、やること一覧にまとめています。上から順に進めましょう。"}
            </p>
            <Button asChild size="lg" className="h-14 w-full text-lg">
              <Link href="/actions">
                やること一覧を見る
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full">
              <Link href="/start?redo=1">状況を選び直す</Link>
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

        <details className="rounded-xl border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            ほかに相談したいとき（任意）
          </summary>
          <div className="mt-3">
            <Button asChild variant="outline" className="h-12 w-full">
              <Link href="/chat">
                <MessageCircle className="h-4 w-4" />
                AI相談（任意）
              </Link>
            </Button>
          </div>
        </details>
      </div>
    );
  }

  if (nextAction) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-medium text-primary">
              次に一緒に確認すること
            </p>
            <p className="text-2xl font-bold leading-snug">{nextAction.title}</p>
            <p className="text-base text-muted-foreground">
              {nextAction.description}
            </p>
            <Button asChild size="lg" className="h-14 w-full text-lg">
              <Link href={getActionDetailPath(nextAction)}>一緒に確認する</Link>
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
    <div className="space-y-4 pb-2">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-medium text-primary">生活再建ナビ</p>
          <p className="text-xl font-bold leading-snug">
            次に確認することを、順番に案内します
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            はじめに、地域や被害の程度など短い質問に答えてください（登録不要・無料）。答えをもとに、あなた向けの「やること」を作ります。
          </p>
          <Button asChild size="lg" className="h-14 w-full text-lg">
            <Link href="/start">質問をはじめる</Link>
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
