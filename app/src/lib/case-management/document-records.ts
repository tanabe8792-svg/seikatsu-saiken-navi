/**
 * DocumentRecord — 再建伴走の記憶基盤（Evidence 拡張）
 * docs/17 DocumentManagement
 */

import type { ExternalProcedure } from "./procedures";
import type { CaseFile } from "./types";
import { hasSubmittedEvidence } from "./evidence";
import {
  getRequirementsForProgram,
  type DocumentCategory,
  type DocumentRequirement,
} from "./document-requirements";

export type DocumentRecordStatus =
  | "missing"
  | "preparing"
  | "submitted"
  | "verified"
  | "unknown";

export type DocumentRecordSource =
  | "evidence_sync"
  | "procedure_sync"
  | "requirement_init"
  | "survivor_ack";

export interface DocumentRecord {
  id: string;
  caseId: string;
  evidenceId?: string;
  procedureId?: string;
  requirementId: string;
  programId: string;
  category: DocumentCategory;
  name: string;
  status: DocumentRecordStatus;
  createdAt: string;
  updatedAt: string;
  source: DocumentRecordSource;
  metadata: Record<string, unknown>;
}

export function createDocumentRecordId(requirementId: string): string {
  return `doc-${requirementId}`;
}

const PROCEDURE_SATISFIED = new Set<ExternalProcedure["status"]>([
  "preparing",
  "submitted",
  "waiting_response",
  "completed",
]);

const PROCEDURE_SUBMITTED = new Set<ExternalProcedure["status"]>([
  "submitted",
  "waiting_response",
  "completed",
]);

function findProcedureByProgramId(
  procedures: ExternalProcedure[],
  programId: string
): ExternalProcedure | undefined {
  return procedures.find((p) => p.relatedProgramId === programId);
}

function isActionCompleted(caseFile: CaseFile, actionId: string): boolean {
  return caseFile.completedActions.some((a) => a.id === actionId);
}

function isActionPending(caseFile: CaseFile, actionId: string): boolean {
  return caseFile.pendingActions.some(
    (a) => a.id === actionId && a.status === "todo"
  );
}

function computeRequirementStatus(
  caseFile: CaseFile,
  req: DocumentRequirement,
  procedure?: ExternalProcedure
): DocumentRecordStatus {
  if (req.kbStatus === "unknown") return "unknown";

  if (req.satisfiedByProgramId) {
    const prereq = findProcedureByProgramId(
      caseFile.procedures ?? [],
      req.satisfiedByProgramId
    );
    if (!prereq) {
      if (req.suggestedActionId && isActionPending(caseFile, req.suggestedActionId)) {
        return "preparing";
      }
      return "missing";
    }
    if (PROCEDURE_SUBMITTED.has(prereq.status)) return "submitted";
    if (PROCEDURE_SATISFIED.has(prereq.status)) return "preparing";
    return "missing";
  }

  if (req.category === "photo") {
    if (hasSubmittedEvidence(caseFile, "rw-j03-photo")) return "submitted";
    if (isActionPending(caseFile, "rw-j03-photo")) return "preparing";
    return "missing";
  }

  if (req.category === "identity_document") {
    if (isActionCompleted(caseFile, "rw-j03-cert-prep")) return "submitted";
    const certProc = findProcedureByProgramId(
      caseFile.procedures ?? [],
      "SP-DISASTER-CERTIFICATE"
    );
    if (certProc && PROCEDURE_SATISFIED.has(certProc.status)) return "preparing";
    if (isActionPending(caseFile, "rw-j03-cert-prep")) return "preparing";
    return "missing";
  }

  if (req.category === "income_proof" || req.category === "bank_account") {
    if (isActionCompleted(caseFile, "rw-j04-life-rebuild")) return "submitted";
    if (isActionPending(caseFile, "rw-j04-life-rebuild")) return "preparing";
    return "missing";
  }

  if (req.category === "loan_contract") {
    if (isActionCompleted(caseFile, "rw-j04-loan-relief")) return "submitted";
    if (isActionPending(caseFile, "rw-j04-loan-relief")) return "preparing";
    return "missing";
  }

  if (req.category === "insurance_submission") {
    if (isActionCompleted(caseFile, "rw-j04-insurance-report")) return "submitted";
    if (isActionPending(caseFile, "rw-j04-insurance-report")) return "preparing";
    return "missing";
  }

  if (procedure && PROCEDURE_SUBMITTED.has(procedure.status)) {
    return "submitted";
  }
  if (procedure && procedure.status === "preparing") {
    return "preparing";
  }

  return "missing";
}

function linkEvidenceId(
  caseFile: CaseFile,
  req: DocumentRequirement
): string | undefined {
  if (req.category === "photo") {
    const ev = (caseFile.evidences ?? []).find((e) => e.actionId === "rw-j03-photo");
    return ev?.id;
  }
  if (req.category === "identity_document" || req.category === "disaster_certificate") {
    const certProc = findProcedureByProgramId(
      caseFile.procedures ?? [],
      "SP-DISASTER-CERTIFICATE"
    );
    if (!certProc) return undefined;
    return (caseFile.evidences ?? []).find((e) => e.procedureId === certProc.id)?.id;
  }
  return undefined;
}

/** Requirement ごとに DocumentRecord を生成・更新 */
export function syncDocumentRecords(caseFile: CaseFile): CaseFile {
  const now = new Date().toISOString();
  const procedures = caseFile.procedures ?? [];
  const programIds = [
    ...new Set(procedures.map((p) => p.relatedProgramId)),
  ];

  const existing = new Map(
    (caseFile.documentRecords ?? []).map((r) => [r.requirementId, r])
  );
  const records: DocumentRecord[] = [];

  for (const programId of programIds) {
    const procedure = findProcedureByProgramId(procedures, programId);
    const requirements = getRequirementsForProgram(programId);

    for (const req of requirements) {
      const prev = existing.get(req.id);
      let status = computeRequirementStatus(caseFile, req, procedure);
      const evidenceId = linkEvidenceId(caseFile, req);
      let source: DocumentRecordSource = evidenceId
        ? "evidence_sync"
        : prev?.source === "survivor_ack"
          ? "survivor_ack"
          : prev?.source ?? "requirement_init";

      // 被災者が「用意できた」と付けた完了は、同期で missing に戻さない
      if (
        prev?.source === "survivor_ack" &&
        (prev.status === "submitted" || prev.status === "verified") &&
        (status === "missing" || status === "preparing" || status === "unknown")
      ) {
        status = prev.status;
        source = "survivor_ack";
      }

      records.push({
        id: prev?.id ?? createDocumentRecordId(req.id),
        caseId: caseFile.caseId,
        evidenceId: evidenceId ?? prev?.evidenceId,
        procedureId: procedure?.id ?? prev?.procedureId,
        requirementId: req.id,
        programId: req.programId,
        category: req.category,
        name: req.name === "確認不可" ? "その他の書類（公式で確認）" : req.name,
        status,
        createdAt: prev?.createdAt ?? now,
        updatedAt: status !== prev?.status ? now : prev?.updatedAt ?? now,
        source,
        metadata: prev?.metadata ?? {},
      });
    }
  }

  return {
    ...caseFile,
    documentRecords: records,
    updatedAt: now,
  };
}

export function normalizeDocumentRecords(raw: unknown): DocumentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is DocumentRecord =>
      !!r &&
      typeof r === "object" &&
      typeof (r as DocumentRecord).id === "string" &&
      typeof (r as DocumentRecord).requirementId === "string"
  );
}

export function getDocumentRecordsForProgram(
  caseFile: CaseFile,
  programId: string
): DocumentRecord[] {
  return (caseFile.documentRecords ?? []).filter((r) => r.programId === programId);
}

export function getSubmittedDocumentRecords(
  caseFile: CaseFile
): DocumentRecord[] {
  return (caseFile.documentRecords ?? []).filter(
    (r) => r.status === "submitted" || r.status === "verified"
  );
}

const PREP_DONE = new Set<DocumentRecordStatus>(["submitted", "verified"]);

/** 被災者が準備物を「用意できた／まだ」と記録（表示・伴走用） */
export function markDocumentPrepared(
  caseFile: CaseFile,
  requirementId: string,
  prepared: boolean
): CaseFile {
  const base = syncDocumentRecords(caseFile);
  const now = new Date().toISOString();
  const records = (base.documentRecords ?? []).map((r) => {
    if (r.requirementId !== requirementId) return r;
    if (r.status === "unknown" && prepared) {
      // unknown は公式確認扱いのまま、メタデータだけ進捗を残す
      return {
        ...r,
        updatedAt: now,
        source: "survivor_ack" as const,
        metadata: { ...r.metadata, survivorChecked: true },
      };
    }
    return {
      ...r,
      status: prepared ? ("submitted" as const) : ("preparing" as const),
      updatedAt: now,
      source: "survivor_ack" as const,
      metadata: { ...r.metadata, survivorChecked: prepared },
    };
  });

  const found = records.some((r) => r.requirementId === requirementId);
  if (!found) {
    return base;
  }

  return {
    ...base,
    documentRecords: records,
    updatedAt: now,
  };
}

export function isDocumentPrepDone(record: DocumentRecord): boolean {
  if (record.status === "unknown") {
    return record.metadata?.survivorChecked === true;
  }
  return PREP_DONE.has(record.status);
}

/** プログラムに紐づく準備物がすべて完了しているか（unknown はチェック必須） */
export function areProgramPrepItemsDone(
  caseFile: CaseFile,
  programId: string
): boolean {
  const records = getDocumentRecordsForProgram(caseFile, programId);
  if (records.length === 0) return true;
  return records.every((r) => isDocumentPrepDone(r));
}
