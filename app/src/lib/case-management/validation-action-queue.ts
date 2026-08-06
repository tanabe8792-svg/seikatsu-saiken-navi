/**
 * Action Queue 検証 — 6ケースの期待順序
 * docs/10 検証シナリオ拡張
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import { extractFamilyAttributes } from "./index";
import { generateActionQueue } from "./action-queue";

export interface ActionQueueValidationResult {
  name: string;
  expectedFirstActions: string[];
  actualFirstActions: string[];
  passed: boolean;
  gaps: string[];
}

const EXPECTED_QUEUES: Record<string, string[]> = {
  Case1: ["給水場所を確認", "被害写真を撮影する", "罹災証明書の申請を確認する"],
  Case2: ["福祉避難所を検討", "給水場所を確認", "仮設・転居を検討"],
  Case3: ["給水場所を確認"],
  Case4: ["被害写真を撮影する", "ローン減免制度を確認"],
  Case5: ["被害写真を撮影する"],
  Case6: ["被害写真を撮影する", "罹災証明書の申請を確認する", "保険会社へ被害連絡する"],
};

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case2: 氷川町・全壊・高齢者・賃貸": "Case2",
  "Case3: 八代市・被害なし・断水のみ": "Case3",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case5: 宇土市・一部損壊・単身": "Case5",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

export function validateActionQueue(
  caseKey: string,
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
): ActionQueueValidationResult {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  const { actions } = generateActionQueue(caseProfile, family, {
    phaseMode: "acute",
  });
  const actualFirstActions = actions.slice(0, 3).map((a) => a.title);
  const expectedFirstActions = EXPECTED_QUEUES[caseKey] ?? [];

  const gaps: string[] = [];
  for (let i = 0; i < expectedFirstActions.length; i++) {
    if (actualFirstActions[i] !== expectedFirstActions[i]) {
      gaps.push(
        `位置${i + 1}: 期待「${expectedFirstActions[i]}」/ 実際「${actualFirstActions[i] ?? "なし"}」`
      );
    }
  }

  return {
    name: caseKey,
    expectedFirstActions,
    actualFirstActions,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllActionQueueValidations(): {
  passed: number;
  total: number;
  results: ActionQueueValidationResult[];
} {
  const results = J00_VALIDATION_EXAMPLES.map((example) => {
    const key = CASE_NAME_MAP[example.name] ?? example.name;
    return validateActionQueue(key, example.profile);
  });

  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatActionQueueReport(): string {
  const report = runAllActionQueueValidations();
  const lines = [
    "# Action Queue 検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];

  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    lines.push(`期待: ${r.expectedFirstActions.join(" → ")}`);
    lines.push(`実際: ${r.actualFirstActions.join(" → ")}`);
    if (r.gaps.length) {
      lines.push("gaps:");
      for (const g of r.gaps) lines.push(`  - ${g}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
