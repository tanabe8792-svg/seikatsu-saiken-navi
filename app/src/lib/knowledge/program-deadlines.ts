/**
 * KB — 制度別期限テンプレート（出典必須）
 * docs/15 DeadlineManagement
 */

import type { TargetCondition } from "./types";
import { getSupportProgramById } from "./support-programs";
import { DISASTER_EVENT_R8_KUMAMOTO } from "./municipalities";

export const DISASTER_OCCURRED_DATE = DISASTER_EVENT_R8_KUMAMOTO.occurredAt;

export type ProgramDeadlineType =
  | "application"
  | "document_submission"
  | "procedure_followup";

/** 期限算定（出典付きのみ Case に生成） */
export type DeadlineCalculation =
  | {
      kind: "fixed_date";
      date: string;
      sourceUrl: string;
      updatedAt: string;
    }
  | {
      kind: "days_from_disaster";
      /** 被災日（2026-07-28）からの日数 — 公式目安に基づく算定 */
      days: number;
      sourceUrl: string;
      updatedAt: string;
      note: string;
    }
  | {
      kind: "reference_only";
      /** 公式ページで期限確認（具体日は KB 未確認） */
      sourceUrl: string;
      updatedAt: string;
      note: string;
    };

export interface ProgramDeadlineTemplate {
  id: string;
  programId: string;
  type: ProgramDeadlineType;
  label: string;
  calculation: DeadlineCalculation;
  targetConditions?: TargetCondition[];
  /** due_soon 判定（日） */
  reminderDaysBefore: number[];
  relatedActionIds?: string[];
}

const INVALID_SOURCE = new Set(["", "確認不可"]);

function isValidSource(url?: string): url is string {
  return !!url && !INVALID_SOURCE.has(url);
}

/** 既存 support-programs の出典がある制度のみ */
export const PROGRAM_DEADLINE_TEMPLATES: ProgramDeadlineTemplate[] = [
  {
    id: "DL-SP-DISASTER-CERTIFICATE",
    programId: "SP-DISASTER-CERTIFICATE",
    type: "application",
    label: "罹災証明書 申請の受付",
    calculation: {
      kind: "reference_only",
      sourceUrl: "https://digital-gov.note.jp/n/ne4f237bf506b",
      updatedAt: "2026-08-06",
      note:
        "受付期間は市町村ごとに決まり、避難中・状況整理の途中でも慌てなくて大丈夫です。このナビでは「○日まで」と決めつけません。安全が取れてから、お住まいの自治体の公式案内で受付期間を確認してください。",
    },
    reminderDaysBefore: [30, 14, 7],
    relatedActionIds: ["rw-j03-cert-prep"],
  },
  {
    id: "DL-SP-LIFE-REBUILD",
    programId: "SP-LIFE-REBUILD",
    type: "application",
    label: "被災者生活再建支援制度 申請期限",
    calculation: {
      kind: "reference_only",
      sourceUrl:
        "https://www.bousai.go.jp/taisaku/seikatsusaiken/",
      updatedAt: "2026-08-07",
      note: "災害ごとに適用期限が告示されるため公式ページで確認",
    },
    reminderDaysBefore: [30, 14, 7],
    relatedActionIds: ["rw-j04-life-rebuild"],
  },
  {
    id: "DL-SP-EMERGENCY-REPAIR",
    programId: "SP-EMERGENCY-REPAIR",
    type: "application",
    label: "応急修理制度 申請",
    calculation: {
      kind: "reference_only",
      sourceUrl: "https://kumamoto-shien.jp/",
      updatedAt: "2026-08-04",
      note: "熊本市制度の申請期限は支援ナビ・市公式で確認",
    },
    reminderDaysBefore: [14, 7],
    relatedActionIds: ["rw-j05-emergency-repair"],
  },
  {
    id: "DL-SP-INSURANCE-CLAIM",
    programId: "SP-INSURANCE-CLAIM",
    type: "procedure_followup",
    label: "火災・地震保険 事故報告",
    calculation: {
      kind: "days_from_disaster",
      days: 30,
      sourceUrl: "https://www.sonpo.or.jp/news/notice/",
      updatedAt: "2026-08-07",
      note: "契約により異なります。早めの連絡が望ましい場合があります。詳細は加入保険会社の案内で確認してください。",
    },
    reminderDaysBefore: [14, 7],
    relatedActionIds: ["rw-j04-insurance-report"],
  },
  {
    id: "DL-SP-DISASTER-LOAN-RELIEF",
    programId: "SP-DISASTER-LOAN-RELIEF",
    type: "application",
    label: "被災ローン減免 申請・相談期限",
    calculation: {
      kind: "reference_only",
      sourceUrl: "https://www.dgl.or.jp/guideline/",
      updatedAt: "2026-08-07",
      note: "金融機関・制度ごとの期限は借入先とガイドライン公式で確認",
    },
    reminderDaysBefore: [14, 7],
    relatedActionIds: ["rw-j04-loan-relief"],
  },
  {
    id: "DL-SP-TEMP-HOUSING",
    programId: "SP-TEMP-HOUSING",
    type: "application",
    label: "仮設住宅 申請",
    calculation: {
      kind: "reference_only",
      sourceUrl: "https://kumamoto-shien.jp/",
      updatedAt: "2026-08-04",
      note: "県・自治体の募集期間は公式情報で確認",
    },
    reminderDaysBefore: [14, 7],
    relatedActionIds: ["rw-j05-temp-housing"],
  },
];

const TEMPLATE_BY_PROGRAM = new Map(
  PROGRAM_DEADLINE_TEMPLATES.map((t) => [t.programId, t])
);

export function getDeadlineTemplateByProgramId(
  programId: string
): ProgramDeadlineTemplate | undefined {
  const template = TEMPLATE_BY_PROGRAM.get(programId);
  if (!template) return undefined;
  const program = getSupportProgramById(programId);
  if (!program || !isValidSource(program.sourceUrl)) return undefined;
  if (!isValidSource(template.calculation.sourceUrl)) return undefined;
  return template;
}

export function getAllProgramDeadlineTemplates(): ProgramDeadlineTemplate[] {
  return PROGRAM_DEADLINE_TEMPLATES.filter((t) =>
    getDeadlineTemplateByProgramId(t.programId)
  );
}
