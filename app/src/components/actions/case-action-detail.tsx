"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildActionDecisionExplanation,
  buildSurvivorFriendlyExplanation,
} from "@/lib/case-management/decision-explanation";
import {
  areAllWalkthroughStepsDone,
  appendWalkthroughMemoChoice,
  getActionWalkthrough,
  getCompletedWalkthroughSteps,
  getWalkthroughStepMemo,
  setLocalPrepComplete,
  setWalkthroughStepComplete,
  setWalkthroughStepMemo,
} from "@/lib/case-management/action-walkthrough";
import { getProcedureGuidanceForAction } from "@/lib/case-management/procedure-guidance";
import {
  areResolvedPrepItemsDone,
  resolvePrepChecklist,
} from "@/lib/case-management/walkthrough-prep";
import { syncDocumentRecords } from "@/lib/case-management/document-records";
import { getActionCompletionUIState } from "@/lib/case-management/evidence";
import {
  getCaseProgress,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import {
  getPrimaryProcedure,
  getProcedureStatusLabel,
  getProcedureStatusPlainExplanation,
} from "@/lib/case-management/procedures";
import type { CaseAction } from "@/lib/case-management/types";
import { getCaseActionDetailPath } from "@/lib/navigation";
import { useUserSession } from "@/hooks/use-user-session";
import { useToast } from "@/providers/toast-provider";
import { Textarea } from "@/components/ui/textarea";
import { ProcedureContactAssist } from "@/components/actions/procedure-contact-assist";
import { BusinessMunicipalityPicker } from "@/components/actions/business-municipality-picker";
import { HomeMunicipalityPicker } from "@/components/actions/home-municipality-picker";
import type { EvidenceInput } from "@/lib/case-management/evidence";
import {
  resolveBusinessMunicipalityName,
  resolveHomeMunicipalityName,
} from "@/lib/case-management/municipality-context";
import { SourceFreshnessNote } from "@/components/common/source-freshness-note";
import { PhotoEvidenceCapture } from "@/components/actions/photo-evidence-capture";

interface CaseActionDetailProps {
  actionId: string;
}

function findAction(
  pending: CaseAction[],
  completed: CaseAction[],
  actionId: string
): CaseAction | undefined {
  return (
    pending.find((a) => a.id === actionId) ??
    completed.find((a) => a.id === actionId)
  );
}

export function CaseActionDetail({ actionId }: CaseActionDetailProps) {
  const { showToast } = useToast();
  const {
    session,
    loading,
    completeCaseAction,
    submitActionEvidence,
    markDocumentPrepared,
    updateProfile,
  } = useUserSession();
  const { caseFile, profile } = session;
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [prepTick, setPrepTick] = useState(0);
  const [memos, setMemos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!caseFile) return;
    setCompletedSteps(getCompletedWalkthroughSteps(caseFile.caseId, actionId));
    const next: Record<string, string> = {};
    const guideNow = getActionWalkthrough(actionId, "確認");
    for (const step of [
      ...guideNow.steps,
      ...(guideNow.followUpSteps ?? []),
    ]) {
      next[step.id] = getWalkthroughStepMemo(
        caseFile.caseId,
        actionId,
        step.id
      );
    }
    setMemos(next);
  }, [caseFile?.caseId, actionId]);

  const action = caseFile
    ? findAction(caseFile.pendingActions, caseFile.completedActions, actionId)
    : undefined;

  const guide = useMemo(
    () => getActionWalkthrough(actionId, action?.title ?? "確認"),
    [actionId, action?.title]
  );

  const workingCaseFile = useMemo(() => {
    if (!caseFile) return null;
    return syncDocumentRecords(caseFile);
  }, [caseFile, prepTick]);

  const programIds = useMemo(() => {
    if (!action) return [] as string[];
    return action.relatedProgramIds ?? [];
  }, [action]);

  const prepItems = useMemo(() => {
    if (!workingCaseFile) return [];
    return resolvePrepChecklist(workingCaseFile, guide, programIds);
    // prepTick forces re-resolve after local prep toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingCaseFile, guide, programIds, prepTick, completedSteps]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseFile || !workingCaseFile) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-center text-muted-foreground">
          まだ状況の整理が完了していません。
        </p>
        <Button asChild size="lg" className="h-14 w-full">
          <Link href="/start">はじめる</Link>
        </Button>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-center text-muted-foreground">
          この項目は見つかりませんでした。
        </p>
        <Button asChild size="lg" className="h-14 w-full">
          <Link href="/actions">やること一覧へ</Link>
        </Button>
      </div>
    );
  }

  const isDone = action.status === "done";
  const ui = getActionCompletionUIState(workingCaseFile, action);
  const explanation = buildActionDecisionExplanation(
    workingCaseFile,
    action,
    profile
  );
  const survivorExplanation = buildSurvivorFriendlyExplanation(explanation);
  const procedure = getPrimaryProcedure(workingCaseFile, action);
  const recommended = getCurrentAction(workingCaseFile);
  const procedureGuidance = getProcedureGuidanceForAction(actionId, profile);
  const overall = getCaseProgress(workingCaseFile);

  const stepsDone = areAllWalkthroughStepsDone(guide, completedSteps);
  const prepDone = areResolvedPrepItemsDone(prepItems);
  const evidenceReady = !ui.showEvidenceButton || ui.hasEvidence;
  const canFinishProcedure =
    !isDone && ui.canComplete && stepsDone && prepDone && evidenceReady;
  const browsingAhead =
    !isDone && recommended != null && recommended.id !== action.id;
  const isPhotoEvidenceAction = actionId === "rw-j03-photo";
  const recommendedTitle = recommended
    ? getActionWalkthrough(recommended.id, recommended.title).plainTitle
    : "";

  const stepProgress = guide.steps.filter((s) =>
    completedSteps.includes(s.id)
  ).length;
  const followUpSteps = guide.followUpSteps ?? [];
  const followUpProgress = followUpSteps.filter((s) =>
    completedSteps.includes(s.id)
  ).length;
  const prepProgress = prepItems.filter((p) => p.done).length;

  function renderStepList(
    steps: typeof guide.steps,
    options: { locked: boolean; numberFrom?: number; emphasize?: boolean }
  ) {
    const { locked, numberFrom = 1, emphasize = false } = options;
    return (
      <ul className="space-y-0">
        {steps.map((step, index) => {
          const done = completedSteps.includes(step.id);
          const isCurrent =
            !done &&
            steps.slice(0, index).every((s) => completedSteps.includes(s.id));
          return (
            <li key={step.id}>
              {index > 0 && (
                <div className="flex justify-center py-1.5 text-muted-foreground">
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </div>
              )}
              <div
                className={`rounded-2xl border-2 px-4 py-4 transition-colors ${
                  done
                    ? "border-brand-green/50 bg-emerald-50/80 dark:border-brand-green/40 dark:bg-emerald-950/30"
                    : isCurrent && emphasize
                      ? "border-brand-green bg-card ring-2 ring-brand-green/25"
                      : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => toggleStep(step.id)}
                  className={`w-full text-left ${locked ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-brand-green text-white"
                          : isCurrent
                            ? "bg-muted text-foreground"
                            : "bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : numberFrom + index}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-base font-semibold">{step.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                      {!locked && (
                        <p
                          className={`pt-1 text-sm font-medium ${
                            done ? "text-brand-green" : "text-primary"
                          }`}
                        >
                          {done ? "確認済み（タップで戻せる）" : "読んだらタップしてチェック"}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className="mt-3 space-y-2 border-t pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {step.memoLabel ?? "メモ"}
                  </p>
                  {step.memoChoices && step.memoChoices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.memoChoices.map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          disabled={locked}
                          onClick={() => addMemoChoice(step.id, choice)}
                          className="rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-accent/50 disabled:opacity-50"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={memos[step.id] ?? ""}
                    disabled={locked}
                    placeholder={step.memoPlaceholder ?? "メモを残せます"}
                    className="min-h-[88px] text-sm"
                    onChange={(e) => updateMemo(step.id, e.target.value)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  function toggleStep(stepId: string) {
    const next = setWalkthroughStepComplete(
      caseFile!.caseId,
      actionId,
      stepId,
      !completedSteps.includes(stepId)
    );
    setCompletedSteps(next);
  }

  function updateMemo(stepId: string, value: string) {
    setWalkthroughStepMemo(caseFile!.caseId, actionId, stepId, value);
    setMemos((prev) => ({ ...prev, [stepId]: value }));
  }

  function addMemoChoice(stepId: string, choice: string) {
    const next = appendWalkthroughMemoChoice(
      caseFile!.caseId,
      actionId,
      stepId,
      choice
    );
    setMemos((prev) => ({ ...prev, [stepId]: next }));
  }

  function togglePrep(item: (typeof prepItems)[number]) {
    if (item.requirementId) {
      markDocumentPrepared(item.requirementId, !item.done);
      setPrepTick((n) => n + 1);
      return;
    }
    setLocalPrepComplete(caseFile!.caseId, actionId, item.key, !item.done);
    setCompletedSteps(
      getCompletedWalkthroughSteps(caseFile!.caseId, actionId)
    );
    setPrepTick((n) => n + 1);
  }

  function handleEvidence() {
    submitActionEvidence(action!.id);
    showToast("記録を残しました");
  }

  function handlePhotoEvidence(id: string, evidence: EvidenceInput) {
    submitActionEvidence(id, evidence);
  }

  function handleComplete() {
    if (!canFinishProcedure) return;
    completeCaseAction(action!.id);
    showToast(`「${guide.plainTitle}」を完了しました`);
    // 次の項目へ自動では進まない。完了の区切りを見せて休めるようにする。
  }

  return (
    <div className="space-y-4 pb-40">
      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-medium text-muted-foreground">
            {isDone
              ? "確認できた手順"
              : browsingAhead
                ? "あとで確認する手順"
                : "いま進める手順"}
          </p>
          <h2 className="text-2xl font-bold leading-snug">{guide.plainTitle}</h2>
          {isDone && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              「{guide.plainTitle}」は完了しています。実際の申請や手続きは、それぞれの窓口・公式の案内に沿って進めてください。ここは見返し用に残せます。
            </p>
          )}
          {browsingAhead && recommended && (
            <div className="space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-950 dark:text-amber-50">
                いま優先して進めていただきたいのは「{recommendedTitle}」です
              </p>
              <p className="text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                このページは、少しあとで確認していただいても大丈夫です。先に読み終えたあとは、やること一覧から「{recommendedTitle}」へお戻りください。
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="sm" className="h-10 flex-1">
                  <Link href={getCaseActionDetailPath(recommended.id)}>
                    「{recommendedTitle}」へ戻る
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-10 flex-1">
                  <Link href="/actions">やること一覧を見る</Link>
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            全体の進み具合（上のバー）と、下の手順チェックは別物です。チェックは「このページで確認したメモ」、バーは生活再建全体の続きです。
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              全体 {overall.completed}/{overall.total}
            </span>
            <span>
              この手順 {stepProgress}/{guide.steps.length}
            </span>
            {prepItems.length > 0 && (
              <span>
                準備物 {prepProgress}/{prepItems.length}
              </span>
            )}
            {followUpSteps.length > 0 && (
              <span>
                申請後 {followUpProgress}/{followUpSteps.length}
              </span>
            )}
            {profile.municipality && (
              <span>
                {actionId === "rw-j04-business-recovery"
                  ? `店舗: ${resolveBusinessMunicipalityName(profile)}`
                  : `地域: ${resolveHomeMunicipalityName(profile)}`}
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width:
                  overall.total > 0
                    ? `${(overall.completed / overall.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-base font-semibold">これは何のための手続き？</h3>
          <p className="text-sm leading-relaxed">{guide.explanation}</p>
          {guide.safetyCaution && (
            <div
              role="note"
              className="rounded-lg border border-amber-300/80 bg-amber-50/80 px-3 py-3 dark:border-amber-800 dark:bg-amber-950/40"
            >
              <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                安全のお願い
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                {guide.safetyCaution}
              </p>
            </div>
          )}
          <div className="rounded-lg border bg-muted/30 px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              なぜ今やるか
            </p>
            <p className="mt-1 text-sm leading-relaxed">{guide.whyNow}</p>
          </div>
          {survivorExplanation.whyThisGuidance && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {survivorExplanation.whyThisGuidance}
            </p>
          )}
        </CardContent>
      </Card>

      {actionId === "rw-j04-business-recovery" && (
        <BusinessMunicipalityPicker
          profile={profile}
          onChange={(businessMunicipality) =>
            updateProfile({ businessMunicipality })
          }
        />
      )}

      {actionId === "rw-j03-cert-prep" && (
        <HomeMunicipalityPicker
          profile={profile}
          onChange={(municipality) => updateProfile({ municipality })}
        />
      )}

      {procedureGuidance && !isPhotoEvidenceAction && (
        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-base font-semibold">
              {procedureGuidance.title}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {procedureGuidance.intro}
            </p>
            {procedureGuidance.summary && (
              <p className="text-sm leading-relaxed">
                {procedureGuidance.summary}
              </p>
            )}
            {procedureGuidance.facts.length > 0 && (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {procedureGuidance.facts.map((fact) => (
                  <li key={fact.label}>
                    <span className="font-medium text-foreground">
                      {fact.label}:
                    </span>{" "}
                    {fact.value}
                  </li>
                ))}
              </ul>
            )}

            {procedureGuidance.contactAssist && (
              <ProcedureContactAssist
                plan={procedureGuidance.contactAssist}
                profile={profile}
              />
            )}

            {procedureGuidance.links.length > 0 &&
              (procedureGuidance.contactAssist ? (
                <details className="rounded-lg border bg-background/60 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    公式ページ（必要なときだけ開く）
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    {procedureGuidance.links.map((link) => (
                      <Button
                        key={link.href + link.label}
                        asChild
                        size="lg"
                        variant={link.primary ? "default" : "outline"}
                        className="h-11 w-full justify-between text-sm"
                      >
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="truncate text-left">
                            {link.label}
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="flex flex-col gap-2">
                  {procedureGuidance.links.map((link) => (
                    <Button
                      key={link.href + link.label}
                      asChild
                      size="lg"
                      variant={link.primary ? "default" : "outline"}
                      className="h-12 w-full justify-between text-base"
                    >
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="truncate text-left">{link.label}</span>
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                    </Button>
                  ))}
                </div>
              ))}

            <SourceFreshnessNote
              updatedAt={procedureGuidance.sourceUpdatedAt}
              label="公式情報の内容時点"
              showOpenedToday
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-base font-semibold">
            {isPhotoEvidenceAction ? "まず手順を確認する" : "手順（ひとつずつ）"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isPhotoEvidenceAction
              ? "上から順に読んでチェックすると、次の撮影に進めます。色が変わったら確認済みです。"
              : "できたものにチェック。分かったこと・予定はメモに残せます。"}
          </p>
          {renderStepList(guide.steps, {
            locked: isDone,
            emphasize: isPhotoEvidenceAction,
          })}
        </CardContent>
      </Card>

      {isPhotoEvidenceAction && caseFile && (
        <>
          <div className="flex justify-center text-muted-foreground">
            <ChevronDown className="h-6 w-6" aria-hidden />
          </div>
          <PhotoEvidenceCapture
            caseId={caseFile.caseId}
            actionId={actionId}
            onSubmitEvidence={handlePhotoEvidence}
            alreadyHasEvidence={ui.hasEvidence}
            stepNumber={guide.steps.length + 1}
          />
        </>
      )}

      {prepItems.length > 0 && (
        <Card className="border-amber-200/70 dark:border-amber-900/40">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-base font-semibold">準備物</h3>
            <p className="text-xs text-muted-foreground">
              用意できたらチェック。そろったら下の「{guide.plainTitle}を完了する」を押せます。
            </p>
            <ul className="space-y-3">
              {prepItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    disabled={isDone}
                    onClick={() => togglePrep(item)}
                    className={`w-full rounded-xl border px-4 py-3 text-left ${
                      item.done
                        ? "border-amber-300/80 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {item.done ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                      ) : (
                        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold">
                          {item.label}
                          {item.optional ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              （任意）
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.howTo}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {followUpSteps.length > 0 && (
        <Card className="border-sky-200/80 dark:border-sky-900/40">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold">
                {isPhotoEvidenceAction
                  ? "あとからの追加確認（任意）"
                  : "申請後の進み具合"}
              </h3>
              <span className="text-xs text-muted-foreground">
                {followUpProgress}/{followUpSteps.length}
              </span>
            </div>
            {!isPhotoEvidenceAction && isDone && (
              <div className="rounded-xl border border-sky-300/80 bg-sky-50 px-3 py-3 dark:border-sky-800 dark:bg-sky-950/30">
                <p className="text-sm font-semibold text-sky-950 dark:text-sky-50">
                  いまは「結果の連絡待ち」です
                </p>
                <p className="mt-1 text-xs leading-relaxed text-sky-900/90 dark:text-sky-100/90">
                  申請は記録済みです。下で「調査の案内が届いたか」「まだ待ち中か」を残せます。窓口から指示があれば、その案内に従ってください。
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isPhotoEvidenceAction
                ? "雨のあとなど、あとから様子を見返すときのメモです。この項目の完了には必須ではありません。"
                : "申請が終わったあとも、ここでチェックとメモができます。下の完了ボタンの条件には入りません。"}
            </p>
            {renderStepList(followUpSteps, {
              locked: false,
              numberFrom: 1,
            })}
          </CardContent>
        </Card>
      )}

      {!isPhotoEvidenceAction && (
      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-base font-semibold">状況の整理</h3>
          <p className="text-xs text-muted-foreground">
            いまの進み具合と、手続きの記録です。
          </p>

          <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-primary">あなたの進み具合</p>
            <p className="text-sm font-semibold">
              {isDone
                ? `「${guide.plainTitle}」は完了しています`
                : `手順 ${stepProgress}/${guide.steps.length} までチェック済み`}
            </p>
            {prepItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                準備物 {prepProgress}/{prepItems.length}
              </p>
            )}
            {followUpSteps.length > 0 && (
              <p className="text-xs text-muted-foreground">
                申請後の進み具合 {followUpProgress}/{followUpSteps.length}
                （任意）
              </p>
            )}
          </div>

          {procedure && (
            <div className="rounded-xl border px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                手続きの記録
              </p>
              <p className="text-sm font-semibold">{procedure.name}</p>
              <p className="text-sm">
                {getProcedureStatusLabel(procedure.status)}
                {procedure.organization ? ` · ${procedure.organization}` : ""}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {getProcedureStatusPlainExplanation(procedure.status)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardContent className="space-y-2 p-5">
          <h3 className="text-base font-semibold">この手順のあと</h3>
          <p className="text-sm leading-relaxed">{guide.afterThis}</p>
          {guide.tip && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
              ヒント: {guide.tip}
            </p>
          )}
        </CardContent>
      </Card>

      {explanation.sources.length > 0 && (
        <details className="rounded-xl border bg-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            公式情報（参考）
          </summary>
          <ul className="mt-3 space-y-3">
            {explanation.sources.map((source) => (
              <li key={source.sourceUrl} className="space-y-1">
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
                >
                  {source.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <SourceFreshnessNote
                  updatedAt={source.updatedAt}
                  label="公開情報の時点"
                  compact
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            上記は参考リンクです。進み方は、できるだけページ上部の「申請案内」から直接開いてください。古く感じる場合は公式ページで最新をご確認ください。
          </p>
        </details>
      )}

      {!isDone && (!stepsDone || !prepDone || !evidenceReady) && (
        <p className="px-1 text-sm leading-relaxed text-muted-foreground">
          {!evidenceReady
            ? isPhotoEvidenceAction
              ? "写真を残したら、下の完了ボタンでこの項目を終えられます。写真は何度でも追加できます。"
              : "先に「記録を残す」を押してください。"
            : !stepsDone
              ? "手順のチェックが残っています。"
              : "準備物のチェックが残っています。"}
        </p>
      )}

      <div
        className={`fixed bottom-14 left-0 right-0 z-40 border-t p-3 safe-bottom transition-colors ${
          isDone
            ? "border-emerald-200/80 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/40"
            : "border-border bg-background"
        }`}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {!isDone &&
            ui.showEvidenceButton &&
            !ui.hasEvidence &&
            !isPhotoEvidenceAction && (
            <Button size="lg" className="h-14 w-full text-lg" onClick={handleEvidence}>
              <Camera className="h-5 w-5" />
              記録を残す
            </Button>
          )}
          {!isDone && isPhotoEvidenceAction && !ui.hasEvidence && (
            <Button
              size="lg"
              className="h-14 w-full text-lg"
              onClick={() =>
                document
                  .getElementById("photo-evidence-capture")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              <Camera className="h-5 w-5" />
              {stepsDone ? "カメラで撮る" : "手順を見たあと、カメラへ進む"}
            </Button>
          )}
          {!isDone && (
            <Button
              size="lg"
              className="h-14 w-full text-lg"
              disabled={!canFinishProcedure}
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-5 w-5" />
              「{guide.plainTitle}」を完了する
            </Button>
          )}
          {isDone && (
            <>
              <p className="text-center text-sm font-medium text-emerald-900 dark:text-emerald-100">
                「{guide.plainTitle}」は完了しています
              </p>
              <Button asChild variant="outline" size="lg" className="h-12 w-full bg-background">
                <Link href="/actions">やること一覧へ戻る</Link>
              </Button>
            </>
          )}
          {!isDone && (
            <Button asChild variant="ghost" size="lg" className="h-11 w-full text-muted-foreground">
              <Link href="/actions">やること一覧</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
