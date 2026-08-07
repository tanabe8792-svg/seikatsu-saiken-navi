/**
 * Case Timeline — 再建履歴（既存データから派生）
 * docs/18 CaseTimeline
 *
 * 役割分担:
 * - CaseDecision: 内部判断ログ（timeline は phase / 準備優先のみ要約）
 * - Evidence: 生の証跡 → timeline は被災者向け要約
 * - Procedure: 現在状態 → timeline は milestone 要約（履歴は CaseDecision 等と重複させない）
 * - Deadline / RecoveryPhase / ActionQueue: 各ソースからイベント生成
 */

import type { CaseAction, CaseDecision, CaseFile } from "./types";
import type { Evidence } from "./evidence";
import type { ExternalProcedure, ProcedureStatus } from "./procedures";
import { getPrimaryProcedure } from "./procedures";

export type CaseTimelineEventType =
  | "action_completed"
  | "evidence_added"
  | "procedure_started"
  | "procedure_updated"
  | "deadline_created"
  | "decision_recorded"
  | "phase_transition";

export type CaseTimelineEventSource =
  | "action_queue"
  | "evidence"
  | "procedure"
  | "deadline"
  | "decision"
  | "recovery_phase";

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  type: CaseTimelineEventType;
  summary: string;
  relatedIds: string[];
  source: CaseTimelineEventSource;
}

export interface CaseTimelineDashboard {
  pastEvents: CaseTimelineEvent[];
  currentStatus?: string;
  nextActionTitle?: string;
}

const RECENT_PAST_LIMIT = 5;
const RECENT_PAST_MIN = 3;

function simplifyProcedureName(name: string): string {
  return name
    .replace(/（.+）$/, "")
    .replace(/の申請$/, "")
    .replace(/申請$/, "")
    .trim();
}

function findActionById(
  caseFile: CaseFile,
  actionId: string
): CaseAction | undefined {
  return (
    caseFile.completedActions.find((a) => a.id === actionId) ??
    caseFile.pendingActions.find((a) => a.id === actionId)
  );
}

/** 被災者向け Action 完了要約（専門家向け title をそのまま使わない） */
export function formatActionCompletedSummary(action: CaseAction): string {
  const id = action.rwActionId;
  if (id.includes("photo") || action.title.includes("写真")) {
    return "被害写真の確認完了";
  }
  if (action.title.includes("必要書類")) {
    return "必要書類の確認完了";
  }
  if (action.title.includes("罹災証明") || id.includes("cert")) {
    return "罹災証明の準備を進めました";
  }
  if (action.title.includes("保険")) {
    return "保険の連絡を進めました";
  }
  if (action.title.endsWith("する")) {
    return action.title.replace(/する$/, "完了");
  }
  return `${action.title}を完了`;
}

function formatEvidenceSummary(
  evidence: Evidence,
  action?: CaseAction
): string {
  if (evidence.type === "photo") {
    return "被害状況の記録を残しました";
  }
  if (evidence.procedureId) {
    return "手続きの記録を残しました";
  }
  if (action?.title.includes("写真")) {
    return "被害状況の記録を残しました";
  }
  return "確認の記録を残しました";
}

function procedureEventType(
  status: ProcedureStatus
): CaseTimelineEventType | null {
  if (status === "preparing") return "procedure_started";
  if (
    status === "submitted" ||
    status === "waiting_response" ||
    status === "completed" ||
    status === "rejected" ||
    status === "unknown"
  ) {
    return "procedure_updated";
  }
  return null;
}

function formatProcedureSummary(procedure: ExternalProcedure): string | null {
  const name = simplifyProcedureName(procedure.name);
  switch (procedure.status) {
    case "preparing":
      return `${name}の準備を開始`;
    case "submitted":
      return `${name}を提出しました`;
    case "waiting_response":
      return `${name}の結果確認待ち`;
    case "completed":
      return `${name}が完了しました`;
    case "rejected":
      return `${name}の再確認が必要です`;
    case "unknown":
      return `${name}を確認中`;
    default:
      return null;
  }
}

function formatCurrentProcedureStatus(procedure: ExternalProcedure): string {
  const name = simplifyProcedureName(procedure.name);
  switch (procedure.status) {
    case "preparing":
      return `${name}の準備中`;
    case "submitted":
      return `${name}の提出済み・結果待ち`;
    case "waiting_response":
      return `${name}の結果確認待ち`;
    case "completed":
      return `${name}が完了しました`;
    case "rejected":
      return `${name}の再確認が必要です`;
    case "unknown":
      return `${name}を確認中`;
    default:
      return `${name}の状況を確認中`;
  }
}

function formatPhaseSummary(mode: "acute" | "recovery"): string {
  return mode === "recovery"
    ? "生活の立て直しの確認を始めました"
    : "発災直後の対応を開始しました";
}

function formatDecisionSummary(decision: CaseDecision): string | null {
  if (decision.outcome === "document_gap_priority") {
    return "次に準備することを整理しました";
  }
  if (decision.outcome === "phase_transition" && decision.nextPhase) {
    return formatPhaseSummary(decision.nextPhase);
  }
  return null;
}

function eventsFromCompletedActions(caseFile: CaseFile): CaseTimelineEvent[] {
  return caseFile.completedActions
    .filter((a) => a.completedAt)
    .map((action) => ({
      id: `tl-action-${action.id}`,
      caseId: caseFile.caseId,
      timestamp: action.completedAt!,
      type: "action_completed" as const,
      summary: formatActionCompletedSummary(action),
      relatedIds: [action.id],
      source: "action_queue" as const,
    }));
}

function eventsFromEvidences(caseFile: CaseFile): CaseTimelineEvent[] {
  return (caseFile.evidences ?? []).map((evidence) => ({
    id: `tl-evidence-${evidence.id}`,
    caseId: caseFile.caseId,
    timestamp: evidence.createdAt,
    type: "evidence_added" as const,
    summary: formatEvidenceSummary(
      evidence,
      findActionById(caseFile, evidence.actionId)
    ),
    relatedIds: [evidence.id, evidence.actionId],
    source: "evidence" as const,
  }));
}

function eventsFromProcedures(caseFile: CaseFile): CaseTimelineEvent[] {
  const events: CaseTimelineEvent[] = [];
  for (const procedure of caseFile.procedures ?? []) {
    const type = procedureEventType(procedure.status);
    const summary = formatProcedureSummary(procedure);
    if (!type || !summary) continue;

    const timestamp =
      procedure.submittedAt ??
      procedure.updatedAt ??
      caseFile.createdAt;

    events.push({
      id: `tl-procedure-${procedure.id}-${procedure.status}`,
      caseId: caseFile.caseId,
      timestamp,
      type,
      summary,
      relatedIds: [procedure.id],
      source: "procedure",
    });
  }
  return events;
}

function eventsFromDeadlines(caseFile: CaseFile): CaseTimelineEvent[] {
  return (caseFile.deadlines ?? []).map((deadline) => ({
    id: `tl-deadline-${deadline.id}`,
    caseId: caseFile.caseId,
    timestamp: deadline.createdAt,
    type: "deadline_created" as const,
    summary: `${deadline.label}の期限を確認しました`,
    relatedIds: [deadline.id],
    source: "deadline" as const,
  }));
}

function eventsFromDecisions(caseFile: CaseFile): CaseTimelineEvent[] {
  const events: CaseTimelineEvent[] = [];
  for (const [index, decision] of (caseFile.decisions ?? []).entries()) {
    const summary = formatDecisionSummary(decision);
    if (!summary) continue;
    events.push({
      id: `tl-decision-${decision.timestamp}-${index}`,
      caseId: caseFile.caseId,
      timestamp: decision.timestamp,
      type: "decision_recorded" as const,
      summary,
      relatedIds: [decision.selectedActionId],
      source: "decision" as const,
    });
  }
  return events;
}

function eventsFromRecoveryPhase(caseFile: CaseFile): CaseTimelineEvent[] {
  const phase = caseFile.recoveryPhase;
  if (!phase?.enteredAt) return [];
  return [
    {
      id: `tl-phase-${phase.enteredAt}`,
      caseId: caseFile.caseId,
      timestamp: phase.enteredAt,
      type: "phase_transition" as const,
      summary: formatPhaseSummary(phase.mode),
      relatedIds: phase.transitionTriggerIds ?? [],
      source: "recovery_phase" as const,
    },
  ];
}

/** 既存 CaseFile 状態からタイムラインを再構築（冪等） */
export function generateTimelineEventsFromCaseFile(
  caseFile: CaseFile
): CaseTimelineEvent[] {
  const events = [
    ...eventsFromCompletedActions(caseFile),
    ...eventsFromEvidences(caseFile),
    ...eventsFromProcedures(caseFile),
    ...eventsFromDeadlines(caseFile),
    ...eventsFromDecisions(caseFile),
    ...eventsFromRecoveryPhase(caseFile),
  ];

  return events.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function syncCaseTimeline(caseFile: CaseFile): CaseFile {
  return {
    ...caseFile,
    timeline: generateTimelineEventsFromCaseFile(caseFile),
  };
}

export function normalizeTimeline(
  raw: unknown,
  caseFile?: CaseFile
): CaseTimelineEvent[] | undefined {
  if (caseFile) {
    return generateTimelineEventsFromCaseFile(caseFile);
  }
  if (!Array.isArray(raw)) return undefined;
  return raw.filter(
    (e): e is CaseTimelineEvent =>
      e &&
      typeof e === "object" &&
      typeof (e as CaseTimelineEvent).id === "string" &&
      typeof (e as CaseTimelineEvent).summary === "string"
  );
}

function isCurrentProcedureSnapshot(
  event: CaseTimelineEvent,
  primary?: ExternalProcedure | null
): boolean {
  if (!primary) return false;
  if (
    event.type !== "procedure_started" &&
    event.type !== "procedure_updated"
  ) {
    return false;
  }
  return event.id === `tl-procedure-${primary.id}-${primary.status}`;
}

/** ホーム表示用 — 直近の履歴・現在・次 */
export function getCaseTimelineDashboard(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): CaseTimelineDashboard {
  const timeline =
    caseFile.timeline ?? generateTimelineEventsFromCaseFile(caseFile);
  const current =
    currentAction ??
    caseFile.pendingActions.find((a) => a.status === "todo") ??
    caseFile.pendingActions.find((a) => a.status === "doing") ??
    null;
  const primary = getPrimaryProcedure(caseFile, current);

  const currentStatus =
    primary && primary.status !== "not_started"
      ? formatCurrentProcedureStatus(primary)
      : current
        ? `${current.title}を進めています`
        : undefined;

  const sortedDesc = [...timeline].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const pastCandidates = sortedDesc.filter(
    (event) => !isCurrentProcedureSnapshot(event, primary)
  );

  const count = Math.min(
    RECENT_PAST_LIMIT,
    Math.max(RECENT_PAST_MIN, pastCandidates.length)
  );
  const pastEvents = pastCandidates.slice(0, count);

  return {
    pastEvents,
    currentStatus,
    nextActionTitle: current?.title,
  };
}

const COMPLETED_EVENT_TYPES = new Set<CaseTimelineEventType>([
  "action_completed",
  "phase_transition",
  "procedure_started",
]);

/** 被災者向け「完了したこと」— action_completed 中心 */
export function getCompletedItemsForSurvivor(
  caseFile: CaseFile,
  limit = 5
): { summary: string; timestamp: string }[] {
  const timeline =
    caseFile.timeline ?? generateTimelineEventsFromCaseFile(caseFile);

  return [...timeline]
    .filter((e) => COMPLETED_EVENT_TYPES.has(e.type))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit)
    .map((e) => ({ summary: e.summary, timestamp: e.timestamp }));
}

/** 進捗の安心メッセージ — 「少しずつ前に進めている」 */
export function getProgressReassurance(caseFile: CaseFile): string | undefined {
  const completedCount = caseFile.completedActions.length;
  if (completedCount === 0) return undefined;

  if (completedCount === 1) {
    return "少しずつ前に進めています。最初の一歩を終えました。";
  }
  if (completedCount <= 3) {
    return `少しずつ前に進めています。すでに${completedCount}つのステップを終えました。`;
  }
  return `着実に前に進めています。これまでに${completedCount}つのステップを終えました。`;
}

/** currentSituation 用 — 直近の完了要約（③） */
export function getLatestCompletedSummary(
  caseFile: CaseFile
): string | undefined {
  const items = getCompletedItemsForSurvivor(caseFile, 1);
  return items[0]?.summary;
}
