/**
 * Case Deadline — 期限インスタンス管理
 * docs/15 DeadlineManagement
 */

import type { CaseProfile } from "@/lib/knowledge/types";
import {
  getDeadlineTemplateByProgramId,
  type ProgramDeadlineTemplate,
  type ProgramDeadlineType,
  DISASTER_OCCURRED_DATE,
} from "@/lib/knowledge/program-deadlines";
import { matchesAllConditions } from "@/lib/knowledge/triggers";
import type { ExternalProcedure } from "./procedures";
import type { CaseAction, CaseFile } from "./types";

export type CaseDeadlineStatus =
  | "unknown"
  | "upcoming"
  | "due_soon"
  | "overdue"
  | "completed";

export interface CaseDeadline {
  id: string;
  templateId: string;
  programId: string;
  procedureId?: string;
  relatedActionId?: string;
  type: ProgramDeadlineType;
  label: string;
  dueDate: string | null;
  sourceUrl: string;
  updatedAt: string;
  status: CaseDeadlineStatus;
  reminderDaysBefore: number[];
  createdAt: string;
}

export const DUE_SOON_DEFAULT_DAYS = 14;

export function createDeadlineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `dl-${crypto.randomUUID()}`;
  }
  return `dl-${Date.now()}`;
}

function resolveDueDate(template: ProgramDeadlineTemplate): string | null {
  const calc = template.calculation;
  if (calc.kind === "fixed_date") {
    return calc.date;
  }
  if (calc.kind === "days_from_disaster") {
    const base = new Date(DISASTER_OCCURRED_DATE);
    if (Number.isNaN(base.getTime())) return null;
    base.setDate(base.getDate() + calc.days);
    return base.toISOString().slice(0, 10);
  }
  return null;
}

export function daysSinceDisaster(referenceDate: Date = new Date()): number {
  const occurred = new Date(DISASTER_OCCURRED_DATE);
  occurred.setHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  return Math.floor(
    (ref.getTime() - occurred.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getDeadlineTemplateNote(
  deadline: CaseDeadline
): string | undefined {
  const template = getDeadlineTemplateByProgramId(deadline.programId);
  const calc = template?.calculation;
  if (!calc || calc.kind === "fixed_date") return undefined;
  return calc.note;
}

export function formatDisasterRelativeDeadline(deadline: CaseDeadline): string {
  const template = getDeadlineTemplateByProgramId(deadline.programId);
  const calc = template?.calculation;
  if (calc?.kind === "days_from_disaster") {
    const dueLabel = deadline.dueDate?.replace(/-/g, ".") ?? "確認中";
    return `被災日（2026.7.28）から約${calc.days}日の目安 → ${dueLabel}ごろ（確定ではありません）`;
  }
  if (calc?.kind === "reference_only") {
    return "この制度の締切は、お住まいの市町村・公式案内ごとに異なります。避難や安全の確保を優先して大丈夫です。";
  }
  const elapsed = daysSinceDisaster();
  return `被災から${elapsed}日経過（2026.7.28起算）。焦らず、自分のペースで確認しましょう。`;
}

function resolveSourceMeta(template: ProgramDeadlineTemplate): {
  sourceUrl: string;
  updatedAt: string;
} {
  const calc = template.calculation;
  return {
    sourceUrl: calc.sourceUrl,
    updatedAt: calc.updatedAt,
  };
}

/** 出典ありテンプレートのみ CaseDeadline を生成 */
export function createCaseDeadlineFromTemplate(
  template: ProgramDeadlineTemplate,
  options?: {
    procedureId?: string;
    relatedActionId?: string;
    caseProfile?: CaseProfile;
  }
): CaseDeadline | null {
  const verified = getDeadlineTemplateByProgramId(template.programId);
  if (!verified || verified.id !== template.id) return null;

  if (
    template.targetConditions?.length &&
    options?.caseProfile &&
    !matchesAllConditions(options.caseProfile, template.targetConditions)
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const { sourceUrl, updatedAt } = resolveSourceMeta(template);
  const dueDate = resolveDueDate(template);

  return {
    id: createDeadlineId(),
    templateId: template.id,
    programId: template.programId,
    procedureId: options?.procedureId,
    relatedActionId: options?.relatedActionId,
    type: template.type,
    label: template.label,
    dueDate,
    sourceUrl,
    updatedAt,
    status: dueDate ? computeDeadlineStatus(dueDate, template.reminderDaysBefore) : "unknown",
    reminderDaysBefore: template.reminderDaysBefore,
    createdAt: now,
  };
}

export function computeDeadlineStatus(
  dueDate: string,
  reminderDaysBefore: number[] = [DUE_SOON_DEFAULT_DAYS],
  referenceDate: Date = new Date()
): CaseDeadlineStatus {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "unknown";

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "overdue";
  const soonThreshold = Math.max(...reminderDaysBefore, DUE_SOON_DEFAULT_DAYS);
  if (diffDays <= soonThreshold) return "due_soon";
  return "upcoming";
}

export function recomputeDeadlineStatuses(
  deadlines: CaseDeadline[],
  referenceDate: Date = new Date()
): CaseDeadline[] {
  const now = referenceDate.toISOString();
  return deadlines.map((d) => {
    if (d.status === "completed") return d;

    const template = getDeadlineTemplateByProgramId(d.programId);
    const dueDate = template ? resolveDueDate(template) : d.dueDate;
    const label = template?.label ?? d.label;
    const sourceUrl = template ? resolveSourceMeta(template).sourceUrl : d.sourceUrl;
    const reminderDaysBefore =
      template?.reminderDaysBefore ?? d.reminderDaysBefore;

    if (!dueDate) {
      return {
        ...d,
        label,
        dueDate: null,
        sourceUrl,
        reminderDaysBefore,
        status: "unknown" as const,
        updatedAt: now,
      };
    }

    return {
      ...d,
      label,
      dueDate,
      sourceUrl,
      reminderDaysBefore,
      status: computeDeadlineStatus(
        dueDate,
        reminderDaysBefore,
        referenceDate
      ),
      updatedAt: now,
    };
  });
}

/** Procedure に紐づく期限を生成（出典なしはスキップ） */
export function generateDeadlinesForProcedure(
  procedure: ExternalProcedure,
  caseProfile?: CaseProfile
): CaseDeadline[] {
  const template = getDeadlineTemplateByProgramId(procedure.relatedProgramId);
  if (!template) return [];

  const deadline = createCaseDeadlineFromTemplate(template, {
    procedureId: procedure.id,
    relatedActionId: procedure.relatedActionId,
    caseProfile,
  });

  return deadline ? [deadline] : [];
}

export function generateDeadlinesForProcedures(
  procedures: ExternalProcedure[],
  caseProfile?: CaseProfile
): CaseDeadline[] {
  const results: CaseDeadline[] = [];
  for (const proc of procedures) {
    results.push(...generateDeadlinesForProcedure(proc, caseProfile));
  }
  return dedupeDeadlinesByProgram(results);
}

function dedupeDeadlinesByProgram(deadlines: CaseDeadline[]): CaseDeadline[] {
  const seen = new Set<string>();
  return deadlines.filter((d) => {
    const key = `${d.programId}:${d.procedureId ?? "none"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** CaseFile に期限をマージ（Procedure 追加・更新時） */
export function mergeDeadlinesIntoCaseFile(
  caseFile: CaseFile,
  newDeadlines: CaseDeadline[],
  caseProfile?: CaseProfile
): CaseDeadline[] {
  const existing = [...(caseFile.deadlines ?? [])];
  for (const next of newDeadlines) {
    const idx = existing.findIndex(
      (d) =>
        d.programId === next.programId &&
        d.procedureId === next.procedureId
    );
    if (idx >= 0) {
      existing[idx] = {
        ...existing[idx],
        ...next,
        id: existing[idx].id,
        createdAt: existing[idx].createdAt,
      };
    } else {
      existing.push(next);
    }
  }

  return recomputeDeadlineStatuses(
    markCompletedDeadlines(existing, caseFile.procedures ?? []),
    new Date()
  );
}

function markCompletedDeadlines(
  deadlines: CaseDeadline[],
  procedures: ExternalProcedure[]
): CaseDeadline[] {
  return deadlines.map((d) => {
    if (!d.procedureId) return d;
    const proc = procedures.find((p) => p.id === d.procedureId);
    if (proc?.status === "completed") {
      return { ...d, status: "completed" as const };
    }
    return d;
  });
}

export function syncDeadlinesAfterProcedureChange(
  caseFile: CaseFile,
  caseProfile?: CaseProfile
): CaseDeadline[] {
  const procedures = caseFile.procedures ?? [];
  const activeOrPreparing = procedures.filter(
    (p) =>
      p.status === "preparing" ||
      p.status === "submitted" ||
      p.status === "waiting_response" ||
      p.status === "not_started"
  );
  const generated = generateDeadlinesForProcedures(
    activeOrPreparing,
    caseProfile
  );
  return mergeDeadlinesIntoCaseFile(caseFile, generated, caseProfile);
}

export interface DeadlineDashboardItem {
  deadline: CaseDeadline;
  programName: string;
  displayText: string;
  daysRemaining?: number;
}

export function getDeadlineStatusLabel(status: CaseDeadlineStatus): string {
  const labels: Record<CaseDeadlineStatus, string> = {
    unknown: "公式で確認",
    upcoming: "余裕あり",
    due_soon: "そろそろ確認",
    overdue: "公式期限を要確認",
    completed: "完了",
  };
  return labels[status];
}

function daysUntil(dueDate: string, ref: Date = new Date()): number | undefined {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return undefined;
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDeadlineDisplay(deadline: CaseDeadline): string {
  if (deadline.status === "unknown" || !deadline.dueDate) {
    return "締切日は市町村の公式で確認（このナビでは決めつけません）";
  }
  const days = daysUntil(deadline.dueDate);
  if (days === undefined) {
    return "締切日は市町村の公式で確認（このナビでは決めつけません）";
  }
  const dueLabel = deadline.dueDate.replace(/-/g, ".");
  if (deadline.status === "overdue") {
    return `${dueLabel}（公式の案内を再確認）`;
  }
  if (deadline.status === "due_soon") {
    return `${dueLabel}ごろまで（目安・あと約${days}日）`;
  }
  return `${dueLabel}ごろまで（目安・あと約${days}日）`;
}

/** ホーム・一覧: 関連する期限を優先度順 */
export function getAllDeadlineDisplays(
  caseFile: CaseFile
): DeadlineDashboardItem[] {
  const deadlines = recomputeDeadlineStatuses(caseFile.deadlines ?? []);
  const priority: CaseDeadlineStatus[] = [
    "overdue",
    "due_soon",
    "upcoming",
    "unknown",
    "completed",
  ];

  const sorted = [...deadlines].sort((a, b) => {
    const pa = priority.indexOf(a.status);
    const pb = priority.indexOf(b.status);
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  return sorted
    .filter((d) => d.status !== "completed")
    .map((deadline) => ({
      deadline,
      programName: deadline.label.split(" ")[0] ?? deadline.label,
      displayText: formatDeadlineDisplay(deadline),
      daysRemaining: deadline.dueDate
        ? daysUntil(deadline.dueDate)
        : undefined,
    }));
}

/** ホーム表示用: 最優先の1件 */
export function getPrimaryDeadlineDisplay(
  caseFile: CaseFile
): DeadlineDashboardItem | null {
  const deadlines = recomputeDeadlineStatuses(caseFile.deadlines ?? []);
  if (deadlines.length === 0) return null;

  const priority: CaseDeadlineStatus[] = [
    "overdue",
    "due_soon",
    "upcoming",
    "unknown",
  ];

  for (const status of priority) {
    const match = deadlines.find((d) => d.status === status);
    if (match) {
      return {
        deadline: match,
        programName: match.label.split(" ")[0] ?? match.label,
        displayText: formatDeadlineDisplay(match),
        daysRemaining: match.dueDate
          ? daysUntil(match.dueDate)
          : undefined,
      };
    }
  }

  return null;
}

/** Recovery Mode: overdue/due_soon に関連する pending Action を先頭へ（並び替えのみ） */
export function prioritizePendingActionsByDeadline(
  caseFile: CaseFile
): CaseAction[] {
  if (caseFile.recoveryPhase?.mode !== "recovery") {
    return caseFile.pendingActions;
  }

  const deadlines = recomputeDeadlineStatuses(caseFile.deadlines ?? []);
  const urgent = deadlines.filter(
    (d) => d.status === "overdue" || d.status === "due_soon"
  );
  if (urgent.length === 0) return caseFile.pendingActions;

  const pending = [...caseFile.pendingActions];
  for (const dl of urgent) {
    let targetIdx = -1;
    if (dl.relatedActionId) {
      targetIdx = pending.findIndex(
        (a) => a.id === dl.relatedActionId && a.status === "todo"
      );
    }
    if (targetIdx < 0) {
      targetIdx = pending.findIndex(
        (a) =>
          a.status === "todo" &&
          a.relatedProgramIds?.includes(dl.programId)
      );
    }
    if (targetIdx > 0) {
      const [action] = pending.splice(targetIdx, 1);
      pending.unshift(action);
      break;
    }
  }

  return pending;
}

export function normalizeDeadlines(raw: unknown): CaseDeadline[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (d): d is CaseDeadline =>
      !!d &&
      typeof d === "object" &&
      typeof (d as CaseDeadline).id === "string" &&
      typeof (d as CaseDeadline).programId === "string"
  );
}
