/**
 * Recovery Phase 検証 — Case1 / Case4 / Case6
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import { createCaseFile, getCurrentAction } from "./action-queue";
import { extractFamilyAttributes } from "./index";

export interface RecoveryPhaseValidationResult {
  name: string;
  phaseMode: string;
  firstAction: string;
  passed: boolean;
  gaps: string[];
}

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

function createRecoveryModeCase(
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return createCaseFile(caseProfile, family, {
    userProfile: profile,
    forcePhaseMode: "recovery",
  });
}

export function validateRecoveryPhase(
  caseKey: string
): RecoveryPhaseValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  const gaps: string[] = [];

  if (!example) {
    return {
      name: caseKey,
      phaseMode: "",
      firstAction: "",
      passed: false,
      gaps: ["ケース未定義"],
    };
  }

  const file = createRecoveryModeCase(example.profile);
  const first = getCurrentAction(file);
  const firstTitle = first?.title ?? "";

  if (file.recoveryPhase?.mode !== "recovery") {
    gaps.push(`期待 recovery / 実際 ${file.recoveryPhase?.mode}`);
  }

  switch (caseKey) {
    case "Case1":
      if (firstTitle === "給水場所を確認") {
        gaps.push("Recovery Mode で給水が主 Action になっている");
      }
      if (firstTitle !== "被害写真を撮影する") {
        gaps.push(`期待「被害写真を撮影する」/ 実際「${firstTitle}」`);
      }
      break;
    case "Case4":
      if (firstTitle !== "被害写真を撮影する") {
        gaps.push(`期待先頭「被害写真を撮影する」/ 実際「${firstTitle}」`);
      }
      {
        const titles = file.pendingActions.map((a) => a.title);
        if (!titles.includes("ローン減免制度を確認")) {
          gaps.push("ローン減免 Action がキューに含まれない");
        }
      }
      break;
    case "Case6":
      if (firstTitle !== "被害写真を撮影する") {
        gaps.push(`期待「被害写真を撮影する」/ 実際「${firstTitle}」`);
      }
      {
        const titles = file.pendingActions.map((a) => a.title);
        if (!titles.includes("事業復旧を確認")) {
          gaps.push("事業復旧 Action がキューに含まれない");
        }
        if (!titles.includes("罹災証明書の申請を確認する")) {
          gaps.push("罹災証明 Action がキューに含まれない");
        }
      }
      break;
  }

  return {
    name: caseKey,
    phaseMode: file.recoveryPhase?.mode ?? "",
    firstAction: firstTitle,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllRecoveryPhaseValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateRecoveryPhase);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatRecoveryPhaseReport(): string {
  const report = runAllRecoveryPhaseValidations();
  const lines = [
    "# Recovery Phase 検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];
  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    lines.push(`フェーズ: ${r.phaseMode}`);
    lines.push(`先頭 Action: ${r.firstAction}`);
    for (const g of r.gaps) lines.push(`  - ${g}`);
    lines.push("");
  }
  return lines.join("\n");
}
