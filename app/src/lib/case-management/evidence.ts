/**
 * Real World Action V2 — 証跡（Evidence）
 * docs/08 V2 証拠添付 / docs/12 RealWorldEvidence
 */

import type { CaseAction, CaseFile } from "./types";

export type EvidenceType =
  | "photo"
  | "document"
  | "screenshot"
  | "location"
  | "text";

export type EvidenceStatus = "submitted" | "verified" | "rejected";

export type CompletionRule =
  | "SELF_CONFIRM"
  | "EVIDENCE_REQUIRED"
  | "DOCUMENT_REQUIRED";

export interface Evidence {
  id: string;
  actionId: string;
  /** V3: 外部手続きに紐づく証跡 */
  procedureId?: string;
  type: EvidenceType;
  createdAt: string;
  status: EvidenceStatus;
  metadata: Record<string, unknown>;
}

export type EvidenceInput = Omit<
  Evidence,
  "id" | "createdAt" | "status" | "actionId"
>;

export function createEvidenceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ev-${crypto.randomUUID()}`;
  }
  return `ev-${Date.now()}`;
}

export function createEvidence(
  actionId: string,
  input: EvidenceInput,
  status: EvidenceStatus = "submitted"
): Evidence {
  return {
    id: createEvidenceId(),
    actionId,
    procedureId: input.procedureId,
    type: input.type,
    createdAt: new Date().toISOString(),
    status,
    metadata: input.metadata,
  };
}

export function getEvidencesForProcedure(
  caseFile: CaseFile,
  procedureId: string
): Evidence[] {
  return (caseFile.evidences ?? []).filter((e) => e.procedureId === procedureId);
}

/** MVP: 写真 Action 用デフォルト証跡（ファイルアップロードなし） */
export function createDefaultPhotoEvidence(actionId: string): Evidence {
  return createEvidence(actionId, {
    type: "photo",
    metadata: {
      count: 8,
      description: "外観4方向・室内・被害箇所",
      source: "self_report_v2",
    },
  });
}

export function getEvidencesForAction(
  caseFile: CaseFile,
  actionId: string
): Evidence[] {
  return (caseFile.evidences ?? []).filter((e) => e.actionId === actionId);
}

export function hasSubmittedEvidence(
  caseFile: CaseFile,
  actionId: string
): boolean {
  return getEvidencesForAction(caseFile, actionId).some(
    (e) => e.status === "submitted" || e.status === "verified"
  );
}

export function requiresEvidence(action: CaseAction): boolean {
  return (
    action.completionRule === "EVIDENCE_REQUIRED" ||
    action.completionRule === "DOCUMENT_REQUIRED"
  );
}

export function getEvidenceStatusForAction(
  caseFile: CaseFile,
  action: CaseAction
): "none" | "submitted" | "verified" | "rejected" | "not_required" {
  if (!requiresEvidence(action)) return "not_required";
  const list = getEvidencesForAction(caseFile, action.id);
  if (list.some((e) => e.status === "verified")) return "verified";
  if (list.some((e) => e.status === "submitted")) return "submitted";
  if (list.some((e) => e.status === "rejected")) return "rejected";
  return "none";
}

export interface ActionCompletionUIState {
  completionRule: CompletionRule;
  needsEvidence: boolean;
  hasEvidence: boolean;
  canComplete: boolean;
  primaryButtonLabel: string;
  showEvidenceButton: boolean;
  evidenceHint?: string;
}

export function getActionCompletionUIState(
  caseFile: CaseFile,
  action: CaseAction
): ActionCompletionUIState {
  const rule = action.completionRule ?? "SELF_CONFIRM";
  const needsEvidence = requiresEvidence(action);
  const hasEvidence = hasSubmittedEvidence(caseFile, action.id);

  if (needsEvidence && !hasEvidence) {
    return {
      completionRule: rule,
      needsEvidence: true,
      hasEvidence: false,
      canComplete: false,
      primaryButtonLabel: "証拠を追加",
      showEvidenceButton: true,
      evidenceHint:
        "後の支援手続きのために、記録を一緒に残しましょう",
    };
  }

  if (needsEvidence && hasEvidence) {
    return {
      completionRule: rule,
      needsEvidence: true,
      hasEvidence: true,
      canComplete: true,
      primaryButtonLabel: "完了する",
      showEvidenceButton: false,
      evidenceHint: "記録が残せました。内容を確認したうえで、次に進めます。",
    };
  }

  return {
    completionRule: rule,
    needsEvidence: false,
    hasEvidence: false,
    canComplete: true,
    primaryButtonLabel: "完了する",
    showEvidenceButton: false,
  };
}

/** 証跡なしで完了しようとした場合のケースワーカーメッセージ */
export function getMissingEvidenceMessage(action: CaseAction): string {
  if (action.completionRule === "EVIDENCE_REQUIRED") {
    if (action.id === "rw-j03-photo") {
      return "写真は罹災証明や保険で大切です。先に記録を一緒に残しましょう";
    }
    return "後の支援手続きのために、記録を一緒に残しましょう";
  }
  if (action.completionRule === "DOCUMENT_REQUIRED") {
    return "必要書類の確認が終わってから、次に進みましょう";
  }
  return "完了条件を満たしていません";
}

/** 証跡付き完了後のケースワーカーメッセージ */
export function getCompletionWorkerMessage(
  completedAction: CaseAction,
  nextAction: CaseAction | null
): string {
  if (completedAction.id === "rw-j03-photo" && nextAction) {
    return `写真記録を保存しました。次は${nextAction.title}です`;
  }
  if (nextAction) {
    return `「${completedAction.title}」を完了しました。次は${nextAction.title}です`;
  }
  return `「${completedAction.title}」を完了しました`;
}

export function normalizeEvidences(raw: unknown): Evidence[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is Evidence =>
      !!e &&
      typeof e === "object" &&
      typeof (e as Evidence).id === "string" &&
      typeof (e as Evidence).actionId === "string"
  );
}
