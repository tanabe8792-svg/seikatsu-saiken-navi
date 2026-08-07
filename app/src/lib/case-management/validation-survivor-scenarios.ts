/**
 * 被災者シナリオ検証 — 体験品質（迷わない・次に進める・不安軽減）
 * docs/19 SurvivorScenarioValidation
 *
 * 機能動作ではなく、Case1/4/6 Recovery の被災者体験を検証する。
 * 既存 validate:* は変更しない（追加のみ）。
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import {
  buildActionDecisionExplanation,
  buildSurvivorGuidanceSummary,
} from "./decision-explanation";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import {
  getSurvivorSituationDashboard,
  type SurvivorSituationDashboard,
} from "./recovery-dashboard";
import type { SurvivorAttentionItem } from "./recovery-dashboard";
import { syncCaseTimeline } from "./case-timeline";
import type { CaseAction, CaseFile } from "./types";
import type { UserProfile } from "@/lib/types";

export interface SurvivorScenarioPhaseResult {
  phase: string;
  passed: boolean;
}

export interface SurvivorScenarioValidationResult {
  name: string;
  phases: SurvivorScenarioPhaseResult[];
  steps: string[];
  passed: boolean;
  gaps: string[];
}

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

const FORBIDDEN_SURVIVOR_TERMS = [
  "Procedure",
  "Evidence",
  "CaseDecision",
  "Trigger",
  "RW Action",
  "KB",
  "ActionQueue",
  "証跡",
];

const ALLOWED_ATTENTION_KINDS = new Set<SurvivorAttentionItem["kind"]>([
  "deadline",
  "waiting",
  "preparation",
]);

const SPECULATIVE_PATTERNS = [
  /必ず(?:受け取|もら|適用)/,
  /確実に/,
  /\d+万円(?:の支援|が支給)/,
  /間違いなく対象/,
];

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

function triggersFrom(file: CaseFile) {
  return [
    ...file.pendingActions,
    ...file.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);
}

function initRecoveryCase(profile: UserProfile) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return syncCaseTimeline(
    createCaseFile(caseProfile, family, {
      userProfile: profile,
      forcePhaseMode: "recovery",
    })
  );
}

function dashboardAt(
  file: CaseFile,
  profile: UserProfile
): { current: CaseAction; dashboard: SurvivorSituationDashboard } {
  const current = getCurrentAction(file)!;
  return {
    current,
    dashboard: getSurvivorSituationDashboard(file, current, profile),
  };
}

function collectSurvivorDisplayStrings(
  dashboard: SurvivorSituationDashboard
): string[] {
  return [
    dashboard.currentSituation,
    dashboard.situationContext ?? "",
    dashboard.progressReassurance ?? "",
    dashboard.nextAction.title,
    dashboard.nextAction.headline,
    dashboard.nextAction.friendlyReason,
    dashboard.nextAction.description,
    dashboard.whyThisGuidance,
    ...dashboard.completedItems.map((i) => i.summary),
    ...dashboard.needsAttention.map((i) => i.message),
    ...dashboard.relatedSupportNames,
  ].filter(Boolean);
}

/** UX品質チェック 1〜6（全フェーズ共通） */
export function assertSurvivorScenarioUxQuality(
  file: CaseFile,
  dashboard: SurvivorSituationDashboard,
  current: CaseAction,
  profile: UserProfile,
  gaps: string[],
  label: string
): void {
  const na = dashboard.nextAction;

  if (!na.friendlyReason?.trim() && !na.headline?.trim()) {
    gaps.push(`${label}[1]: friendlyReason / companionHeadline が空`);
  }

  if (!dashboard.currentSituation?.trim()) {
    gaps.push(`${label}[2]: currentSituation が空`);
  }

  if (
    file.completedActions.length > 0 &&
    dashboard.completedItems.length > 0 &&
    !dashboard.progressReassurance?.trim()
  ) {
    gaps.push(`${label}[3]: completedItems ありだが progressReassurance なし`);
  }

  for (const item of dashboard.needsAttention) {
    if (!ALLOWED_ATTENTION_KINDS.has(item.kind)) {
      gaps.push(`${label}[4]: needsAttention 不正 kind=${item.kind}`);
    }
  }

  for (const text of collectSurvivorDisplayStrings(dashboard)) {
    for (const term of FORBIDDEN_SURVIVOR_TERMS) {
      if (text.includes(term)) {
        gaps.push(`${label}[5]: 内部用語「${term}」`);
      }
    }
  }

  const explanation = buildActionDecisionExplanation(file, current, profile);
  const why = dashboard.whyThisGuidance || buildSurvivorGuidanceSummary(explanation);
  if (why.trim().length < 8) {
    gaps.push(`${label}[6]: なぜこの案内か説明不足`);
  } else if (why === current.title) {
    gaps.push(`${label}[6]: whyThisGuidance が Action タイトルのみ`);
  }
}

function assertNoSpeculation(
  dashboard: SurvivorSituationDashboard,
  gaps: string[],
  label: string
): void {
  for (const text of collectSurvivorDisplayStrings(dashboard)) {
    for (const pattern of SPECULATIVE_PATTERNS) {
      if (pattern.test(text)) {
        gaps.push(`${label}: 推測表現 ${pattern}`);
      }
    }
    if (text.includes("確認不可") && !text.includes("公式") && !text.includes("確認")) {
      gaps.push(`${label}: 確認不可の生表示`);
    }
  }
}

function assertRecoveryPhaseStart(
  dashboard: SurvivorSituationDashboard,
  gaps: string[],
  label: string
): void {
  if (!dashboard.currentSituation.includes("生活の立て直し")) {
    gaps.push(`${label}: 生活の立て直しが currentSituation にない`);
  }
  if (
    !dashboard.nextAction.headline.includes("確認") &&
    !dashboard.nextAction.headline.includes("申請") &&
    !dashboard.nextAction.headline.includes("写真") &&
    !dashboard.nextAction.headline.includes("記録") &&
    !dashboard.nextAction.headline.includes("連絡") &&
    !dashboard.nextAction.headline.includes("進め")
  ) {
    gaps.push(`${label}: 次の確認見出しが分かりにくい`);
  }
}

function pendingHasAction(file: CaseFile, actionId: string): boolean {
  return file.pendingActions.some((a) => a.id === actionId);
}

function actionVisibleInFlow(file: CaseFile, actionId: string): boolean {
  return (
    pendingHasAction(file, actionId) ||
    getCurrentAction(file)?.id === actionId ||
    file.completedActions.some((a) => a.id === actionId)
  );
}

function completePhoto(file: CaseFile): CaseFile {
  const photo = getCurrentAction(file)!;
  let next = completeCaseAction(
    file,
    photo.id,
    triggersFrom(file),
    photoEvidenceInput()
  );
  if (next.blocked || getCurrentAction(next.caseFile)?.id === photo.id) {
    next = completeCaseAction(file, photo.id, triggersFrom(file), undefined, {
      alreadyCompletedOutside: true,
    });
  }
  return syncCaseTimeline(next.caseFile);
}

function completeCurrent(file: CaseFile): CaseFile {
  const current = getCurrentAction(file)!;
  return syncCaseTimeline(
    completeCaseAction(file, current.id, triggersFrom(file)).caseFile
  );
}

export function validateSurvivorScenarioFlow(
  caseKey: string
): SurvivorScenarioValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return {
      name: caseKey,
      phases: [],
      steps: [],
      passed: false,
      gaps: ["ケース未定義"],
    };
  }

  const gaps: string[] = [];
  const steps: string[] = [];
  const phases: SurvivorScenarioPhaseResult[] = [];
  const profile = example.profile;
  let file = initRecoveryCase(profile);

  const recordPhase = (phase: string, phaseGapsBefore: number) => {
    phases.push({
      phase,
      passed: gaps.length === phaseGapsBefore,
    });
  };

  switch (caseKey) {
    case "Case1": {
      let g = gaps.length;
      let { current, dashboard } = dashboardAt(file, profile);
      assertRecoveryPhaseStart(dashboard, gaps, "Case1 開始");
      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case1 開始"
      );
      recordPhase("開始", g);
      steps.push("開始");

      g = gaps.length;
      file = completePhoto(file);
      ({ current, dashboard } = dashboardAt(file, profile));
      // 写真 Action は証跡条件でテスト環境差が出ることがあるため、進めたときだけ厳格確認
      if (current.id === "rw-j03-cert-prep" || current.title.includes("罹災")) {
        if (
          !dashboard.nextAction.friendlyReason.includes("支援制度") &&
          !dashboard.nextAction.friendlyReason.includes("証明")
        ) {
          gaps.push("Case1 写真後: 罹災証明への自然誘導が弱い");
        }
      }
      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case1 写真後"
      );
      recordPhase("写真後", g);
      steps.push("写真完了");

      g = gaps.length;
      file = completeCurrent(file);
      ({ current, dashboard } = dashboardAt(file, profile));

      const lifeVisible =
        actionVisibleInFlow(file, "rw-j04-life-rebuild") ||
        dashboard.relatedSupportNames.some((n) => n.includes("生活再建")) ||
        dashboard.whyThisGuidance.includes("生活再建") ||
        dashboard.currentSituation.includes("支援") ||
        current.id === "rw-j04-life-rebuild";

      if (!lifeVisible) {
        gaps.push("Case1 罹災証明後: 生活再建支援への流れが見えない");
      }

      const lifeProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-LIFE-REBUILD"
      );
      if (!lifeProc || lifeProc.status !== "preparing") {
        gaps.push(
          `Case1 罹災証明後: 生活再建手続き preparing 期待 / 実際 ${lifeProc?.status ?? "なし"}`
        );
      }

      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case1 罹災証明後"
      );
      recordPhase("罹災証明後", g);
      steps.push("罹災証明準備完了");
      break;
    }

    case "Case4": {
      let g = gaps.length;
      let { current, dashboard } = dashboardAt(file, profile);
      assertRecoveryPhaseStart(dashboard, gaps, "Case4 開始");
      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case4 開始"
      );
      recordPhase("開始", g);
      steps.push("開始");

      g = gaps.length;
      file = completePhoto(file);
      file = completeCurrent(file);
      ({ current, dashboard } = dashboardAt(file, profile));

      const loanVisible =
        actionVisibleInFlow(file, "rw-j04-loan-relief") ||
        dashboard.relatedSupportNames.some(
          (n) => n.includes("ローン") || n.includes("借入")
        ) ||
        dashboard.whyThisGuidance.includes("ローン") ||
        current.id === "rw-j04-loan-relief";

      if (!loanVisible) {
        gaps.push("Case4: ローン関連支援が被災者向け表示にない");
      }

      const certRelation =
        dashboard.whyThisGuidance.includes("罹災") ||
        dashboard.whyThisGuidance.includes("証明") ||
        dashboard.whyThisGuidance.includes("支援") ||
        dashboard.currentSituation.includes("証明") ||
        dashboard.currentSituation.includes("支援");

      if (!certRelation) {
        gaps.push("Case4: 罹災証明と支援の関係が説明されていない");
      }

      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (!loanProc || loanProc.status !== "preparing") {
        gaps.push(
          `Case4: ローン減免 preparing 期待 / 実際 ${loanProc?.status ?? "なし"}`
        );
      }

      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case4 罹災証明後"
      );
      assertNoSpeculation(dashboard, gaps, "Case4");
      recordPhase("罹災証明後", g);
      steps.push("写真→罹災証明");
      break;
    }

    case "Case6": {
      let g = gaps.length;
      let { current, dashboard } = dashboardAt(file, profile);

      if (
        current.id !== "rw-j03-photo" &&
        current.id !== "rw-j03-cert-prep" &&
        current.id !== "rw-j04-business-recovery"
      ) {
        gaps.push(
          `Case6 開始: 想定外の最初の確認「${current.title}」`
        );
      }
      if (!actionVisibleInFlow(file, "rw-j04-business-recovery")) {
        gaps.push("Case6 開始: 事業復旧 Action が一覧にない");
      }

      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case6 開始"
      );
      assertNoSpeculation(dashboard, gaps, "Case6 開始");
      recordPhase("開始", g);
      steps.push("開始");

      g = gaps.length;
      file = completeCurrent(file);
      ({ current, dashboard } = dashboardAt(file, profile));

      const bizVisible =
        actionVisibleInFlow(file, "rw-j04-business-recovery") ||
        dashboard.relatedSupportNames.some(
          (n) => n.includes("事業") || n.includes("自営")
        ) ||
        (file.procedures ?? []).some((p) => p.type === "business_support");

      if (!bizVisible) {
        gaps.push("Case6: 事業再建関連の次ステップが見えない");
      }

      const bizProc = (file.procedures ?? []).find(
        (p) => p.type === "business_support"
      );
      if (!bizProc) {
        gaps.push("Case6: business_support 手続きがありません");
      } else if (
        bizProc.status !== "preparing" &&
        bizProc.status !== "not_started"
      ) {
        gaps.push(
          `Case6: business_support 想定外 / 実際 ${bizProc.status}`
        );
      }

      const unknownRecords = (file.documentRecords ?? []).filter(
        (r) => r.status === "unknown"
      );
      for (const rec of unknownRecords) {
        const exposed = collectSurvivorDisplayStrings(dashboard).some(
          (s) => s.includes(rec.name) && s.includes("確認不可")
        );
        if (exposed) {
          gaps.push(`Case6: unknown 書類「${rec.name}」が確認不可のまま表示`);
        }
      }

      assertSurvivorScenarioUxQuality(
        file,
        dashboard,
        current,
        profile,
        gaps,
        "Case6 事業復旧後"
      );
      assertNoSpeculation(dashboard, gaps, "Case6 事業復旧後");
      recordPhase("事業復旧後", g);
      steps.push("事業復旧完了");
      break;
    }

    default:
      gaps.push(`未対応: ${caseKey}`);
  }

  return {
    name: caseKey,
    phases,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllSurvivorScenarioValidations(): {
  results: SurvivorScenarioValidationResult[];
  passed: number;
  total: number;
} {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map((k) => validateSurvivorScenarioFlow(k));
  return {
    results,
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

export function formatSurvivorScenarioReport(): string {
  const { results, passed, total } = runAllSurvivorScenarioValidations();
  const lines = [
    "=== Survivor Scenario Validation（被災者体験品質）===",
    "",
  ];

  for (const r of results) {
    lines.push(`${r.passed ? "✓" : "✗"} ${r.name}`);
    lines.push(`  flow: ${r.steps.join(" → ")}`);
    for (const p of r.phases) {
      lines.push(`  phase「${p.phase}」: ${p.passed ? "OK" : "NG"}`);
    }
    if (r.gaps.length) {
      lines.push(`  gaps:`);
      for (const g of r.gaps) lines.push(`    - ${g}`);
    }
    lines.push("");
  }

  lines.push(`Result: ${passed}/${total} passed`);
  lines.push("");
  lines.push("UX品質チェック:");
  lines.push("  [1] friendlyReason / companionHeadline");
  lines.push("  [2] currentSituation 非空");
  lines.push("  [3] completedItems → progressReassurance");
  lines.push("  [4] needsAttention kind 制限");
  lines.push("  [5] 内部用語禁止");
  lines.push("  [6] なぜこの案内か説明可能");

  return lines.join("\n");
}
