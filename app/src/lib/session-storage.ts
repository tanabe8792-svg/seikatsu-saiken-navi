import type { UserSession } from "./types";
import type { CaseAction, CaseFile } from "./case-management/types";
import { normalizeEvidences } from "./case-management/evidence";
import { normalizeProcedures } from "./case-management/procedures";
import { normalizeRecoveryPhase } from "./case-management/recovery-phase";
import { normalizeDeadlines } from "./case-management/deadlines";
import { normalizeDocumentRecords } from "./case-management/document-records";
import { migrateCaseFileToRecoveryPhase } from "./case-management/index";
import { syncCaseTimeline } from "./case-management/case-timeline";
import { STORAGE_KEY } from "./types";

function normalizeCaseAction(raw: CaseAction): CaseAction {
  return {
    ...raw,
    completionRule:
      raw.completionRule ??
      (raw.evidenceRequired ? "EVIDENCE_REQUIRED" : "SELF_CONFIRM"),
  };
}

function normalizeCaseFile(raw: unknown): CaseFile | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as CaseFile;
  if (typeof c.caseId !== "string") return undefined;
  const base: CaseFile = {
    ...c,
    pendingActions: Array.isArray(c.pendingActions)
      ? c.pendingActions.map(normalizeCaseAction)
      : [],
    completedActions: Array.isArray(c.completedActions)
      ? c.completedActions.map(normalizeCaseAction)
      : [],
    decisions: Array.isArray(c.decisions) ? c.decisions : [],
    evidences: normalizeEvidences(c.evidences),
    procedures: normalizeProcedures(c.procedures),
    recoveryPhase: normalizeRecoveryPhase(c.recoveryPhase, c.createdAt),
    deadlines: normalizeDeadlines(c.deadlines),
    documentRecords: normalizeDocumentRecords(c.documentRecords),
    familyAttributes: c.familyAttributes ?? {},
  };
  return syncCaseTimeline(base);
}

export function createEmptySession(): UserSession {
  return {
    profile: {},
    actions: [],
    chatHistory: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSession(session: UserSession): UserSession {
  const profile = session.profile ?? {};
  const normalizedCaseFile = normalizeCaseFile(session.caseFile);
  const caseFile =
    normalizedCaseFile && Object.keys(profile).length > 0
      ? migrateCaseFileToRecoveryPhase(normalizedCaseFile, profile)
      : normalizedCaseFile;

  return {
    profile,
    actions: Array.isArray(session.actions) ? session.actions : [],
    chatHistory: Array.isArray(session.chatHistory) ? session.chatHistory : [],
    updatedAt: session.updatedAt ?? new Date().toISOString(),
    j00Step:
      typeof session.j00Step === "number" &&
      session.j00Step >= 1 &&
      session.j00Step <= 5
        ? session.j00Step
        : undefined,
    caseWorkerSummary: session.caseWorkerSummary,
    caseFile,
    showPostJ00Welcome:
      session.showPostJ00Welcome === true ? true : undefined,
    onboardingTimingHint:
      session.onboardingTimingHint === "acute" ||
      session.onboardingTimingHint === "weeks" ||
      session.onboardingTimingHint === "months" ||
      session.onboardingTimingHint === "partial"
        ? session.onboardingTimingHint
        : undefined,
    continuitySnapshot: normalizeContinuitySnapshot(session.continuitySnapshot),
  };
}

function normalizeContinuitySnapshot(
  raw: UserSession["continuitySnapshot"]
): UserSession["continuitySnapshot"] {
  if (!raw || typeof raw !== "object") return undefined;
  if (typeof raw.capturedAt !== "string") return undefined;
  return {
    capturedAt: raw.capturedAt,
    timelineEventIds: Array.isArray(raw.timelineEventIds)
      ? raw.timelineEventIds.filter((id): id is string => typeof id === "string")
      : [],
    primaryProcedureId:
      typeof raw.primaryProcedureId === "string"
        ? raw.primaryProcedureId
        : undefined,
    primaryProcedureStatus:
      typeof raw.primaryProcedureStatus === "string"
        ? raw.primaryProcedureStatus
        : undefined,
    currentActionId:
      typeof raw.currentActionId === "string" ? raw.currentActionId : undefined,
    completedActionCount:
      typeof raw.completedActionCount === "number"
        ? raw.completedActionCount
        : 0,
  };
}

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadSessionFromStorage(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw) as UserSession);
  } catch {
    return null;
  }
}

export function saveSessionToStorage(session: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeSession(session))
  );
}
