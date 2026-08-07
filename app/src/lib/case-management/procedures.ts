/**
 * Real World Action V3 — 外部手続き（Procedure）追跡
 * docs/13 ProcedureTracking
 */

import { getSupportProgramById } from "@/lib/knowledge/support-programs";
import type { EvidenceType } from "./evidence";
import type { CaseAction, CaseFile } from "./types";
import { areProcedurePrerequisitesMet } from "./procedure-dependencies";

export type ProcedureType =
  | "disaster_certificate"
  | "insurance_claim"
  | "housing_support"
  | "loan_relief"
  | "utility_reduction"
  | "welfare_support"
  | "business_support"
  | "life_rebuild_grant"
  | "emergency_repair"
  | "tax_social_insurance";

export type ProcedureStatus =
  | "not_started"
  | "preparing"
  | "submitted"
  | "waiting_response"
  | "completed"
  | "rejected"
  | "unknown";

export interface ExternalProcedure {
  id: string;
  type: ProcedureType;
  name: string;
  organization: string;
  relatedActionId?: string;
  relatedProgramId: string;
  status: ProcedureStatus;
  submittedAt?: string;
  updatedAt: string;
  sourceUrl?: string;
  note?: string;
}

export interface ProcedureRequiredEvidence {
  type: EvidenceType;
  description: string;
}

export interface ProcedureTemplate {
  programId: string;
  type: ProcedureType;
  name: string;
  organization: string;
  linkedActionIds: string[];
  /** 前提となる制度 ID（KB requiredDocuments 由来） */
  prerequisiteProgramIds?: string[];
  /** 申請に必要な証跡（KB requiredDocuments 由来） */
  requiredEvidence?: ProcedureRequiredEvidence[];
  /** この Action 完了で Procedure を preparing に */
  activateOnActionComplete?: string[];
  /** この Action 完了で Procedure を submitted に */
  submitOnActionComplete?: string[];
}

/** support-programs.ts の制度 ID と紐付け */
export const PROCEDURE_TEMPLATES: ProcedureTemplate[] = [
  {
    programId: "SP-DISASTER-CERTIFICATE",
    type: "disaster_certificate",
    name: "罹災証明書",
    organization: "自治体",
    linkedActionIds: ["rw-j03-cert-prep"],
    requiredEvidence: [
      { type: "photo", description: "被害状況がわかる写真" },
      { type: "document", description: "身分証明書" },
    ],
    activateOnActionComplete: ["rw-j03-photo"],
    submitOnActionComplete: ["rw-j03-cert-prep"],
  },
  {
    programId: "SP-INSURANCE-CLAIM",
    type: "insurance_claim",
    name: "火災・地震保険 事故報告",
    organization: "加入保険会社",
    linkedActionIds: ["rw-j04-insurance-report"],
    requiredEvidence: [
      { type: "photo", description: "被害状況がわかる写真" },
    ],
    activateOnActionComplete: ["rw-j03-photo", "rw-j04-insurance-report"],
    submitOnActionComplete: ["rw-j04-insurance-report"],
  },
  {
    programId: "SP-DISASTER-LOAN-RELIEF",
    type: "loan_relief",
    name: "被災ローン減免制度",
    organization: "金融機関・国",
    linkedActionIds: ["rw-j04-loan-relief"],
    prerequisiteProgramIds: ["SP-DISASTER-CERTIFICATE"],
    requiredEvidence: [
      { type: "document", description: "罹災証明" },
      { type: "document", description: "ローン契約書" },
    ],
    activateOnActionComplete: ["rw-j03-cert-prep", "rw-j04-loan-relief"],
    submitOnActionComplete: ["rw-j04-loan-relief"],
  },
  {
    programId: "SP-TEMP-HOUSING",
    type: "housing_support",
    name: "仮設住宅",
    organization: "自治体",
    linkedActionIds: ["rw-j05-temp-housing"],
    prerequisiteProgramIds: ["SP-DISASTER-CERTIFICATE"],
    requiredEvidence: [{ type: "document", description: "罹災証明" }],
    activateOnActionComplete: ["rw-j05-temp-housing"],
  },
  {
    programId: "SP-WATER-RATE-REDUCTION",
    type: "utility_reduction",
    name: "水道料金減免",
    organization: "自治体・水道事業者",
    linkedActionIds: ["rw-j02-water-station"],
    activateOnActionComplete: ["rw-j02-water-station"],
  },
  {
    programId: "SP-BUSINESS-SME-RECOVERY",
    type: "business_support",
    name: "中小企業向け災害復旧支援",
    organization: "国・自治体",
    linkedActionIds: ["rw-j04-business-recovery", "rw-j04-programs"],
    activateOnActionComplete: ["rw-j04-business-recovery"],
  },
  {
    programId: "SP-LIFE-REBUILD",
    type: "life_rebuild_grant",
    name: "被災者生活再建支援制度",
    organization: "国（自治体経由）",
    linkedActionIds: ["rw-j04-life-rebuild"],
    prerequisiteProgramIds: ["SP-DISASTER-CERTIFICATE"],
    requiredEvidence: [
      { type: "document", description: "罹災証明" },
      { type: "document", description: "所得証明" },
      { type: "document", description: "振込口座" },
    ],
    activateOnActionComplete: ["rw-j03-cert-prep", "rw-j04-life-rebuild"],
    submitOnActionComplete: ["rw-j04-life-rebuild"],
  },
  {
    programId: "SP-EMERGENCY-REPAIR",
    type: "emergency_repair",
    name: "応急修理制度",
    organization: "自治体",
    linkedActionIds: ["rw-j05-emergency-repair"],
    prerequisiteProgramIds: ["SP-DISASTER-CERTIFICATE"],
    requiredEvidence: [{ type: "document", description: "罹災証明" }],
    activateOnActionComplete: ["rw-j03-cert-prep", "rw-j05-emergency-repair"],
    submitOnActionComplete: ["rw-j05-emergency-repair"],
  },
  {
    programId: "SP-TAX-SOCIAL-INSURANCE",
    type: "tax_social_insurance",
    name: "税・社会保険 被災者向け手続",
    organization: "国税庁・所管機関",
    linkedActionIds: ["rw-j04-tax-social"],
    requiredEvidence: [{ type: "document", description: "確認不可" }],
    activateOnActionComplete: ["rw-j04-tax-social"],
    submitOnActionComplete: ["rw-j04-tax-social"],
  },
];

const TEMPLATE_BY_PROGRAM = new Map(
  PROCEDURE_TEMPLATES.map((t) => [t.programId, t])
);

export function createProcedureId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `proc-${crypto.randomUUID()}`;
  }
  return `proc-${Date.now()}`;
}

export function getProcedureStatusLabel(status: ProcedureStatus): string {
  const labels: Record<ProcedureStatus, string> = {
    not_started: "まだ申請していない",
    preparing: "申請の準備中",
    submitted: "申請済み",
    waiting_response: "結果の連絡待ち",
    completed: "手続き完了",
    rejected: "再確認が必要",
    unknown: "確認中",
  };
  return labels[status];
}

/** 被災者向け：公式記録の意味を補足 */
export function getProcedureStatusPlainExplanation(
  status: ProcedureStatus
): string {
  switch (status) {
    case "not_started":
      return "このナビ上では、まだ申請した記録がありません。「やっていない」確定ではなく、これから確認・準備する段階です。";
    case "preparing":
      return "申請に向けて、準備を進めている記録です。あなたのチェックリストとあわせて見てください。";
    case "submitted":
      return "申請済みとして記録しています。窓口の受付結果は、届いた案内を正としてください。";
    case "waiting_response":
      return "申請あとの調査・判定の連絡を待っている記録です。催促せず、受付番号を控えて公式の案内を待ちましょう。待つあいだも、写真や保険の連絡など自分で進められる確認は続けて大丈夫です。";
    case "completed":
      return "このナビ上では手続き完了としています。";
    case "rejected":
      return "再確認ややり直しが必要な状態です。公式案内を確認してください。";
    case "unknown":
      return "状況を確認している途中です。";
  }
}

/** 状態別ケースワーカーメッセージ */
export function getProcedureStatusMessage(
  procedure: ExternalProcedure,
  nextAction?: CaseAction | null
): string {
  const nextHint = nextAction ? `${nextAction.title}を進めましょう` : "";

  switch (procedure.status) {
    case "not_started":
      return "まず申請準備をしましょう";
    case "preparing":
      return nextAction
        ? `必要書類を確認しています。次は${nextAction.title}です`
        : "必要書類を確認しています";
    case "submitted":
      return "申請済みです。結果を待ちながら次の準備を進めます";
    case "waiting_response":
      return "自治体からの連絡待ちです";
    case "completed":
      return `${procedure.name}が完了しました`;
    case "rejected":
      return `${procedure.name}の再申請が必要です。${nextHint}`;
    case "unknown":
      return `${procedure.name}の状況を確認中です`;
    default:
      return nextHint;
  }
}

export function procedureFromTemplate(
  template: ProcedureTemplate,
  relatedActionId?: string
): ExternalProcedure {
  const program = getSupportProgramById(template.programId);
  const now = new Date().toISOString();
  return {
    id: createProcedureId(),
    type: template.type,
    name: template.name,
    organization: template.organization,
    relatedProgramId: template.programId,
    relatedActionId,
    status: "not_started",
    updatedAt: now,
    sourceUrl:
      program?.sourceUrl && program.sourceUrl !== "確認不可"
        ? program.sourceUrl
        : undefined,
  };
}

/** Action Queue から関連 Procedure を初期生成 */
export function generateProceduresForActions(
  actions: CaseAction[]
): ExternalProcedure[] {
  const programIds = new Set<string>();
  for (const action of actions) {
    for (const pid of action.relatedProgramIds ?? []) {
      programIds.add(pid);
    }
  }

  const procedures: ExternalProcedure[] = [];
  for (const programId of programIds) {
    const template = TEMPLATE_BY_PROGRAM.get(programId);
    if (!template) continue;
    const linkedAction = actions.find((a) =>
      template.linkedActionIds.includes(a.id)
    );
    procedures.push(procedureFromTemplate(template, linkedAction?.id));
  }
  return procedures;
}

function findProcedureByProgramId(
  procedures: ExternalProcedure[],
  programId: string
): ExternalProcedure | undefined {
  return procedures.find((p) => p.relatedProgramId === programId);
}

function updateProcedure(
  procedures: ExternalProcedure[],
  programId: string,
  patch: Partial<ExternalProcedure> & { status: ProcedureStatus }
): ExternalProcedure[] {
  const now = new Date().toISOString();
  const existing = findProcedureByProgramId(procedures, programId);
  if (existing) {
    return procedures.map((p) =>
      p.relatedProgramId === programId
        ? {
            ...p,
            ...patch,
            updatedAt: now,
            submittedAt:
              patch.status === "submitted" && !p.submittedAt
                ? (patch.submittedAt ?? now)
                : p.submittedAt,
          }
        : p
    );
  }

  const template = TEMPLATE_BY_PROGRAM.get(programId);
  if (!template) return procedures;

  return [
    ...procedures,
    {
      ...procedureFromTemplate(template, patch.relatedActionId),
      ...patch,
      updatedAt: now,
      submittedAt:
        patch.status === "submitted" ? (patch.submittedAt ?? now) : undefined,
    },
  ];
}

/** Action 完了後に Procedure 状態を同期 */
export function syncProceduresOnActionComplete(
  caseFile: CaseFile,
  completedAction: CaseAction,
  nextAction: CaseAction | null
): ExternalProcedure[] {
  let procedures = [...(caseFile.procedures ?? [])];

  for (const template of PROCEDURE_TEMPLATES) {
    const activatesOn = template.activateOnActionComplete ?? [];
    if (activatesOn.includes(completedAction.id)) {
      const { met } = areProcedurePrerequisitesMet(
        procedures,
        template.programId,
        template.prerequisiteProgramIds
      );
      if (!met) continue;

      const nextIsLinked =
        nextAction && template.linkedActionIds.includes(nextAction.id);
      const relatedId = nextIsLinked
        ? nextAction.id
        : template.linkedActionIds[0];

      procedures = updateProcedure(procedures, template.programId, {
        status: "preparing",
        relatedActionId: relatedId,
      });
    }

    const submitsOn = template.submitOnActionComplete ?? [];
    if (submitsOn.includes(completedAction.id)) {
      const hasSubmitEvidence = (caseFile.evidences ?? []).some(
        (e) =>
          e.procedureId &&
          findProcedureByProgramId(procedures, template.programId)?.id ===
            e.procedureId
      );
      // 罹災証明など SELF_CONFIRM 完了＝申請した想定 → 証跡がなくても「結果待ち」
      const nextStatus: ProcedureStatus = hasSubmitEvidence
        ? "submitted"
        : template.programId === "SP-DISASTER-CERTIFICATE"
          ? "waiting_response"
          : "preparing";
      procedures = updateProcedure(procedures, template.programId, {
        status: nextStatus,
        relatedActionId: completedAction.id,
      });
    }
  }

  return procedures;
}

/** 手続きに紐づく Evidence 提出後の状態更新 */
export function syncProcedureOnEvidenceSubmit(
  caseFile: CaseFile,
  procedureId: string
): ExternalProcedure[] {
  const procedure = (caseFile.procedures ?? []).find(
    (p) => p.id === procedureId
  );
  if (!procedure) return caseFile.procedures ?? [];

  const evidences = (caseFile.evidences ?? []).filter(
    (e) => e.procedureId === procedureId
  );
  if (evidences.length === 0) return caseFile.procedures ?? [];

  let nextStatus: ProcedureStatus = procedure.status;
  if (
    procedure.status === "preparing" ||
    procedure.status === "not_started"
  ) {
    nextStatus = "submitted";
  }

  return updateProcedure(caseFile.procedures ?? [], procedure.relatedProgramId, {
    status: nextStatus,
    relatedActionId: procedure.relatedActionId,
    submittedAt: new Date().toISOString(),
  });
}

/** ホーム表示用: 最も関連の高い Procedure */
export function getPrimaryProcedure(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ExternalProcedure | null {
  const procedures = caseFile.procedures ?? [];
  if (procedures.length === 0) return null;

  const active = procedures.filter(
    (p) =>
      p.status !== "completed" &&
      p.status !== "rejected" &&
      p.status !== "unknown"
  );
  if (active.length === 0) return procedures[procedures.length - 1] ?? null;

  if (currentAction) {
    const linked = active.find(
      (p) =>
        p.relatedActionId === currentAction.id ||
        currentAction.relatedProgramIds?.includes(p.relatedProgramId)
    );
    if (linked) return linked;
  }

  const priority: ProcedureStatus[] = [
    "waiting_response",
    "submitted",
    "preparing",
    "not_started",
  ];
  for (const status of priority) {
    const match = active.find((p) => p.status === status);
    if (match) return match;
  }

  return active[0] ?? null;
}

export interface ProcedureDashboardState {
  procedure: ExternalProcedure | null;
  statusLabel: string;
  workerMessage: string;
  nextActionTitle?: string;
}

export function getProcedureDashboardState(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ProcedureDashboardState {
  const procedure = getPrimaryProcedure(caseFile, currentAction);
  if (!procedure) {
    return {
      procedure: null,
      statusLabel: "",
      workerMessage: caseFile.workerMessage ?? "",
    };
  }

  const statusLabel = getProcedureStatusLabel(procedure.status);
  const workerMessage =
    caseFile.workerMessage ??
    getProcedureStatusMessage(procedure, currentAction);

  return {
    procedure,
    statusLabel,
    workerMessage,
    nextActionTitle: currentAction?.title,
  };
}

/** MVP: 罹災証明申請のデフォルト証跡 */
export function createDefaultCertificateEvidence(
  procedureId: string,
  actionId: string
) {
  return {
    type: "screenshot" as const,
    actionId,
    procedureId,
    metadata: {
      description: "申請受付スクショ",
      receiptNumber: "受付番号（自己申告）",
      note: "オンライン/窓口申請の記録",
      source: "procedure_v3",
    },
  };
}

export function normalizeProcedures(raw: unknown): ExternalProcedure[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is ExternalProcedure =>
      !!p &&
      typeof p === "object" &&
      typeof (p as ExternalProcedure).id === "string" &&
      typeof (p as ExternalProcedure).relatedProgramId === "string"
  );
}
