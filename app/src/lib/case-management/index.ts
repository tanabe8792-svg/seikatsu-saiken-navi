/**
 * Case File ライフサイクル — UserProfile から Case 初期化
 */

import type { UserProfile } from "@/lib/types";
import {
  buildCaseProfileFromUserProfile,
  profileToCaseProfileExtras,
} from "@/lib/j00-hearing";
import {
  createCaseFile,
  generateActionQueue,
  getCurrentAction,
  getCaseProgress,
  refreshActionQueueForPhase,
} from "./action-queue";
import {
  applyRecoveryPhaseTransition,
  createInitialRecoveryPhase,
} from "./recovery-phase";
import { generateProceduresForActions } from "./procedures";
import { syncCaseTimeline } from "./case-timeline";
import type { CaseFile, FamilyAttributes } from "./types";

export function extractFamilyAttributes(
  profile: UserProfile
): FamilyAttributes {
  return {
    hasChildren: profile.hasChildren,
    hasElderly: profile.hasElderly,
    hasPet: profile.hasPet,
    isSelfEmployed: profile.isSelfEmployed,
  };
}

/** J-00 完了時に Case File を新規作成 */
export function initializeCaseFromProfile(
  profile: UserProfile,
  existingCase?: CaseFile
): CaseFile {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const familyAttributes = extractFamilyAttributes(profile);
  const recoveryPhase = createInitialRecoveryPhase(profile, caseProfile);

  return createCaseFile(caseProfile, familyAttributes, {
    existing: existingCase,
    userProfile: profile,
    recoveryPhase,
  });
}

/** 保存済みセッションが発災直後フェーズのままなら生活再建フェーズへ移行 */
export function migrateCaseFileToRecoveryPhase(
  caseFile: CaseFile,
  profile: UserProfile
): CaseFile {
  if (caseFile.recoveryPhase?.mode !== "acute") {
    return caseFile;
  }

  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const familyAttributes = extractFamilyAttributes(profile);
  let updated = applyRecoveryPhaseTransition(
    caseFile,
    caseProfile,
    familyAttributes
  );
  updated = refreshActionQueueForPhase(updated, caseProfile, "recovery");
  return updated;
}

/** プロファイル変更時に Action Queue を再生成（完了済みは保持） */
export function refreshCaseFile(
  profile: UserProfile,
  existing: CaseFile
): CaseFile {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const familyAttributes = extractFamilyAttributes(profile);
  const phaseMode = existing.recoveryPhase?.mode ?? "recovery";
  const { actions, activeJourney, riskScore } = generateActionQueue(
    caseProfile,
    familyAttributes,
    { phaseMode }
  );

  const completedIds = new Set(existing.completedActions.map((a) => a.id));
  const pendingActions = actions
    .filter((a) => !completedIds.has(a.id))
    .map((a) => ({ ...a, status: "todo" as const }));

  const existingProcIds = new Set(
    (existing.procedures ?? []).map((p) => p.relatedProgramId)
  );
  const newProcedures = generateProceduresForActions(actions).filter(
    (p) => !existingProcIds.has(p.relatedProgramId)
  );

  return syncCaseTimeline({
    ...existing,
    updatedAt: new Date().toISOString(),
    municipalityCode: caseProfile.municipalityCode,
    municipalityName: caseProfile.municipalityName ?? profile.municipality,
    damageLevel: caseProfile.damageLevel,
    housingTenure: caseProfile.housingTenure,
    familyAttributes,
    activeJourney,
    pendingActions,
    procedures: [...(existing.procedures ?? []), ...newProcedures],
    riskScore,
    recoveryPhase:
      existing.recoveryPhase ??
      createInitialRecoveryPhase(profile, caseProfile),
    status: pendingActions.length > 0 ? "active" : existing.status,
  });
}

export {
  getCurrentAction,
  getCaseProgress,
  generateActionQueue,
  completeCaseAction,
  addEvidenceToCaseFile,
  getTriggerIdsFromCaseFile,
  createCaseFile,
  refreshActionQueueForPhase,
  formatActionFriendlyReason,
  formatActionCompanionHeadline,
} from "./action-queue";
export type {
  CaseFile,
  FamilyAttributes,
  CompleteActionResult,
  RecoveryPhase,
  RecoveryPhaseMode,
  CaseDeadline,
  CaseDeadlineStatus,
} from "./types";
export {
  createEvidence,
  createDefaultPhotoEvidence,
  getActionCompletionUIState,
  hasSubmittedEvidence,
  requiresEvidence,
  normalizeEvidences,
} from "./evidence";
export type {
  Evidence,
  EvidenceInput,
  CompletionRule,
  EvidenceType,
} from "./evidence";
export {
  getProcedureDashboardState,
  getPrimaryProcedure,
  getProcedureStatusLabel,
  getProcedureStatusPlainExplanation,
  getProcedureStatusMessage,
  generateProceduresForActions,
  createDefaultCertificateEvidence,
  normalizeProcedures,
  PROCEDURE_TEMPLATES,
} from "./procedures";
export type {
  ExternalProcedure,
  ProcedureStatus,
  ProcedureType,
  ProcedureDashboardState,
  ProcedureTemplate,
  ProcedureRequiredEvidence,
} from "./procedures";
export {
  PROCEDURE_DEPENDENCIES,
  areProcedurePrerequisitesMet,
  getDependencyForProgram,
  isPrerequisiteSatisfied,
} from "./procedure-dependencies";
export type { ProcedureDependency } from "./procedure-dependencies";
export {
  buildActionDecisionExplanation,
  explanationIncludesTrigger,
  explanationReasonIncludes,
  buildSurvivorGuidanceSummary,
  buildSurvivorFriendlyExplanation,
} from "./decision-explanation";
export type {
  ActionDecisionExplanation,
  ExplanationCondition,
  ExplanationProgram,
  ExplanationSource,
  SurvivorFriendlyExplanation,
} from "./decision-explanation";
export {
  createInitialRecoveryPhase,
  getRecoveryPhaseLabel,
  normalizeRecoveryPhase,
  shouldTransitionToRecovery,
  applyRecoveryPhaseTransition,
  canUserStartRecoveryPhase,
  applyUserRecoveryPhaseTransition,
  USER_RECOVERY_START_TRIGGER,
} from "./recovery-phase";
export {
  getRecoveryPhaseDisplay,
  getAcuteExternalLinksForRecovery,
  getProcedureOverview,
  getFriendlyProcedureStatusLabel,
  buildCurrentSituation,
  getSurvivorSituationDashboard,
} from "./recovery-dashboard";
export type {
  RecoveryPhaseDisplay,
  AcuteExternalLink,
  ProcedureOverviewItem,
  SurvivorSituationDashboard,
  SurvivorNextActionDisplay,
  SurvivorAttentionItem,
} from "./recovery-dashboard";
export {
  getPrimaryDeadlineDisplay,
  getAllDeadlineDisplays,
  formatDeadlineDisplay,
  formatDisasterRelativeDeadline,
  getDeadlineTemplateNote,
  daysSinceDisaster,
  getDeadlineStatusLabel,
  syncDeadlinesAfterProcedureChange,
  normalizeDeadlines,
  prioritizePendingActionsByDeadline,
} from "./deadlines";
export {
  syncDocumentRecords,
  normalizeDocumentRecords,
  getDocumentRecordsForProgram,
  getSubmittedDocumentRecords,
  markDocumentPrepared,
  isDocumentPrepDone,
  areProgramPrepItemsDone,
} from "./document-records";
export type {
  DocumentRecord,
  DocumentRecordStatus,
  DocumentRecordSource,
} from "./document-records";
export type {
  DocumentRequirement,
  RequirementKbStatus,
  DocumentCategory,
} from "./document-requirements";
export {
  getRequirementsForProgram,
  getRequirementsForCasePrograms,
} from "./document-requirements";
export {
  analyzeNextPreparation,
  getRebuildStatusDashboard,
  prioritizePendingActionsByDocumentGap,
  maybeAppendDocumentGapDecision,
  getDocumentGapNoteForAction,
} from "./document-gap";
export type {
  NextPreparationItem,
  RebuildStatusDashboard,
} from "./document-gap";
export {
  generateTimelineEventsFromCaseFile,
  syncCaseTimeline,
  getCaseTimelineDashboard,
  formatActionCompletedSummary,
  normalizeTimeline,
  getCompletedItemsForSurvivor,
  getProgressReassurance,
  getLatestCompletedSummary,
} from "./case-timeline";
export type {
  CaseTimelineEvent,
  CaseTimelineEventType,
  CaseTimelineEventSource,
  CaseTimelineDashboard,
} from "./case-timeline";
export {
  validateSurvivorScenarioFlow,
  assertSurvivorScenarioUxQuality,
  runAllSurvivorScenarioValidations,
  formatSurvivorScenarioReport,
} from "./validation-survivor-scenarios";
export type {
  SurvivorScenarioValidationResult,
  SurvivorScenarioPhaseResult,
} from "./validation-survivor-scenarios";
export {
  buildContinuitySnapshot,
  computeChangesSinceSnapshot,
  formatContinuityDeadlineMessage,
  getContinuityDashboard,
  attachContinuitySnapshot,
} from "./continuity-dashboard";
export type {
  ContinuityChangeItem,
  ContinuityChangeKind,
  ContinuityDashboard,
  ContinuityDeadlineNote,
} from "./continuity-dashboard";
export {
  getActionWalkthrough,
  getCompletedWalkthroughSteps,
  setWalkthroughStepComplete,
  areAllWalkthroughStepsDone,
} from "./action-walkthrough";
export type {
  ActionWalkthrough,
  WalkthroughStep,
  WalkthroughPrepItem,
} from "./action-walkthrough";
export {
  resolvePrepChecklist,
  areResolvedPrepItemsDone,
} from "./walkthrough-prep";
export type { ResolvedPrepItem } from "./walkthrough-prep";

export {
  runAllContinuityUxValidations,
  formatContinuityUxReport,
} from "./validation-continuity-ux";
export {
  lintSurvivorJapanese,
  assertSurvivorJapaneseQuality,
  formatSituationNextStep,
  formatSituationOpeningStep,
} from "./survivor-copy-quality";
export {
  validateSurvivorCopyQuality,
  formatSurvivorCopyReport,
  runSurvivorCopyValidation,
} from "./validation-survivor-copy";
export type { ContinuityUxValidationResult } from "./validation-continuity-ux";

/** @deprecated CaseWorkerSummary 互換 — Case File から生成 */
export function caseFileToLegacySummary(caseFile: CaseFile) {
  const current = getCurrentAction(caseFile);
  const next = caseFile.pendingActions.find(
    (a) => a.status === "todo" && a.id !== current?.id
  );

  if (!current) return undefined;

  return {
    priorityJourney: caseFile.activeJourney,
    primaryAction: {
      title: current.title,
      message: caseFile.workerMessage ?? current.reason,
      triggerId: current.sourceTriggerIds[0] ?? current.id,
    },
    nextAction: next
      ? {
          title: next.title,
          message: next.reason,
          triggerId: next.sourceTriggerIds[0] ?? next.id,
        }
      : undefined,
    generatedAt: caseFile.updatedAt,
  };
}

export { profileToCaseProfileExtras };
