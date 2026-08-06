/**
 * 判断説明 UI — Action 優先理由の組み立て
 * 推測禁止: Trigger / KB / CaseDecision / Procedure / Evidence のみ参照
 */

import { evaluateTriggers } from "@/lib/knowledge/triggers";
import { getSupportProgramById } from "@/lib/knowledge/support-programs";
import type { CaseProfile, CaseTrigger, SupportProgram } from "@/lib/knowledge/types";
import type { UserProfile } from "@/lib/types";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import { softenSurvivorDisplayText } from "./action-queue";
import { getEvidenceStatusForAction } from "./evidence";
import { getPrimaryProcedure, getProcedureStatusLabel } from "./procedures";
import type { CaseAction, CaseDecision, CaseFile } from "./types";
import { getDocumentGapNoteForAction } from "./document-gap";

export interface ExplanationCondition {
  triggerId: string;
  label: string;
  detail: string;
}

export interface ExplanationProgram {
  id: string;
  name: string;
  description?: string;
  sourceUrl: string | null;
  updatedAt: string;
}

export interface ExplanationSource {
  label: string;
  sourceUrl: string;
  updatedAt?: string;
}

export interface ActionDecisionExplanation {
  actionId: string;
  actionTitle: string;
  /** 今やる理由（Trigger.message または CaseDecision.reason） */
  primaryReason: string;
  /** 優先条件（マッチした Trigger） */
  conditions: ExplanationCondition[];
  /** 関連支援制度（KB） */
  relatedPrograms: ExplanationProgram[];
  /** 出典（sourceUrl があるもののみ） */
  sources: ExplanationSource[];
  decisionTimestamp?: string;
  confidence?: CaseDecision["confidence"];
  procedureNote?: string;
  evidenceNote?: string;
  /** 次に準備するもの（docs/17） */
  documentGapNote?: string;
}

const INVALID_SOURCE = new Set(["確認不可", ""]);

function isValidSourceUrl(url?: string | null): url is string {
  return !!url && !INVALID_SOURCE.has(url);
}

function findLatestSelectionDecision(
  caseFile: CaseFile,
  actionId: string
): CaseDecision | undefined {
  return [...caseFile.decisions]
    .reverse()
    .find((d) => d.selectedActionId === actionId && d.outcome === "selected");
}

function triggerMatchesAction(trigger: CaseTrigger, action: CaseAction): boolean {
  if (action.sourceTriggerIds.includes(trigger.id)) return true;
  return action.sourceTriggerIds.some(
    (id) => trigger.id.endsWith(id) || id.endsWith(trigger.id.replace("TRIGGER-ALERT-", ""))
  );
}

function collectMatchedTriggers(
  action: CaseAction,
  allTriggers: CaseTrigger[]
): CaseTrigger[] {
  const matched = allTriggers.filter((t) => triggerMatchesAction(t, action));
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return matched.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

function collectProgramIds(
  action: CaseAction,
  matchedTriggers: CaseTrigger[]
): string[] {
  const ids = new Set<string>();
  for (const id of action.relatedProgramIds ?? []) ids.add(id);
  for (const t of matchedTriggers) {
    for (const id of t.relatedProgramIds ?? []) ids.add(id);
  }
  return [...ids];
}

function toExplanationProgram(program: SupportProgram): ExplanationProgram {
  return {
    id: program.id,
    name: program.name,
    description: program.description,
    sourceUrl: isValidSourceUrl(program.sourceUrl) ? program.sourceUrl : null,
    updatedAt: program.updatedAt,
  };
}

function buildSources(programs: ExplanationProgram[]): ExplanationSource[] {
  const seen = new Set<string>();
  const sources: ExplanationSource[] = [];
  for (const p of programs) {
    if (!p.sourceUrl || seen.has(p.sourceUrl)) continue;
    seen.add(p.sourceUrl);
    sources.push({
      label: p.name,
      sourceUrl: p.sourceUrl,
      updatedAt: p.updatedAt !== "確認不可" ? p.updatedAt : undefined,
    });
  }
  return sources;
}

function buildEvidenceNote(
  caseFile: CaseFile,
  action: CaseAction
): string | undefined {
  const status = getEvidenceStatusForAction(caseFile, action);
  if (status === "not_required") return undefined;
  if (status === "none") {
    return "後の支援手続きで使う記録を、一緒に残しましょう。";
  }
  if (status === "submitted" || status === "verified") {
    return "証跡が記録されています。";
  }
  if (status === "rejected") {
    return "証跡に不備があります。再提出が必要です。";
  }
  return undefined;
}

function buildProcedureNote(
  caseFile: CaseFile,
  action: CaseAction
): string | undefined {
  const procedure = getPrimaryProcedure(caseFile, action);
  if (!procedure) return undefined;
  if (
    procedure.relatedActionId !== action.id &&
    !action.relatedProgramIds?.includes(procedure.relatedProgramId)
  ) {
    return undefined;
  }
  return `関連手続き「${procedure.name}」: ${getProcedureStatusLabel(procedure.status)}`;
}

/** CaseFile + Action から判断説明を組み立て（推測なし） */
export function buildActionDecisionExplanation(
  caseFile: CaseFile,
  action: CaseAction,
  profile: UserProfile
): ActionDecisionExplanation {
  const caseProfile: CaseProfile = buildCaseProfileFromUserProfile(profile);
  const { triggers } = evaluateTriggers(caseProfile);
  const matchedTriggers = collectMatchedTriggers(action, triggers);
  const decision = findLatestSelectionDecision(caseFile, action.id);

  const primaryReason =
    matchedTriggers[0]?.message ??
    decision?.reason ??
    action.reason;

  const conditions: ExplanationCondition[] = matchedTriggers.map((t) => ({
    triggerId: t.id,
    label: t.title,
    detail: t.message,
  }));

  const programIds = collectProgramIds(action, matchedTriggers);
  const relatedPrograms = programIds
    .map((id) => getSupportProgramById(id))
    .filter((p): p is SupportProgram => !!p)
    .map(toExplanationProgram);

  return {
    actionId: action.id,
    actionTitle: action.title,
    primaryReason,
    conditions,
    relatedPrograms,
    sources: buildSources(relatedPrograms),
    decisionTimestamp: decision?.timestamp,
    confidence: decision?.confidence,
    procedureNote: buildProcedureNote(caseFile, action),
    evidenceNote: buildEvidenceNote(caseFile, action),
    documentGapNote: getDocumentGapNoteForAction(caseFile, action),
  };
}

/** 検証用: 説明に特定 Trigger ID が含まれるか */
export function explanationIncludesTrigger(
  explanation: ActionDecisionExplanation,
  triggerId: string
): boolean {
  return explanation.conditions.some((c) => c.triggerId === triggerId);
}

/** 検証用: primaryReason にキーワードが含まれるか（Trigger.message 由来） */
export function explanationReasonIncludes(
  explanation: ActionDecisionExplanation,
  keyword: string
): boolean {
  return explanation.primaryReason.includes(keyword);
}

const SURVIVOR_FORBIDDEN_IN_OUTPUT = [
  "CaseDecision",
  "Trigger",
  "ProcedureStatus",
  "Evidence",
  "RW Action",
  "証跡",
];

function sanitizeSurvivorText(text: string): string {
  return softenSurvivorDisplayText(
    text
      .replace(/証跡/g, "記録")
      .replace(/Procedure/g, "手続き")
      .replace(/Evidence/g, "記録")
  );
}

/** 被災者向け「なぜこの案内？」— 1段落 */
export function buildSurvivorGuidanceSummary(
  explanation: ActionDecisionExplanation
): string {
  const parts: string[] = [];
  const reason = sanitizeSurvivorText(explanation.primaryReason);
  parts.push(reason);

  if (explanation.documentGapNote) {
    parts.push(sanitizeSurvivorText(explanation.documentGapNote));
  } else if (explanation.procedureNote) {
    const note = explanation.procedureNote
      .replace(/関連手続き「/g, "")
      .replace(/」: /g, "は")
      .replace(/申請準備中/g, "準備中")
      .replace(/結果待ち/g, "結果の連絡待ち");
    parts.push(sanitizeSurvivorText(note));
  }

  if (explanation.evidenceNote) {
    parts.push(sanitizeSurvivorText(explanation.evidenceNote));
  }

  return parts.join(" ");
}

export interface SurvivorFriendlyExplanation {
  whyThisGuidance: string;
  relatedSupportNames: string[];
  hasSources: boolean;
}

/** 判断説明の被災者向け整形（内部 Trigger ID は含めない） */
export function buildSurvivorFriendlyExplanation(
  explanation: ActionDecisionExplanation
): SurvivorFriendlyExplanation {
  const whyThisGuidance = buildSurvivorGuidanceSummary(explanation);
  return {
    whyThisGuidance,
    relatedSupportNames: explanation.relatedPrograms.map((p) => p.name),
    hasSources: explanation.sources.length > 0,
  };
}
