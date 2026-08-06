/**
 * Recovery Phase — ホームダッシュボード表示用
 */

import { REGIONAL_ALERTS } from "@/lib/knowledge/alerts";
import { resolveMunicipalityCode } from "@/lib/knowledge/municipalities";
import { getCaseActionDetailPath } from "@/lib/navigation";
import { formatSituationOpeningStep } from "./survivor-copy-quality";
import type { UserProfile } from "@/lib/types";
import {
  formatActionCompanionHeadline,
  formatActionCompanionDescription,
  formatActionFriendlyReason,
  formatCaseSituation,
} from "./action-queue";
import { getActionWalkthrough } from "./action-walkthrough";
import {
  buildActionDecisionExplanation,
  buildSurvivorFriendlyExplanation,
} from "./decision-explanation";
import {
  getCompletedItemsForSurvivor,
  getLatestCompletedSummary,
  getProgressReassurance,
} from "./case-timeline";
import { analyzeNextPreparation, consolidatePreparationMessages } from "./document-gap";
import {
  getPrimaryDeadlineDisplay,
} from "./deadlines";
import type { CaseAction, CaseFile, RecoveryPhaseMode } from "./types";
import {
  getPrimaryProcedure,
  getProcedureStatusLabel,
  type ExternalProcedure,
  type ProcedureStatus,
} from "./procedures";

export interface RecoveryPhaseDisplay {
  title: string;
  subtitle: string;
}

export interface AcuteExternalLink {
  label: string;
  description: string;
  sourceUrl: string;
  updatedAt: string;
}

export interface ProcedureOverviewItem {
  name: string;
  statusLabel: string;
  hint?: string;
  isPrimary: boolean;
}

const PROCEDURE_HINT: Partial<Record<ProcedureStatus, string>> = {
  not_started: "まだ申請していない",
  preparing: "申請の準備中",
  submitted: "申請済み",
  waiting_response: "結果の連絡待ち",
};

export interface SurvivorAttentionItem {
  message: string;
  kind: "deadline" | "waiting" | "preparation";
  href?: string;
}

export interface SurvivorNextActionDisplay {
  title: string;
  headline: string;
  description: string;
  friendlyReason: string;
}

export interface SurvivorSituationDashboard {
  /** ①〜④ 優先順位で組み立てた伴走メッセージ */
  currentSituation: string;
  /** 地理・被害などの状況ラベル */
  situationContext?: string;
  completedItems: { summary: string }[];
  progressReassurance?: string;
  nextAction: SurvivorNextActionDisplay;
  needsAttention: SurvivorAttentionItem[];
  whyThisGuidance: string;
  relatedSupportNames: string[];
  hasExplanationSources: boolean;
}

function simplifyProcedureName(name: string): string {
  return name
    .replace(/（.+）$/, "")
    .replace(/の申請$/, "")
    .replace(/申請$/, "")
    .trim();
}

/** 被災者向け手続き状態ラベル */
export function getFriendlyProcedureStatusLabel(
  status: ProcedureStatus
): string {
  const labels: Partial<Record<ProcedureStatus, string>> = {
    not_started: "まだ申請していない",
    preparing: "申請の準備中",
    submitted: "申請済み",
    waiting_response: "結果の連絡待ち",
    completed: "手続き完了",
    rejected: "再確認が必要",
    unknown: "確認中",
  };
  return labels[status] ?? getProcedureStatusLabel(status);
}

function buildPhaseOpening(mode: RecoveryPhaseMode): string {
  if (mode === "recovery") {
    return "生活再建フェーズです。";
  }
  return "発災直後の対応フェーズです。安全確保を最優先に進めています。";
}

function buildProcedureSituationPhrase(
  procedure: ExternalProcedure
): string | null {
  const name = simplifyProcedureName(procedure.name);

  if (
    procedure.relatedProgramId === "SP-DISASTER-CERTIFICATE" ||
    procedure.type === "disaster_certificate"
  ) {
    if (procedure.status === "preparing") {
      return "現在は支援制度を利用するための準備を進めています。";
    }
    if (
      procedure.status === "waiting_response" ||
      procedure.status === "submitted"
    ) {
      return "現在は被害の証明の結果をお待ちしています。";
    }
  }

  switch (procedure.status) {
    case "preparing":
      return `現在は${name}の準備を進めています。`;
    case "submitted":
      return `現在は${name}を提出済みです。結果をお待ちしています。`;
    case "waiting_response":
      return `現在は${name}の結果をお待ちしています。`;
    case "unknown":
      return `現在は${name}について、公式案内を確認しています。`;
    default:
      return null;
  }
}

/**
 * currentSituation — ①RecoveryPhase ②主要手続き ③Timeline ④次Action
 * 被災者本人に語りかける伴走文
 */
export function buildCurrentSituation(
  caseFile: CaseFile,
  currentAction: CaseAction,
  _profile?: UserProfile
): string {
  const mode = caseFile.recoveryPhase?.mode ?? "recovery";
  const parts: string[] = [buildPhaseOpening(mode)];

  const primary = getPrimaryProcedure(caseFile, currentAction);
  if (primary && primary.status !== "not_started" && primary.status !== "completed") {
    const procPhrase = buildProcedureSituationPhrase(primary);
    if (procPhrase) parts.push(procPhrase);
  }

  if (parts.length === 1) {
    const latest = getLatestCompletedSummary(caseFile);
    if (latest) {
      parts.push(`${latest}など、順調に進んでいます。`);
    }
  }

  if (parts.length === 1) {
    const friendly = formatActionFriendlyReason(currentAction);
    parts.push(formatSituationOpeningStep(friendly));
  }

  return parts.join("");
}

function buildOpportunityAttention(
  caseFile: CaseFile,
  profile: UserProfile
): SurvivorAttentionItem[] {
  const items: SurvivorAttentionItem[] = [];
  const damage = profile.housingDamage ?? "";
  const hasHousingDamage =
    damage.length > 0 &&
    !["なし", "わからない", "不明", "未確認"].includes(damage);

  if (hasHousingDamage) {
    const repair = caseFile.pendingActions.find(
      (a) => a.id === "rw-j05-emergency-repair"
    );
    const photo = caseFile.pendingActions.find((a) => a.id === "rw-j03-photo");
    const target = repair ?? photo;
    if (target) {
      items.push({
        kind: "preparation",
        message:
          "雨や台風の前に、屋根の応急対応（ブルーシート等）の支援がないか確認しましょう。",
        href: getCaseActionDetailPath(target.id),
      });
    }
  }

  const waterPending = caseFile.pendingActions.find(
    (a) => a.id === "rw-j02-water-station" || a.id === "rw-j02-water-children"
  );
  const waterDone = caseFile.completedActions.find(
    (a) => a.id === "rw-j02-water-station" || a.id === "rw-j02-water-children"
  );
  if (profile.hasWaterOutage === true || waterPending || waterDone) {
    const target = waterPending ?? waterDone;
    items.push({
      kind: "preparation",
      message:
        "断水がある（あった）場合、水道料金の減免届出を見落とさないよう確認しましょう。",
      href: target ? getCaseActionDetailPath(target.id) : undefined,
    });
  }

  const mode = caseFile.recoveryPhase?.mode ?? "recovery";
  if (mode === "recovery") {
    const certDone = caseFile.completedActions.some(
      (a) => a.id === "rw-j03-cert-prep"
    );
    const lifeOrPrograms =
      caseFile.pendingActions.find(
        (a) => a.id === "rw-j04-programs" || a.id === "rw-j04-life-rebuild"
      ) ??
      caseFile.completedActions.find(
        (a) => a.id === "rw-j04-programs" || a.id === "rw-j04-life-rebuild"
      );
    if (certDone || lifeOrPrograms) {
      items.push({
        kind: "preparation",
        message:
          "住まいの手続きと並行して、仕事・学校・通院の再開見通しも整理しておくと安心です。",
        href: lifeOrPrograms
          ? getCaseActionDetailPath(lifeOrPrograms.id)
          : undefined,
      });
    }
  }

  return items;
}

function buildNeedsAttention(
  caseFile: CaseFile,
  currentAction: CaseAction,
  profile: UserProfile
): SurvivorAttentionItem[] {
  const items: SurvivorAttentionItem[] = [];

  const deadline = getPrimaryDeadlineDisplay(caseFile);
  if (
    deadline &&
    (deadline.deadline.status === "due_soon" ||
      deadline.deadline.status === "overdue" ||
      deadline.deadline.status === "unknown")
  ) {
    items.push({
      kind: "deadline",
      message: `${deadline.deadline.label}：${deadline.displayText}`,
      href: "/deadlines",
    });
  }

  const primary = getPrimaryProcedure(caseFile, currentAction);
  if (
    primary &&
    (primary.status === "waiting_response" || primary.status === "submitted")
  ) {
    const name = simplifyProcedureName(primary.name);
    items.push({
      kind: "waiting",
      message: `${name}の結果をお待ちしています。届き次第、次のステップを一緒に確認しましょう。`,
      href: getCaseActionDetailPath(currentAction.id),
    });
  }

  items.push(...buildOpportunityAttention(caseFile, profile));

  for (const message of consolidatePreparationMessages(
    analyzeNextPreparation(caseFile, currentAction)
  ).slice(0, 2)) {
    items.push({
      kind: "preparation",
      message,
      href: getCaseActionDetailPath(currentAction.id),
    });
  }

  return items.slice(0, 4);
}

/** 被災者伴走画面用 — 4項目 + 判断説明を統合 */
export function getSurvivorSituationDashboard(
  caseFile: CaseFile,
  currentAction: CaseAction,
  profile: UserProfile
): SurvivorSituationDashboard {
  const explanation = buildActionDecisionExplanation(
    caseFile,
    currentAction,
    profile
  );
  const survivorExplanation = buildSurvivorFriendlyExplanation(explanation);
  const triggerMessage = explanation.conditions[0]?.detail;
  const friendlyReason = formatActionFriendlyReason(currentAction, {
    triggerMessage,
  });
  const companionHeadline = formatActionCompanionHeadline(
    currentAction,
    friendlyReason
  );
  const keyword = getActionWalkthrough(
    currentAction.id,
    currentAction.title
  ).plainTitle;

  const contextParts: string[] = [];
  const situation = formatCaseSituation(caseFile);
  if (situation && situation !== "状況確認中") contextParts.push(situation);
  if (profile.hasWaterOutage) contextParts.push("断水");
  if (profile.hasPowerOutage) contextParts.push("停電");
  if (profile.hasGasOutage) contextParts.push("ガス停止");

  return {
    currentSituation: buildCurrentSituation(caseFile, currentAction, profile),
    situationContext:
      contextParts.length > 0 ? contextParts.join("・") : undefined,
    completedItems: getCompletedItemsForSurvivor(caseFile).map((i) => ({
      summary: i.summary,
    })),
    progressReassurance: getProgressReassurance(caseFile),
    nextAction: {
      title: currentAction.title,
      headline: keyword,
      description:
        formatActionCompanionDescription(currentAction) || companionHeadline,
      friendlyReason,
    },
    needsAttention: buildNeedsAttention(caseFile, currentAction, profile),
    whyThisGuidance: survivorExplanation.whyThisGuidance,
    relatedSupportNames: survivorExplanation.relatedSupportNames,
    hasExplanationSources: survivorExplanation.hasSources,
  };
}

/** ホーム「現在: ○○フェーズ」表示 */
export function getRecoveryPhaseDisplay(
  mode: RecoveryPhaseMode
): RecoveryPhaseDisplay {
  if (mode === "recovery") {
    return {
      title: "生活再建フェーズ",
      subtitle: "被害記録・支援制度・手続きを順番に進めています",
    };
  }
  return {
    title: "生活再建フェーズ",
    subtitle: "これから生活再建の手続きを順番に進めていきます",
  };
}

function alertMatchesProfile(
  alert: (typeof REGIONAL_ALERTS)[0],
  profile: UserProfile
): boolean {
  const c = alert.conditions;
  const profileMunicipalityCode = resolveMunicipalityCode(profile.municipality);
  if (
    c.municipalityCode &&
    profileMunicipalityCode &&
    c.municipalityCode !== profileMunicipalityCode
  ) {
    return false;
  }
  if (c.hasWaterOutage === true && profile.hasWaterOutage !== true) return false;
  if (c.hasChildren === true && profile.hasChildren !== true) return false;
  return true;
}

/**
 * Recovery Mode 時: acute Action は非表示のまま、KB 出典付き外部導線を表示
 */
export function getAcuteExternalLinksForRecovery(
  profile: UserProfile,
  caseFile: CaseFile
): AcuteExternalLink[] {
  if (caseFile.recoveryPhase?.mode !== "recovery") return [];

  const seen = new Set<string>();
  const links: AcuteExternalLink[] = [];

  const acuteJourneyIds = new Set(["J-01", "J-02"]);
  for (const alert of REGIONAL_ALERTS) {
    if (!alert.journeyIds.some((j) => acuteJourneyIds.has(j))) continue;
    if (!alert.sourceUrl || alert.sourceUrl === "確認不可") continue;
    if (!alertMatchesProfile(alert, profile)) continue;
    if (seen.has(alert.sourceUrl)) continue;
    seen.add(alert.sourceUrl);

    links.push({
      label: alert.title,
      description: alert.message,
      sourceUrl: alert.sourceUrl,
      updatedAt: alert.updatedAt,
    });
  }

  return links;
}

function procedureSortWeight(
  proc: ExternalProcedure,
  primaryId?: string
): number {
  if (proc.id === primaryId) return 0;
  const order: ProcedureStatus[] = [
    "waiting_response",
    "submitted",
    "preparing",
    "not_started",
    "unknown",
  ];
  const idx = order.indexOf(proc.status);
  return idx >= 0 ? idx + 1 : 99;
}

/** 「現在の手続き」一覧（最大3件） */
export function getProcedureOverview(
  caseFile: CaseFile,
  currentAction?: CaseAction | null
): ProcedureOverviewItem[] {
  const procedures = caseFile.procedures ?? [];
  if (procedures.length === 0) return [];

  const primary = getPrimaryProcedure(caseFile, currentAction);
  const active = procedures.filter(
    (p) => p.status !== "completed" && p.status !== "rejected"
  );
  if (active.length === 0) return [];

  const sorted = [...active].sort(
    (a, b) =>
      procedureSortWeight(a, primary?.id) -
      procedureSortWeight(b, primary?.id)
  );

  return sorted.slice(0, 3).map((proc) => {
    const isPrimary = proc.id === primary?.id;
    let hint = PROCEDURE_HINT[proc.status];
    if (!isPrimary && proc.status === "not_started") {
      hint = "次に確認";
    } else if (isPrimary && proc.status === "preparing") {
      hint = "いま進行中";
    }

    return {
      name: proc.name,
      statusLabel: getFriendlyProcedureStatusLabel(proc.status),
      hint,
      isPrimary,
    };
  });
}
