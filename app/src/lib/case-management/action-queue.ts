/**
 * Action Queue 生成 — Knowledge Base トリガー → RW Action キュー
 */

import type { CaseProfile, CaseTrigger } from "@/lib/knowledge/types";
import { buildCaseWorkerKnowledgeContext } from "@/lib/knowledge";
import { derivePriorityJourney } from "@/lib/knowledge/priority-journey";
import {
  ACTION_TEMPLATES,
  isTemplateIncludedInPhase,
  templateToCaseAction,
} from "./action-templates";
import {
  createEvidence,
  getCompletionWorkerMessage,
  getEvidenceStatusForAction,
  getMissingEvidenceMessage,
  hasSubmittedEvidence,
  requiresEvidence,
  type Evidence,
  type EvidenceInput,
} from "./evidence";
import {
  generateProceduresForActions,
  getProcedureStatusMessage,
  getPrimaryProcedure,
  syncProcedureOnEvidenceSubmit,
  syncProceduresOnActionComplete,
} from "./procedures";
import {
  applyRecoveryPhaseTransition,
  createInitialRecoveryPhase,
  shouldTransitionToRecovery,
} from "./recovery-phase";
import {
  generateDeadlinesForProcedures,
  getPrimaryDeadlineDisplay,
  mergeDeadlinesIntoCaseFile,
  prioritizePendingActionsByDeadline,
  syncDeadlinesAfterProcedureChange,
} from "./deadlines";
import { syncDocumentRecords } from "./document-records";
import {
  maybeAppendDocumentGapDecision,
  prioritizePendingActionsByDocumentGap,
} from "./document-gap";
import { syncCaseTimeline } from "./case-timeline";
import {
  createPublicCaseId,
  createRecoveryCode,
  ensureCaseAccessCodes,
} from "./case-access";
import type {
  CaseAction,
  CaseDecision,
  CaseFile,
  CaseFileStatus,
  CompleteActionResult,
  FamilyAttributes,
  RecoveryPhase,
  RecoveryPhaseMode,
} from "./types";
import type { UserProfile } from "@/lib/types";

const PRIORITY_WEIGHT: Record<CaseAction["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const JOURNEY_ORDER = [
  "J-00",
  "J-01",
  "J-02",
  "J-03",
  "J-04",
  "J-05",
  "J-06",
] as const;

export function createCaseId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `case-${crypto.randomUUID()}`;
  }
  return `case-${Date.now()}`;
}

export function computeRiskScore(triggers: CaseTrigger[]): number {
  let score = 0;
  for (const t of triggers) {
    switch (t.priority) {
      case "critical":
        score += 30;
        break;
      case "high":
        score += 20;
        break;
      case "medium":
        score += 10;
        break;
      default:
        score += 5;
    }
  }
  return Math.min(100, score);
}

function sortActions(actions: CaseAction[]): CaseAction[] {
  return [...actions].sort((a, b) => {
    const orderA =
      ACTION_TEMPLATES.find((t) => t.id === a.id)?.sortOrder ?? 999;
    const orderB =
      ACTION_TEMPLATES.find((t) => t.id === b.id)?.sortOrder ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}

/** KB 評価結果から Action Queue を生成 */
export function generateActionQueue(
  caseProfile: CaseProfile,
  familyAttributes: FamilyAttributes,
  options?: { phaseMode?: RecoveryPhaseMode }
): {
  actions: CaseAction[];
  triggerIds: string[];
  activeJourney: import("@/lib/knowledge/types").JourneyId | null;
  riskScore: number;
} {
  const phaseMode = options?.phaseMode ?? "recovery";
  const { triggerEvaluation } = buildCaseWorkerKnowledgeContext(caseProfile);
  const triggers = triggerEvaluation.triggers;
  const triggerIds = triggers.map((t) => t.id);
  const triggerIdSet = new Set(triggerIds);

  const actions: CaseAction[] = [];

  for (const template of ACTION_TEMPLATES) {
    if (!isTemplateIncludedInPhase(template, phaseMode)) {
      continue;
    }

    const triggerMatch =
      template.sourceTriggerIds.length === 0
        ? false
        : template.sourceTriggerIds.some((id) => triggerIdSet.has(id));

    const conditionMatch = template.when
      ? template.when(caseProfile, triggerIdSet)
      : false;

    if (triggerMatch || conditionMatch) {
      actions.push(templateToCaseAction(template, triggerIds));
    }
  }

  const sorted = sortActions(actions);
  const activeJourney = derivePriorityJourney(triggers, caseProfile);
  const riskScore = computeRiskScore(triggers);

  return {
    actions: sorted,
    triggerIds,
    activeJourney,
    riskScore,
  };
}

export function buildInitialDecision(
  triggerIds: string[],
  action: CaseAction
): CaseDecision {
  return {
    timestamp: new Date().toISOString(),
    triggerIds,
    selectedActionId: action.id,
    selectedActionTitle: action.title,
    reason: action.reason,
    confidence:
      action.priority === "critical"
        ? "high"
        : action.priority === "high"
          ? "medium"
          : "low",
    evidenceStatus: requiresEvidence(action) ? "none" : "not_required",
    outcome: "selected",
  };
}

function buildCompletionDecision(
  triggerIds: string[],
  previousAction: CaseAction,
  nextAction: CaseAction | undefined,
  evidenceStatus: CaseDecision["evidenceStatus"],
  reason: string
): CaseDecision {
  return {
    timestamp: new Date().toISOString(),
    triggerIds,
    selectedActionId: nextAction?.id ?? previousAction.id,
    selectedActionTitle: nextAction?.title ?? previousAction.title,
    reason,
    confidence: "high",
    previousAction: { id: previousAction.id, title: previousAction.title },
    evidenceStatus,
    nextAction: nextAction
      ? { id: nextAction.id, title: nextAction.title }
      : undefined,
    outcome: "completed",
  };
}

function buildBlockedDecision(
  triggerIds: string[],
  action: CaseAction,
  reason: string
): CaseDecision {
  return {
    timestamp: new Date().toISOString(),
    triggerIds,
    selectedActionId: action.id,
    selectedActionTitle: action.title,
    reason,
    confidence: "high",
    previousAction: { id: action.id, title: action.title },
    evidenceStatus: "none",
    outcome: "blocked_missing_evidence",
  };
}

/** 証跡を Case File に追加（完了前） */
export function addEvidenceToCaseFile(
  caseFile: CaseFile,
  actionId: string,
  input: EvidenceInput
): CaseFile {
  const evidence = createEvidence(actionId, input);
  const now = new Date().toISOString();
  let updated: CaseFile = {
    ...caseFile,
    updatedAt: now,
    lastContactAt: now,
    evidences: [...(caseFile.evidences ?? []), evidence],
    workerMessage: input.procedureId
      ? "手続きの記録を保存しました。"
      : "記録を残しました。内容を確認したら「一緒に確認した」を押しましょう。",
  };

  if (input.procedureId) {
    const synced = syncProcedureOnEvidenceSubmit(updated, input.procedureId);
    const procedure = synced.find((p) => p.id === input.procedureId);
    updated = {
      ...updated,
      procedures: synced,
      workerMessage: procedure
        ? getProcedureStatusMessage(procedure, getCurrentAction(updated))
        : updated.workerMessage,
    };
  }

  return syncCaseTimeline(syncDocumentRecords(updated));
}

export function createCaseFile(
  caseProfile: CaseProfile,
  familyAttributes: FamilyAttributes,
  options?: {
    caseId?: string;
    existing?: CaseFile;
    recoveryPhase?: RecoveryPhase;
    userProfile?: UserProfile;
    /** 検証・後方互換: Acute モードで Queue 生成 */
    forcePhaseMode?: RecoveryPhaseMode;
  }
): CaseFile {
  const now = new Date().toISOString();
  const recoveryPhase =
    options?.recoveryPhase ??
    options?.existing?.recoveryPhase ??
    (options?.userProfile
      ? createInitialRecoveryPhase(options.userProfile, caseProfile, {
          forceMode: options.forcePhaseMode,
        })
      : createInitialRecoveryPhase({}, caseProfile, {
          forceMode: options?.forcePhaseMode,
        }));

  const phaseMode =
    options?.forcePhaseMode ?? recoveryPhase.mode;

  const { actions, triggerIds, activeJourney, riskScore } =
    generateActionQueue(caseProfile, familyAttributes, { phaseMode });

  const completedExisting = options?.existing?.completedActions ?? [];
  const completedIds = new Set(completedExisting.map((a) => a.id));
  const pendingActions = actions
    .filter((a) => !completedIds.has(a.id))
    .map((a) => ({ ...a, status: "todo" as const }));
  const decisions: CaseDecision[] = [];
  const procedures = generateProceduresForActions(actions);
  const deadlines = mergeDeadlinesIntoCaseFile(
    { ...options?.existing, procedures, deadlines: options?.existing?.deadlines } as CaseFile,
    generateDeadlinesForProcedures(procedures, caseProfile),
    caseProfile
  );

  if (pendingActions[0]) {
    decisions.push(buildInitialDecision(triggerIds, pendingActions[0]));
  }

  const existingAccess = options?.existing
    ? ensureCaseAccessCodes(options.existing)
    : {
        publicCaseId: createPublicCaseId(),
        recoveryCode: createRecoveryCode(),
      };

  return syncCaseTimeline(syncDocumentRecords({
    caseId: options?.caseId ?? options?.existing?.caseId ?? createCaseId(),
    publicCaseId: existingAccess.publicCaseId,
    recoveryCode: existingAccess.recoveryCode,
    createdAt: options?.existing?.createdAt ?? now,
    updatedAt: now,
    municipalityCode: caseProfile.municipalityCode,
    municipalityName: caseProfile.municipalityName,
    damageLevel: caseProfile.damageLevel,
    housingTenure: caseProfile.housingTenure,
    familyAttributes,
    activeJourney,
    pendingActions,
    completedActions: completedExisting,
    riskScore,
    lastContactAt: now,
    status: pendingActions.length > 0 ? "active" : "completed",
    decisions: [...(options?.existing?.decisions ?? []), ...decisions],
    evidences: options?.existing?.evidences ?? [],
    procedures: options?.existing?.procedures ?? procedures,
    recoveryPhase,
    deadlines,
    documentRecords: options?.existing?.documentRecords,
    workerMessage: options?.existing?.workerMessage,
  }));
}

/** フェーズ移行後に Action Queue を再生成（完了済み Action は保持） */
export function refreshActionQueueForPhase(
  caseFile: CaseFile,
  caseProfile: CaseProfile,
  phaseMode: RecoveryPhaseMode
): CaseFile {
  const { actions, triggerIds, activeJourney, riskScore } =
    generateActionQueue(caseProfile, caseFile.familyAttributes, { phaseMode });

  const completedIds = new Set(caseFile.completedActions.map((a) => a.id));
  const pendingActions = actions
    .filter((a) => !completedIds.has(a.id))
    .map((a) => ({ ...a, status: "todo" as const }));

  const decisions = [...caseFile.decisions];
  if (pendingActions[0]) {
    decisions.push(buildInitialDecision(triggerIds, pendingActions[0]));
  }

  const existingProcIds = new Set(
    (caseFile.procedures ?? []).map((p) => p.relatedProgramId)
  );
  const newProcedures = generateProceduresForActions(actions).filter(
    (p) => !existingProcIds.has(p.relatedProgramId)
  );
  const mergedProcedures = [...(caseFile.procedures ?? []), ...newProcedures];
  const deadlines = syncDeadlinesAfterProcedureChange(
    { ...caseFile, procedures: mergedProcedures, pendingActions },
    caseProfile
  );

  return syncCaseTimeline(syncDocumentRecords({
    ...caseFile,
    updatedAt: new Date().toISOString(),
    activeJourney,
    pendingActions,
    procedures: mergedProcedures,
    deadlines,
    riskScore,
    status: pendingActions.length > 0 ? "active" : caseFile.status,
    decisions,
  }));
}

export function getCurrentAction(caseFile: CaseFile): CaseAction | null {
  const afterDeadline = prioritizePendingActionsByDeadline(caseFile);
  const pending = prioritizePendingActionsByDocumentGap(
    caseFile,
    afterDeadline
  );
  return (
    pending.find((a) => a.status === "todo") ??
    pending.find((a) => a.status === "doing") ??
    null
  );
}

export function getCaseProgress(caseFile: CaseFile): {
  completed: number;
  total: number;
} {
  const total =
    caseFile.pendingActions.length + caseFile.completedActions.length;
  return {
    completed: caseFile.completedActions.length,
    total,
  };
}

function advanceJourney(
  current: CaseFile["activeJourney"],
  completedAction: CaseAction
): CaseFile["activeJourney"] {
  if (!current) return completedAction.journeyId;
  const currentIdx = JOURNEY_ORDER.indexOf(
    current as (typeof JOURNEY_ORDER)[number]
  );
  const completedIdx = JOURNEY_ORDER.indexOf(
    completedAction.journeyId as (typeof JOURNEY_ORDER)[number]
  );
  if (completedIdx > currentIdx) return completedAction.journeyId;
  return current;
}

function deriveCaseStatus(
  pending: CaseAction[],
  completed: CaseAction[],
  procedures?: import("./procedures").ExternalProcedure[]
): CaseFileStatus {
  if (pending.length === 0 && completed.length > 0) return "completed";
  if (
    procedures?.some(
      (p) => p.status === "submitted" || p.status === "waiting_response"
    )
  ) {
    return "waiting_external";
  }
  if (pending.some((a) => a.status === "doing")) return "waiting_external";
  return "active";
}

/** Action 完了 → Case File 更新 → 次 Action 選択（V2: 証跡検証付き） */
export function completeCaseAction(
  caseFile: CaseFile,
  actionId: string,
  triggerIds: string[],
  evidence?: EvidenceInput
): CompleteActionResult {
  const now = new Date().toISOString();
  const actionIndex = caseFile.pendingActions.findIndex((a) => a.id === actionId);
  if (actionIndex < 0) {
    return { caseFile, blocked: false };
  }

  const action = caseFile.pendingActions[actionIndex];
  let workingFile = caseFile;

  if (evidence) {
    workingFile = addEvidenceToCaseFile(workingFile, actionId, evidence);
  }

  if (requiresEvidence(action) && !hasSubmittedEvidence(workingFile, actionId)) {
    const message = getMissingEvidenceMessage(action);
    return {
      caseFile: syncCaseTimeline({
        ...workingFile,
        updatedAt: now,
        lastContactAt: now,
        workerMessage: message,
        decisions: [
          ...workingFile.decisions,
          buildBlockedDecision(triggerIds, action, message),
        ],
      }),
      blocked: true,
      workerMessage: message,
    };
  }

  const evidenceStatus = getEvidenceStatusForAction(workingFile, action);

  const [completed, ...restPending] = [
    {
      ...workingFile.pendingActions[actionIndex],
      status: "done" as const,
      completedAt: now,
    },
    ...workingFile.pendingActions.slice(0, actionIndex),
    ...workingFile.pendingActions.slice(actionIndex + 1),
  ];

  const completedActions = [...workingFile.completedActions, completed];
  const pendingActions = restPending.map((a) => ({
    ...a,
    status: "todo" as const,
  }));
  const activeJourney = advanceJourney(workingFile.activeJourney, completed);
  const nextAction = pendingActions[0] ?? null;

  const decisions = [
    ...workingFile.decisions,
    buildCompletionDecision(
      triggerIds,
      completed,
      nextAction ?? undefined,
      evidenceStatus,
      nextAction
        ? `${completed.title}完了後、${nextAction.title}が最優先です`
        : `${completed.title}を完了しました`
    ),
  ];

  if (nextAction) {
    decisions.push(buildInitialDecision(triggerIds, nextAction));
  }

  const procedures = syncProceduresOnActionComplete(
    workingFile,
    completed,
    nextAction
  );

  let resultFile: CaseFile = {
    ...workingFile,
    updatedAt: now,
    lastContactAt: now,
    activeJourney,
    pendingActions,
    completedActions,
    procedures,
    status: deriveCaseStatus(pendingActions, completedActions, procedures),
    decisions,
    workerMessage: (() => {
      const base = getCompletionWorkerMessage(completed, nextAction);
      const primary = getPrimaryProcedure(
        { ...workingFile, procedures },
        nextAction
      );
      if (primary && primary.status !== "not_started") {
        return getProcedureStatusMessage(primary, nextAction);
      }
      return base;
    })(),
  };

  resultFile = {
    ...resultFile,
    deadlines: syncDeadlinesAfterProcedureChange(resultFile, {
      municipalityCode: workingFile.municipalityCode,
      damageLevel: workingFile.damageLevel,
      housingTenure: workingFile.housingTenure,
    } as CaseProfile),
  };

  const urgentDeadline = getPrimaryDeadlineDisplay(resultFile);
  if (
    urgentDeadline &&
    (urgentDeadline.deadline.status === "due_soon" ||
      urgentDeadline.deadline.status === "overdue") &&
    resultFile.recoveryPhase?.mode === "recovery"
  ) {
    resultFile = {
      ...resultFile,
      workerMessage: `${urgentDeadline.deadline.label}: ${urgentDeadline.displayText}`,
    };
  }

  if (shouldTransitionToRecovery(resultFile, completed)) {
    resultFile = applyRecoveryPhaseTransition(
      resultFile,
      workingFile.municipalityCode
        ? ({
            municipalityCode: workingFile.municipalityCode,
            damageLevel: workingFile.damageLevel,
            housingTenure: workingFile.housingTenure,
          } as CaseProfile)
        : ({} as CaseProfile),
      workingFile.familyAttributes,
      completed
    );
    resultFile = refreshActionQueueForPhase(
      resultFile,
      {
        municipalityCode: workingFile.municipalityCode,
        municipalityName: workingFile.municipalityName,
        damageLevel: workingFile.damageLevel,
        housingTenure: workingFile.housingTenure,
      } as CaseProfile,
      "recovery"
    );
  }

  resultFile = syncDocumentRecords(resultFile);
  resultFile = maybeAppendDocumentGapDecision(resultFile, triggerIds);
  resultFile = syncCaseTimeline(resultFile);

  return {
    caseFile: resultFile,
    blocked: false,
    workerMessage: resultFile.workerMessage,
  };
}

/** 状況サマリー文字列（ホーム表示用） */
export function formatCaseSituation(caseFile: CaseFile): string {
  const parts: string[] = [];
  if (caseFile.municipalityName) parts.push(caseFile.municipalityName);
  if (caseFile.damageLevel) parts.push(caseFile.damageLevel);
  if (caseFile.familyAttributes.hasChildren) parts.push("子どもあり");
  const lifeline: string[] = [];
  void lifeline;
  return parts.join("・") || "状況確認中";
}

export function getTriggerIdsFromCaseFile(caseFile: CaseFile): string[] {
  const all = [
    ...caseFile.pendingActions,
    ...caseFile.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);
  return [...new Set(all)];
}

/** 被災者向け伴走理由（表示専用 · Action 生成ロジックは変更しない） */
const COMPANION_REASON_BY_ACTION: Record<string, string> = {
  "rw-j03-photo":
    "支援制度の申請に備えて、まず被害の記録を一緒に確認しましょう",
  "rw-j03-cert-prep":
    "支援制度を利用するために、まず被害の証明を確認しましょう",
  "rw-j04-insurance-report":
    "保険の手続きに備えて、被害の連絡を一緒に確認しましょう",
  "rw-j04-loan-relief":
    "住宅ローンの負担を減らせる制度がないか、一緒に確認しましょう",
  "rw-j04-life-rebuild":
    "利用できる生活再建支援について、一緒に確認しましょう",
  "rw-j04-tax-social":
    "税や社会保険の手続きについて、公式案内を一緒に確認しましょう",
  "rw-j05-emergency-repair":
    "雨の前に、屋根の応急・緊急修理（ブルーシート等）を一緒に確認しましょう",
  "rw-j04-programs":
    "お住まいの地域で使える支援と、生活再開の確認を一緒に進めましょう",
  "rw-j01-welfare-shelter":
    "ご家族の安全のため、避難の選択肢を一緒に確認しましょう",
  "rw-j01-family-safety":
    "まずご家族の安全を、一緒に確認しましょう",
  "rw-j02-water":
    "給水場所と、水道減免・電気ガスの安全確認を一緒に進めましょう",
  "rw-j02-water-station":
    "給水場所と、水道減免・電気ガスの安全確認を一緒に進めましょう",
  "rw-j02-water-children":
    "子ども世帯の水の確保と、学校・園の連絡も一緒に確認しましょう",
  "rw-j05-housing":
    "住まいの見直しについて、一緒に確認しましょう",
  "rw-j04-business-recovery":
    "店舗や事業所の状況について、一緒に確認しましょう",
  "rw-j06-business":
    "事業の再開について、一緒に確認しましょう",
};

/** 被災者向け Action 説明文（表示専用 · テンプレート description は変更しない） */
const COMPANION_DESCRIPTION_BY_ACTION: Record<string, string> = {
  "rw-j01-family-safety":
    "ご家族の安否と所在を、一緒に確認しましょう。",
  "rw-j01-welfare-shelter":
    "ご家族の安全のため、避難の選択肢を一緒に確認しましょう。",
  "rw-j02-water-station":
    "給水場所に加え、水道料金の減免と電気・ガスの安全確認も、一緒に進めましょう。",
  "rw-j02-water-children":
    "お子さんに必要な水の確保と、学校・園の連絡も一緒に確認しましょう。",
  "rw-j03-photo":
    "片付け・修理の前に、安全な場所から被害の記録を一緒に残しましょう。",
  "rw-j03-cert-prep":
    "罹災証明の申請に必要な書類を、一緒に確認しましょう。",
  "rw-j04-business-recovery":
    "店舗や事業所の状況と、事業者向け支援制度を一緒に確認しましょう。",
  "rw-j04-insurance-report":
    "加入している保険への被害連絡を、一緒に確認しましょう。",
  "rw-j04-loan-relief":
    "住宅ローンの返済猶予・減免制度について、一緒に確認しましょう。",
  "rw-j04-life-rebuild":
    "利用できる生活再建支援について、一緒に確認しましょう。",
  "rw-j04-tax-social":
    "税や社会保険の手続きについて、公式案内を一緒に確認しましょう。",
  "rw-j04-programs":
    "地域の支援と、仕事・学校・通院の再開確認を、一緒に整理しましょう。",
  "rw-j05-emergency-repair":
    "雨の前に、ブルーシート等の緊急修理と応急修理の案内を、一緒に確認しましょう。",
  "rw-j05-temp-housing":
    "住まいの見直しについて、一緒に確認しましょう。",
};

/** 検証用 — 伴走コピー辞書の全文字列 */
export function getCompanionCopyCatalog(): string[] {
  return [
    ...Object.values(COMPANION_REASON_BY_ACTION),
    ...Object.values(COMPANION_DESCRIPTION_BY_ACTION),
  ];
}

/** 被災者向け表示の命令調・制度判断トーンを伴走表現へ（表示専用） */
export function softenSurvivorDisplayText(text: string): string {
  return text
    .replace(/対象可否/g, "利用できるか")
    .replace(/判断してください/g, "一緒に整理しましょう")
    .replace(/判断が必要/g, "一緒に確認")
    .replace(/申請してください/g, "申請の流れを確認しましょう")
    .replace(/確認してください/g, "確認しましょう")
    .replace(/してください/g, "しましょう")
    .replace(/必要です/g, "大切です")
    .replace(/取得/g, "確認")
    .replace(/忘れずに/g, "あわせて")
    .replace(/自己判断/g, "無理に");
}

function softenReasonFallback(reason: string): string {
  return softenSurvivorDisplayText(reason);
}

export function formatActionCompanionDescription(action: CaseAction): string {
  const mapped = COMPANION_DESCRIPTION_BY_ACTION[action.id];
  if (mapped) return mapped;
  return softenSurvivorDisplayText(action.description);
}

/**
 * Action の優先理由を被災者向け伴走文言へ（表示専用）
 * 優先: 伴走マップ → Trigger.message → action.reason
 */
export function formatActionFriendlyReason(
  action: CaseAction,
  options?: { triggerMessage?: string }
): string {
  const mapped = COMPANION_REASON_BY_ACTION[action.id];
  if (mapped) return mapped;
  if (options?.triggerMessage) {
    return softenReasonFallback(options.triggerMessage);
  }
  return softenReasonFallback(action.reason);
}

/** 伴走カード見出し — 「やるべきこと」ではなく確認の提案 */
export function formatActionCompanionHeadline(
  action: CaseAction,
  friendlyReason: string
): string {
  const mapped = COMPANION_REASON_BY_ACTION[action.id];
  if (mapped) return mapped;
  if (friendlyReason.length <= 80) return friendlyReason;
  return action.title.replace(/する$/, "の確認").replace(/確認$/, "の確認");
}
