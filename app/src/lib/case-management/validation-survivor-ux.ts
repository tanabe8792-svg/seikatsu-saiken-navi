/**
 * 被災者伴走 UX 検証 — Case1 / Case4 / Case6 Recovery
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  formatActionFriendlyReason,
  getCurrentAction,
} from "./action-queue";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import {
  buildCurrentSituation,
  getSurvivorSituationDashboard,
} from "./recovery-dashboard";
import { assertSurvivorJapaneseQuality } from "./survivor-copy-quality";
import { syncCaseTimeline } from "./case-timeline";

export interface SurvivorUxValidationResult {
  name: string;
  steps: string[];
  passed: boolean;
  gaps: string[];
}

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

const FORBIDDEN_TERMS = [
  "Procedure",
  "Evidence",
  "CaseDecision",
  "Trigger",
  "RW Action",
  "証跡",
  "申請準備中",
  "やるべきこと",
  "取得してください",
];

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

function triggersFrom(file: ReturnType<typeof createCaseFile>) {
  return [
    ...file.pendingActions,
    ...file.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);
}

function initRecoveryCase(
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return syncCaseTimeline(
    createCaseFile(caseProfile, family, {
      userProfile: profile,
      forcePhaseMode: "recovery",
    })
  );
}

function collectSurvivorStrings(
  dashboard: ReturnType<typeof getSurvivorSituationDashboard>
): string[] {
  return [
    dashboard.currentSituation,
    dashboard.situationContext ?? "",
    dashboard.progressReassurance ?? "",
    dashboard.nextAction.headline,
    dashboard.nextAction.friendlyReason,
    dashboard.nextAction.description,
    dashboard.whyThisGuidance,
    ...dashboard.completedItems.map((i) => i.summary),
    ...dashboard.needsAttention.map((i) => i.message),
    ...dashboard.relatedSupportNames,
  ];
}

function assertNoForbiddenTerms(texts: string[], gaps: string[], label: string) {
  for (const text of texts) {
    for (const term of FORBIDDEN_TERMS) {
      if (text.includes(term)) {
        gaps.push(`${label}: 禁止語「${term}」`);
      }
    }
  }
}

function assertCompanionTone(text: string, gaps: string[], label: string) {
  if (text.includes("してください") && !text.includes("確認してください")) {
    gaps.push(`${label}: 命令調「してください」`);
  }
  if (!text.includes("ましょう") && !text.includes("です") && !text.includes("ています")) {
    gaps.push(`${label}: 伴走トーン不足`);
  }
}

export function validateSurvivorUxFlow(
  caseKey: string
): SurvivorUxValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return { name: caseKey, steps: [], passed: false, gaps: ["ケース未定義"] };
  }

  const steps: string[] = [];
  const gaps: string[] = [];
  let file = initRecoveryCase(example.profile);
  const profile = example.profile;

  let current = getCurrentAction(file)!;
  let dashboard = getSurvivorSituationDashboard(file, current, profile);

  if (!dashboard.currentSituation.includes("生活再建")) {
    gaps.push("初期 currentSituation に生活再建フェーズがない");
  }
  if (!dashboard.nextAction.headline.includes("確認")) {
    gaps.push(`初期 headline 伴走表現不足: ${dashboard.nextAction.headline}`);
  }
  assertNoForbiddenTerms(collectSurvivorStrings(dashboard), gaps, `${caseKey} 初期`);
  assertSurvivorJapaneseQuality(
    collectSurvivorStrings(dashboard).map((text, i) => ({
      label: `${caseKey} 初期[${i}]`,
      text,
    })),
    gaps
  );
  steps.push("初期表示");

  switch (caseKey) {
    case "Case1": {
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          current.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      steps.push("写真記録");

      current = getCurrentAction(file)!;
      dashboard = getSurvivorSituationDashboard(file, current, profile);

      if (dashboard.completedItems.length < 1) {
        gaps.push("写真後 completedItems が空");
      }
      if (!dashboard.progressReassurance) {
        gaps.push("写真後 progressReassurance なし");
      }

      const certReason = formatActionFriendlyReason(current);
      if (!certReason.includes("支援制度") || !certReason.includes("確認")) {
        gaps.push(`罹災証明 friendlyReason: ${certReason}`);
      }

      file = syncCaseTimeline(
        completeCaseAction(file, current.id, triggersFrom(file)).caseFile
      );
      steps.push("罹災証明準備");

      current = getCurrentAction(file)!;
      dashboard = getSurvivorSituationDashboard(file, current, profile);
      const situation = buildCurrentSituation(file, current, profile);

      if (!situation.includes("生活再建")) {
        gaps.push("currentSituation に RecoveryPhase なし");
      }
      if (
        !situation.includes("準備") &&
        !situation.includes("進め") &&
        !situation.includes("確認")
      ) {
        gaps.push(`currentSituation 手続き/進捗不足: ${situation}`);
      }

      assertCompanionTone(dashboard.nextAction.headline, gaps, "Case1 headline");
      assertNoForbiddenTerms(collectSurvivorStrings(dashboard), gaps, "Case1 完了後");
      steps.push("Case1 伴走UX");
      break;
    }
    case "Case4": {
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          current.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      current = getCurrentAction(file)!;
      dashboard = getSurvivorSituationDashboard(file, current, profile);

      if (dashboard.nextAction.friendlyReason.length < 10) {
        gaps.push("Case4 friendlyReason が短い");
      }
      assertNoForbiddenTerms(collectSurvivorStrings(dashboard), gaps, "Case4");
      steps.push("Case4 伴走UX");
      break;
    }
    case "Case6": {
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          current.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      current = getCurrentAction(file)!;
      dashboard = getSurvivorSituationDashboard(file, current, profile);

      if (!dashboard.currentSituation) {
        gaps.push("Case6 currentSituation 空");
      }
      if (!dashboard.whyThisGuidance) {
        gaps.push("Case6 whyThisGuidance 空");
      }
      assertNoForbiddenTerms(collectSurvivorStrings(dashboard), gaps, "Case6");
      steps.push("Case6 伴走UX");
      break;
    }
    default:
      gaps.push(`未対応: ${caseKey}`);
  }

  return {
    name: caseKey,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllSurvivorUxValidations(): {
  results: SurvivorUxValidationResult[];
  passed: number;
  total: number;
} {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map((k) => validateSurvivorUxFlow(k));
  return {
    results,
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

export function formatSurvivorUxReport(): string {
  const { results, passed, total } = runAllSurvivorUxValidations();
  const lines = ["=== Survivor UX Validation ===", ""];
  for (const r of results) {
    lines.push(`${r.passed ? "✓" : "✗"} ${r.name}`);
    lines.push(`  steps: ${r.steps.join(" → ")}`);
    if (r.gaps.length) {
      lines.push(`  gaps: ${r.gaps.join("; ")}`);
    }
    lines.push("");
  }
  lines.push(`Result: ${passed}/${total} passed`);
  return lines.join("\n");
}
