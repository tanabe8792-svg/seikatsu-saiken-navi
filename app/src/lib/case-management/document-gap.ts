/**
 * Document Gap — 次に準備するもの（被災者向け文言）
 * docs/17 DocumentManagement
 */

import { getSupportProgramById } from "@/lib/knowledge/support-programs";
import type { CaseAction, CaseDecision, CaseFile } from "./types";
import { getPrimaryProcedure } from "./procedures";
import {
  getRequirementsForProgram,
  type DocumentRequirement,
} from "./document-requirements";
import {
  getDocumentRecordsForProgram,
  type DocumentRecord,
} from "./document-records";

export interface NextPreparationItem {
  requirementId: string;
  programId: string;
  programName: string;
  message: string;
  /** 表示用の短い準備項目名（複数項目をまとめるときに使用） */
  prepLabel: string;
  suggestedActionId?: string;
  recordStatus: DocumentRecord["status"];
}

export interface RebuildStatusDashboard {
  focusProcedureName?: string;
  progressSummary?: string;
  prepared: string[];
  nextPreparation: NextPreparationItem[];
}

const NEEDS_PREP = new Set<DocumentRecord["status"]>(["missing", "preparing"]);

function prepLabelForRequirement(req: DocumentRequirement): string {
  switch (req.category) {
    case "photo":
      return "被害状況の記録";
    case "disaster_certificate":
      return "罹災証明";
    case "identity_document":
      return "本人確認書類";
    case "income_proof":
      return "所得証明";
    case "bank_account":
      return "振込口座";
    case "loan_contract":
      return "ローン契約書";
    case "insurance_submission":
      return "保険会社への連絡";
    case "unknown":
      return req.name === "確認不可" ? "その他の書類" : req.name;
    default:
      return req.name === "確認不可" ? "その他の書類" : req.name;
  }
}

function buildPreparationMessage(
  programName: string,
  req: DocumentRequirement
): string {
  switch (req.category) {
    case "photo":
      return `${programName}の確認に向けて、被害状況の記録を残しましょう`;
    case "disaster_certificate":
      return `${programName}の確認に向けて、罹災証明の準備状況を確認しましょう`;
    case "identity_document":
      return `${programName}の申請に向けて、本人確認書類の準備を進めましょう`;
    case "income_proof":
      return `${programName}の確認に向けて、所得証明の準備を進めましょう`;
    case "bank_account":
      return `${programName}の確認に向けて、振込口座の情報を確認しましょう`;
    case "loan_contract":
      return `${programName}の確認に向けて、ローン契約書の確認を進めましょう`;
    case "insurance_submission":
      return `${programName}の確認に向けて、保険会社への連絡を進めましょう`;
    case "unknown":
      return `${programName}について、公式案内で必要な準備をご確認ください`;
    default:
      return `${programName}の確認に向けて、「${req.name}」の準備を進めましょう`;
  }
}

function recordLabel(record: DocumentRecord): string {
  if (record.status === "unknown") return `${record.name}（確認中）`;
  return record.name;
}

export function analyzeNextPreparation(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): NextPreparationItem[] {
  if (caseFile.recoveryPhase?.mode !== "recovery") return [];

  const primary = getPrimaryProcedure(caseFile, currentAction);
  if (!primary) return [];

  if (primary.status !== "preparing" && primary.status !== "not_started") {
    return [];
  }

  const program = getSupportProgramById(primary.relatedProgramId);
  const programName = program?.name ?? primary.name;
  const records = getDocumentRecordsForProgram(caseFile, primary.relatedProgramId);
  const requirements = getRequirementsForProgram(primary.relatedProgramId);

  const items: NextPreparationItem[] = [];

  for (const req of requirements) {
    const record = records.find((r) => r.requirementId === req.id);
    const status = record?.status ?? "missing";

    if (req.kbStatus === "unknown") {
      items.push({
        requirementId: req.id,
        programId: req.programId,
        programName,
        message: buildPreparationMessage(programName, req),
        prepLabel: prepLabelForRequirement(req),
        recordStatus: "unknown",
      });
      continue;
    }

    if (!NEEDS_PREP.has(status)) continue;

    items.push({
      requirementId: req.id,
      programId: req.programId,
      programName,
      message: buildPreparationMessage(programName, req),
      prepLabel: prepLabelForRequirement(req),
      suggestedActionId: req.suggestedActionId,
      recordStatus: status,
    });
  }

  return items.slice(0, 3);
}

/** 同一制度の準備案内を1件にまとめる（表示専用） */
export function consolidatePreparationMessages(
  items: NextPreparationItem[]
): string[] {
  const byProgram = new Map<string, NextPreparationItem[]>();
  for (const item of items) {
    const group = byProgram.get(item.programId) ?? [];
    group.push(item);
    byProgram.set(item.programId, group);
  }

  const messages: string[] = [];
  for (const group of byProgram.values()) {
    if (group.length === 1) {
      messages.push(group[0].message);
      continue;
    }
    const programName = group[0].programName;
    const labels = [
      ...new Set(
        group
          .map((i) => i.prepLabel)
          .filter((l) => l !== "確認不可")
      ),
    ];
    if (labels.length === 0) {
      messages.push(
        `${programName}について、公式案内で必要な準備をご確認ください`
      );
      continue;
    }
    messages.push(
      `${programName}の確認に向けて、${labels.join("と")}の準備を進めましょう`
    );
  }
  return messages;
}

export function getRebuildStatusDashboard(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): RebuildStatusDashboard {
  const primary = getPrimaryProcedure(caseFile, currentAction);
  const nextPreparation = analyzeNextPreparation(caseFile, currentAction);

  const prepared = (caseFile.documentRecords ?? [])
    .filter((r) => r.status === "submitted" || r.status === "verified")
    .map(recordLabel);

  let progressSummary: string | undefined;
  if (primary) {
    if (primary.status === "preparing") {
      progressSummary = "書類・記録の準備を進めています";
    } else if (
      primary.status === "submitted" ||
      primary.status === "waiting_response"
    ) {
      progressSummary = "申請済みです。結果を待ちながら次の準備を進めます";
    }
  }

  return {
    focusProcedureName: primary?.name,
    progressSummary,
    prepared: [...new Set(prepared)].slice(0, 5),
    nextPreparation,
  };
}

export function prioritizePendingActionsByDocumentGap(
  caseFile: CaseFile,
  pending: CaseAction[]
): CaseAction[] {
  if (caseFile.recoveryPhase?.mode !== "recovery") return pending;

  const nextItems = analyzeNextPreparation(caseFile);
  if (nextItems.length === 0) return pending;

  const actionId = nextItems.find((i) => i.suggestedActionId)?.suggestedActionId;
  if (!actionId) return pending;

  const list = [...pending];
  const idx = list.findIndex((a) => a.id === actionId && a.status === "todo");
  if (idx > 0) {
    const [action] = list.splice(idx, 1);
    list.unshift(action);
  }
  return list;
}

export function buildDocumentGapDecisionReason(
  programName: string,
  nextItem: NextPreparationItem
): string {
  return `${programName}を進めるため、${nextItem.message.replace(/。$/, "")}（準備項目の優先表示）`;
}

export function buildDocumentGapDecision(
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
    outcome: "document_gap_priority",
  };
}

export function maybeAppendDocumentGapDecision(
  caseFile: CaseFile,
  triggerIds: string[]
): CaseFile {
  if (caseFile.recoveryPhase?.mode !== "recovery") return caseFile;

  const nextItems = analyzeNextPreparation(caseFile);
  const top = nextItems[0];
  if (!top?.suggestedActionId) return caseFile;

  const pending = caseFile.pendingActions.find(
    (a) => a.id === top.suggestedActionId && a.status === "todo"
  );
  if (!pending) return caseFile;

  const recent = caseFile.decisions.slice(-3);
  if (
    recent.some(
      (d) =>
        d.outcome === "document_gap_priority" &&
        d.selectedActionId === pending.id
    )
  ) {
    return caseFile;
  }

  const program = getSupportProgramById(top.programId);
  const reason = buildDocumentGapDecisionReason(
    program?.name ?? top.programName,
    top
  );

  return {
    ...caseFile,
    decisions: [
      ...caseFile.decisions,
      buildDocumentGapDecision(triggerIds, pending, reason),
    ],
  };
}

export function getDocumentGapNoteForAction(
  caseFile: CaseFile,
  action: CaseAction
): string | undefined {
  const items = analyzeNextPreparation(caseFile, action);
  const match = items.find((i) => i.suggestedActionId === action.id);
  return match?.message;
}
