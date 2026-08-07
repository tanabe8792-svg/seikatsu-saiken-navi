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
import { ProcedurePhaseRail, type ProcedurePhase } from "@/components/actions/procedure-phase-rail";
import { PrepNextDestination } from "@/components/actions/prep-next-destination";
import { WalkthroughStepRail } from "@/components/actions/walkthrough-step-rail";
import { useBottomChrome } from "@/providers/bottom-chrome-provider";

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
  const { viewportBottomOffset, navHeightPx } = useBottomChrome();
  const {
    session,
    loading,
    completeCaseAction,
    reopenCaseAction,
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

  const procedurePhases: ProcedurePhase[] = (() => {
    const phases: ProcedurePhase[] = [];

    if (isPhotoEvidenceAction) {
      const stepsStatus: ProcedurePhase["status"] = isDone
        ? "done"
        : stepsDone
          ? "done"
          : "current";
      phases.push({
        id: "steps",
        label: "手順",
        detail: `${stepProgress}/${guide.steps.length}`,
        status: stepsStatus,
        targetId: "walkthrough-steps",
      });
      const photoStatus: ProcedurePhase["status"] = isDone
        ? "done"
        : !stepsDone
          ? "upcoming"
          : ui.hasEvidence
            ? "done"
            : "current";
      phases.push({
        id: "photo",
        label: "撮影",
        status: photoStatus,
        targetId: "photo-evidence-capture",
      });
      phases.push({
        id: "done",
        label: "完了",
        status: isDone
          ? "done"
          : ui.hasEvidence && stepsDone
            ? "current"
            : "upcoming",
      });
      return phases;
    }

    const stepsStatus: ProcedurePhase["status"] = isDone
      ? "done"
      : stepsDone
        ? "done"
        : "current";
    phases.push({
      id: "steps",
      label: "手順",
      detail: `${stepProgress}/${guide.steps.length}`,
      status: stepsStatus,
      targetId: "walkthrough-steps",
    });

    if (prepItems.length > 0) {
      const prepStatus: ProcedurePhase["status"] = isDone
        ? "done"
        : !stepsDone
          ? "upcoming"
          : prepDone
            ? "done"
            : "current";
      phases.push({
        id: "prep",
        label: "準備",
        detail: `${prepProgress}/${prepItems.length}`,
        status: prepStatus,
        targetId: "prep-checklist",
      });
    }

    if (procedureGuidance) {
      const applyReady = stepsDone && prepDone;
      const applyStatus: ProcedurePhase["status"] = isDone
        ? "done"
        : !applyReady
          ? "upcoming"
          : "current";
      phases.push({
        id: "apply",
        label: "申請",
        status: applyStatus,
        targetId:
          prepItems.length > 0
            ? "prep-next-destination"
            : "procedure-guidance",
      });
    }

    phases.push({
      id: "done",
      label: "完了",
      status: isDone
        ? "done"
        : stepsDone && prepDone && evidenceReady
          ? "current"
          : "upcoming",
    });

    return phases;
  })();

  const currentPhase = procedurePhases.find((p) => p.status === "current");
  const currentPhaseHint = isDone
    ? "この手続きは、サイト上では完了しています"
    : currentPhase?.id === "steps"
      ? `いまは手順の確認（${stepProgress}/${guide.steps.length}）`
      : currentPhase?.id === "prep"
        ? `いまは準備物の確認（${prepProgress}/${prepItems.length}）`
        : currentPhase?.id === "photo"
          ? "いまは写真を撮って残す段階"
          : currentPhase?.id === "apply"
            ? "準備がそろいました。次は申請・連絡先へ"
            : currentPhase?.id === "done"
              ? "そろったら、下の完了ボタンを押せます"
              : "この手続きの進み方";

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
                <div className="flex justify-center py-0.5 text-muted-foreground">
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </div>
              )}
              <div
                className={`rounded-2xl border-2 px-3 py-3 transition-colors ${
                  done
                    ? "border-brand-green bg-emerald-100 dark:border-brand-green dark:bg-emerald-950/50"
                    : isCurrent && emphasize
                      ? "border-brand-green bg-card ring-2 ring-brand-green/30"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3 px-1">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold ${
                      done
                        ? "border-brand-green bg-brand-green text-white"
                        : "border-border bg-background text-foreground"
                    }`}
                    aria-hidden
                  >
                    {done ? "✓" : numberFrom + index}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-base font-semibold leading-snug">
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 px-1">
                  {!done ? (
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-brand-green bg-brand-green px-3 py-2 text-sm font-semibold text-white active:scale-[0.99]"
                    >
                      確認した
                    </button>
                  ) : (
                    <>
                      <span className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-brand-green bg-brand-green/15 px-3 py-2 text-sm font-semibold text-brand-green">
                        確認済み
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStep(step.id)}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium text-foreground active:scale-[0.99]"
                      >
                        まだ見ていない（戻す）
                      </button>
                    </>
                  )}
                </div>

                <div
                  className="mt-3 space-y-2 border-t pt-3 px-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {step.memoLabel ?? "メモ"}
                  </p>
                  {step.memoChoices && step.memoChoices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.memoChoices.map((choice) => {
                        const selected = (memos[step.id] ?? "")
                          .split("／")
                          .map((p) => p.trim())
                          .includes(choice);
                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={locked}
                            onClick={() => addMemoChoice(step.id, choice)}
                            className={`rounded-full border px-3 py-1.5 text-xs disabled:opacity-50 ${
                              selected
                                ? "border-brand-green/60 bg-emerald-50 text-brand-green dark:bg-emerald-950/40"
                                : "border-border bg-background hover:bg-accent/50"
                            }`}
                          >
                            {selected ? `✓ ${choice}` : choice}
                          </button>
                        );
                      })}
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

  function handleReopen() {
    reopenCaseAction(action!.id);
    showToast(`「${guide.plainTitle}」の完了を取り消しました`);
  }

  const currentStepNumber = stepsDone
    ? guide.steps.length
    : Math.min(stepProgress + 1, guide.steps.length);

  return (
    <div className={`space-y-4 ${isDone ? "pb-8" : "pb-28"}`}>
      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isDone
              ? "確認できた手順"
              : browsingAhead
                ? "あとで確認する手順"
                : "いま進める手順"}
          </p>
          <h2 className="text-2xl font-bold leading-snug">{guide.plainTitle}</h2>
          {isDone && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                このサイトでは完了にしています。窓口への申請がまだなら取り消せます。
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9"
                onClick={handleReopen}
              >
                完了を取り消す
              </Button>
            </div>
          )}
          {browsingAhead && recommended && (
            <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-950 dark:text-amber-50">
                いま優先は「{recommendedTitle}」です
              </p>
              <Button asChild size="sm" className="h-9 w-full">
                <Link href={getCaseActionDetailPath(recommended.id)}>
                  「{recommendedTitle}」へ戻る
                </Link>
              </Button>
            </div>
          )}
          <ProcedurePhaseRail
            phases={procedurePhases}
            currentHint={currentPhaseHint}
          />
          <p className="text-xs text-muted-foreground">
            全体 {overall.completed}/{overall.total}
            {profile.municipality
              ? ` · ${
                  actionId === "rw-j04-business-recovery"
                    ? `店舗: ${resolveBusinessMunicipalityName(profile)}`
                    : `地域: ${resolveHomeMunicipalityName(profile)}`
                }`
              : ""}
          </p>
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
        <Card id="procedure-guidance" className="border-border bg-card">
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

      <Card id="walkthrough-steps">
        <CardContent className="space-y-3 p-4">
          <h3 className="text-base font-semibold">
            {isPhotoEvidenceAction ? "まず手順を確認する" : "手順（ひとつずつ）"}
          </h3>
          <WalkthroughStepRail
            total={guide.steps.length}
            completedCount={stepProgress}
            currentNumber={currentStepNumber}
          />
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
          {stepsDone || isDone ? (
            <PhotoEvidenceCapture
              caseId={caseFile.caseId}
              actionId={actionId}
              onSubmitEvidence={handlePhotoEvidence}
              alreadyHasEvidence={ui.hasEvidence}
              stepNumber={guide.steps.length + 1}
            />
          ) : (
            <Card
              id="photo-evidence-capture"
              className="border border-dashed border-border bg-muted/20"
            >
              <CardContent className="space-y-2 p-5">
                <h3 className="text-base font-semibold">カメラで撮って残す</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  上の手順にチェックを付けると、ここで撮影できます。先に手順を読んでから撮ってください。
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {prepItems.length > 0 && (
        <Card
          id="prep-checklist"
          className="border-amber-200/70 dark:border-amber-900/40"
        >
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
            {procedureGuidance && !isPhotoEvidenceAction && !isDone && (
              <PrepNextDestination guidance={procedureGuidance} />
            )}
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
              <p className="text-xs leading-relaxed text-muted-foreground">
                申請後のメモ用です。窓口から案内があれば、その指示に従ってください。
              </p>
            )}
            {!isDone && (
              <p className="text-xs text-muted-foreground">
                {isPhotoEvidenceAction
                  ? "雨のあとなど、あとから様子を見返すときのメモです。この項目の完了には必須ではありません。"
                  : "申請が終わったあとも、ここでチェックとメモができます。下の完了ボタンの条件には入りません。"}
              </p>
            )}
            {renderStepList(followUpSteps, {
              locked: false,
              numberFrom: 1,
            })}
          </CardContent>
        </Card>
      )}

      {!isPhotoEvidenceAction && !isDone && (
      <Card>
        <CardContent className="space-y-4 p-4">
          <h3 className="text-base font-semibold">状況の整理</h3>
          <p className="text-xs text-muted-foreground">
            いまの進み具合と、手続きの記録です。
          </p>

          <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
            <p className="text-xs font-medium text-primary">あなたの進み具合</p>
            <p className="text-sm font-semibold">
              {`手順 ${stepProgress}/${guide.steps.length} までチェック済み`}
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

      {!isDone && (
        <div
          className="fixed left-0 right-0 z-40 border-t border-border bg-background p-2"
          style={{
            bottom: `calc(${viewportBottomOffset + navHeightPx}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <div className="mx-auto flex max-w-lg flex-col gap-1.5">
            {ui.showEvidenceButton &&
              !ui.hasEvidence &&
              !isPhotoEvidenceAction && (
                <Button
                  size="lg"
                  className="h-12 w-full text-base"
                  onClick={handleEvidence}
                >
                  <Camera className="h-5 w-5" />
                  記録を残す
                </Button>
              )}
            {isPhotoEvidenceAction && !ui.hasEvidence && (
              <Button
                size="lg"
                className="h-12 w-full text-base"
                onClick={() => {
                  if (!stepsDone) {
                    document
                      .getElementById("walkthrough-steps")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  document
                    .getElementById("photo-evidence-capture")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <Camera className="h-5 w-5" />
                {stepsDone ? "カメラへ進む" : "まず手順を確認する"}
              </Button>
            )}
            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={!canFinishProcedure}
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-5 w-5" />
              「{guide.plainTitle}」を完了する
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
