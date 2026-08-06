/**
 * 継続利用 UX — 再訪時伴走（docs/21）
 * CaseTimeline / SurvivorDashboard 読み取り専用。CaseFile 非変更。
 */

import { getCurrentAction } from "./action-queue";
import type { CaseDeadline, CaseDeadlineStatus } from "./deadlines";
import {
  formatDisasterRelativeDeadline,
  getPrimaryDeadlineDisplay,
} from "./deadlines";
import {
  generateTimelineEventsFromCaseFile,
  type CaseTimelineEvent,
} from "./case-timeline";
import { getPrimaryProcedure, type ProcedureStatus } from "./procedures";
import {
  getSurvivorSituationDashboard,
  type SurvivorAttentionItem,
  type SurvivorNextActionDisplay,
} from "./recovery-dashboard";
import type { CaseAction, CaseFile } from "./types";
import type { ContinuitySnapshot, UserProfile } from "@/lib/types";

export type ContinuityChangeKind =
  | "timeline_new"
  | "procedure_progress"
  | "action_completed";

export interface ContinuityChangeItem {
  summary: string;
  kind: ContinuityChangeKind;
}

export interface ContinuityDeadlineNote {
  label: string;
  message: string;
  status: CaseDeadlineStatus;
  deadlineId: string;
  displayText: string;
  relativeText: string;
  sourceUrl?: string;
}

export interface ContinuityDashboard {
  sectionTitle: string;
  changesSinceLastVisit: ContinuityChangeItem[];
  currentSituation: string;
  situationContext?: string;
  nextAction: SurvivorNextActionDisplay;
  progressReassurance?: string;
  completedItems: { summary: string }[];
  deadlineNote?: ContinuityDeadlineNote;
  needsAttention: SurvivorAttentionItem[];
  whyThisGuidance: string;
  relatedSupportNames: string[];
  hasExplanationSources: boolean;
}

const CONTINUITY_DEADLINE_STATUSES = new Set<CaseDeadlineStatus>([
  "overdue",
  "due_soon",
  "unknown",
]);

const FORBIDDEN_DEADLINE_PATTERNS = [/あと\d+日/, /過ぎています/];

function simplifyProcedureName(name: string): string {
  return name
    .replace(/（.+）$/, "")
    .replace(/の申請$/, "")
    .replace(/申請$/, "")
    .trim();
}

function procedureProgressSummary(
  name: string,
  status: ProcedureStatus
): string | null {
  const short = simplifyProcedureName(name);
  switch (status) {
    case "preparing":
      return `${short}の準備を進めています`;
    case "submitted":
      return `${short}を提出しました`;
    case "waiting_response":
      return `${short}の結果確認待ちです`;
    case "completed":
      return `${short}が完了しました`;
    default:
      return null;
  }
}

/** 伴走トーン期限文言（deadlines.ts formatDeadlineDisplay は変更しない） */
export function formatContinuityDeadlineMessage(
  deadline: CaseDeadline
): string {
  switch (deadline.status) {
    case "unknown":
      return `${deadline.label}について、確認しておく期限があります`;
    case "due_soon":
      return `${deadline.label}について、早めに確認しておくと安心です`;
    case "overdue":
      return `${deadline.label}について、期限を確認しておきましょう`;
    default:
      return "";
  }
}

export function buildContinuitySnapshot(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ContinuitySnapshot {
  const current =
    currentAction ??
    getCurrentAction(caseFile) ??
    caseFile.pendingActions.find((a) => a.status === "todo") ??
    null;
  const timeline =
    caseFile.timeline ?? generateTimelineEventsFromCaseFile(caseFile);
  const primary = getPrimaryProcedure(caseFile, current);

  return {
    capturedAt: new Date().toISOString(),
    timelineEventIds: timeline.map((e) => e.id),
    primaryProcedureId: primary?.id,
    primaryProcedureStatus: primary?.status,
    currentActionId: current?.id,
    completedActionCount: caseFile.completedActions.length,
  };
}

function computeTimelineChanges(
  snapshot: ContinuitySnapshot,
  timeline: CaseTimelineEvent[]
): ContinuityChangeItem[] {
  const known = new Set(snapshot.timelineEventIds);
  return timeline
    .filter((e) => !known.has(e.id))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5)
    .map((e) => ({
      summary: e.summary,
      kind:
        e.type === "action_completed"
          ? ("action_completed" as const)
          : ("timeline_new" as const),
    }));
}

function computeProcedureChange(
  snapshot: ContinuitySnapshot,
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ContinuityChangeItem | null {
  const primary = getPrimaryProcedure(caseFile, currentAction ?? null);
  if (!primary || primary.id !== snapshot.primaryProcedureId) {
    if (primary && primary.status !== "not_started") {
      const summary = procedureProgressSummary(primary.name, primary.status);
      if (summary) {
        return { summary, kind: "procedure_progress" };
      }
    }
    return null;
  }
  if (primary.status === snapshot.primaryProcedureStatus) return null;
  const summary = procedureProgressSummary(primary.name, primary.status);
  if (!summary) return null;
  return { summary, kind: "procedure_progress" };
}

/** 前回スナップショットとの差分（表示専用） */
export function computeChangesSinceSnapshot(
  snapshot: ContinuitySnapshot | undefined,
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ContinuityChangeItem[] {
  if (!snapshot) return [];

  const timeline =
    caseFile.timeline ?? generateTimelineEventsFromCaseFile(caseFile);
  const changes: ContinuityChangeItem[] = [
    ...computeTimelineChanges(snapshot, timeline),
  ];

  const procChange = computeProcedureChange(snapshot, caseFile, currentAction);
  if (procChange) {
    const dup = changes.some((c) => c.summary === procChange.summary);
    if (!dup) changes.push(procChange);
  }

  if (
    caseFile.completedActions.length > snapshot.completedActionCount &&
    changes.length === 0
  ) {
    const latest = [...caseFile.completedActions]
      .reverse()
      .find((a) => a.completedAt);
    if (latest) {
      changes.push({
        summary: `${latest.title}を進めました`,
        kind: "action_completed",
      });
    }
  }

  return changes.slice(0, 5);
}

function buildContinuityDeadlineNote(
  caseFile: CaseFile
): ContinuityDeadlineNote | undefined {
  const display = getPrimaryDeadlineDisplay(caseFile);
  if (!display) return undefined;
  if (!CONTINUITY_DEADLINE_STATUSES.has(display.deadline.status)) {
    return undefined;
  }

  const message = formatContinuityDeadlineMessage(display.deadline);
  if (!message) return undefined;

  for (const pattern of FORBIDDEN_DEADLINE_PATTERNS) {
    if (pattern.test(message)) return undefined;
  }

  return {
    label: display.deadline.label,
    message,
    status: display.deadline.status,
    deadlineId: display.deadline.id,
    displayText: display.displayText,
    relativeText: formatDisasterRelativeDeadline(display.deadline),
    sourceUrl: display.deadline.sourceUrl || undefined,
  };
}

/** 再訪ホーム用 ViewModel */
export function getContinuityDashboard(
  caseFile: CaseFile,
  profile: UserProfile,
  snapshot?: ContinuitySnapshot
): ContinuityDashboard {
  const current = getCurrentAction(caseFile)!;
  const survivor = getSurvivorSituationDashboard(caseFile, current, profile);
  const changes = computeChangesSinceSnapshot(snapshot, caseFile, current);
  const changeSummaries = new Set(changes.map((c) => c.summary));

  const deadlineNote = buildContinuityDeadlineNote(caseFile);

  const needsAttention = survivor.needsAttention.filter(
    (item) => item.kind !== "deadline"
  );

  const completedItems = survivor.completedItems.filter(
    (item) => !changeSummaries.has(item.summary)
  );

  const progressReassurance =
    changes.length > 0 ? undefined : survivor.progressReassurance;

  return {
    sectionTitle: "あなたの再建状況",
    changesSinceLastVisit: changes,
    currentSituation: survivor.currentSituation,
    situationContext: survivor.situationContext,
    nextAction: survivor.nextAction,
    progressReassurance,
    completedItems,
    deadlineNote,
    needsAttention,
    whyThisGuidance: survivor.whyThisGuidance,
    relatedSupportNames: survivor.relatedSupportNames,
    hasExplanationSources: survivor.hasExplanationSources,
  };
}

export function attachContinuitySnapshot(session: {
  caseFile?: CaseFile;
  continuitySnapshot?: ContinuitySnapshot;
}): ContinuitySnapshot | undefined {
  if (!session.caseFile) return session.continuitySnapshot;
  const current = getCurrentAction(session.caseFile);
  if (!current) return session.continuitySnapshot;
  return buildContinuitySnapshot(session.caseFile, current);
}
