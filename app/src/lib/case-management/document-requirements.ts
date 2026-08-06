/**
 * DocumentRequirement — KB support-programs.requiredDocuments 由来（推測禁止）
 * docs/17 DocumentManagement
 */

import { getAllSupportPrograms, getSupportProgramById } from "@/lib/knowledge/support-programs";
import type { EvidenceType } from "./evidence";

export type DocumentCategory =
  | "photo"
  | "disaster_certificate"
  | "identity_document"
  | "insurance_submission"
  | "application_receipt"
  | "income_proof"
  | "bank_account"
  | "loan_contract"
  | "unknown";

export type RequirementKbStatus = "confirmed" | "unknown";

export interface DocumentRequirement {
  id: string;
  programId: string;
  name: string;
  category: DocumentCategory;
  evidenceType?: EvidenceType;
  kbStatus: RequirementKbStatus;
  /** 他制度の Procedure 完了で充足可能（KB requiredDocuments「罹災証明」等） */
  satisfiedByProgramId?: string;
  /** 充足時に誘導する既存 Action（新規 Action 禁止） */
  suggestedActionId?: string;
}

const UNKNOWN_LABEL = "確認不可";

function slugify(name: string): string {
  return name.replace(/\s+/g, "-").slice(0, 40);
}

function mapDocumentNameToCategory(
  programId: string,
  name: string
): Pick<DocumentRequirement, "category" | "evidenceType" | "satisfiedByProgramId" | "suggestedActionId" | "kbStatus"> {
  if (name === UNKNOWN_LABEL) {
    return { category: "unknown", kbStatus: "unknown" };
  }

  if (name.includes("被害") && name.includes("写真")) {
    return {
      category: "photo",
      evidenceType: "photo",
      suggestedActionId: "rw-j03-photo",
      kbStatus: "confirmed",
    };
  }

  if (name === "身分証明書" || name.includes("本人確認")) {
    return {
      category: "identity_document",
      evidenceType: "document",
      suggestedActionId: "rw-j03-cert-prep",
      kbStatus: "confirmed",
    };
  }

  if (name === "罹災証明" || name.includes("罹災証明")) {
    return {
      category: "disaster_certificate",
      evidenceType: "document",
      satisfiedByProgramId: "SP-DISASTER-CERTIFICATE",
      suggestedActionId: "rw-j03-cert-prep",
      kbStatus: "confirmed",
    };
  }

  if (name === "所得証明") {
    return {
      category: "income_proof",
      evidenceType: "document",
      suggestedActionId: "rw-j04-life-rebuild",
      kbStatus: "confirmed",
    };
  }

  if (name === "振込口座") {
    return {
      category: "bank_account",
      evidenceType: "document",
      suggestedActionId: "rw-j04-life-rebuild",
      kbStatus: "confirmed",
    };
  }

  if (name === "ローン契約書") {
    return {
      category: "loan_contract",
      evidenceType: "document",
      suggestedActionId: "rw-j04-loan-relief",
      kbStatus: "confirmed",
    };
  }

  if (programId === "SP-INSURANCE-CLAIM" && name !== UNKNOWN_LABEL) {
    return {
      category: "insurance_submission",
      evidenceType: "document",
      suggestedActionId: "rw-j04-insurance-report",
      kbStatus: "confirmed",
    };
  }

  return { category: "unknown", kbStatus: "unknown" };
}

/** KB requiredDocuments から Requirement を生成 */
export function getRequirementsForProgram(programId: string): DocumentRequirement[] {
  const program = getSupportProgramById(programId);
  if (!program?.requiredDocuments?.length) return [];

  return program.requiredDocuments.map((name) => {
    const mapped = mapDocumentNameToCategory(programId, name);
    return {
      id: `REQ-${programId}-${slugify(name)}`,
      programId,
      name,
      ...mapped,
    };
  });
}

export function getRequirementById(
  requirementId: string
): DocumentRequirement | undefined {
  for (const program of getAllSupportPrograms()) {
    const found = getRequirementsForProgram(program.id).find(
      (r) => r.id === requirementId
    );
    if (found) return found;
  }
  return undefined;
}

/** Case に存在する Procedure 制度の Requirement を集約 */
export function getRequirementsForCasePrograms(
  programIds: string[]
): DocumentRequirement[] {
  const seen = new Set<string>();
  const results: DocumentRequirement[] = [];
  for (const pid of programIds) {
    for (const req of getRequirementsForProgram(pid)) {
      if (seen.has(req.id)) continue;
      seen.add(req.id);
      results.push(req);
    }
  }
  return results;
}
