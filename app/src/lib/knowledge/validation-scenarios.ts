/**
 * AIケースワーカー検証シナリオ
 * docs/10_AIケースワーカー検証シナリオ.md と対応
 */

import type {
  CaseProfile,
  JourneyId,
  ScenarioResult,
} from "./types";
import { evaluateTriggers, toCaseProfile } from "./triggers";
import { getRelevantPrograms } from "./index";
import { derivePriorityJourney } from "./priority-journey";

export type { ScenarioResult };
import { MUNICIPALITY_CODES } from "./municipalities";

export interface ScenarioProgramResult {
  expectedPrograms: string[];
  actualPrograms: string[];
  passed: boolean;
}

export interface ScenarioJourneyResult {
  expectedJourney: JourneyId | null;
  actualJourney: JourneyId | null;
  passed: boolean;
}

export interface ScenarioEvaluation {
  name: string;
  description: string;
  input: CaseProfile;
  matchedTriggers: string[];
  matchedPrograms: string[];
  matchedAlertIds: string[];
  priorityJourney: JourneyId | null;
  priorityActions: string[];
  triggerResult: ScenarioResult;
  programResult?: ScenarioProgramResult;
  journeyResult?: ScenarioJourneyResult;
  /** 想定との差分・未実装項目 */
  gaps: string[];
  /** 総合合格（必須期待をすべて満たす） */
  passed: boolean;
}

export interface ValidationReport {
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  scenarios: ScenarioEvaluation[];
  recommendedRuleFixes: string[];
}

interface ScenarioDefinition {
  name: string;
  description: string;
  profileInput: Partial<CaseProfile> & {
    municipality?: string;
    housingDamage?: string;
  };
  expectedTriggers: string[];
  /** これらが actual に含まれてはいけない（過剰案内検出） */
  forbiddenTriggers?: string[];
  expectedPrograms?: string[];
  forbiddenPrograms?: string[];
  expectedJourney?: JourneyId | null;
  /** トリガー完全一致ではなく包含チェックのみ（ギャップ記録用） */
  aspirationalTriggers?: string[];
  notes?: string[];
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

function derivePriorityJourneyForScenario(
  triggerIds: string[],
  profile: CaseProfile
): JourneyId | null {
  const { triggers } = evaluateTriggers(profile);
  const idSet = new Set(triggerIds);
  const active = triggers.filter((t) => idSet.has(t.id));
  return derivePriorityJourney(active, profile);
}

function derivePriorityActions(
  triggerIds: string[],
  profile: CaseProfile
): string[] {
  const { triggers } = evaluateTriggers(profile);
  const idSet = new Set(triggerIds);
  return triggers
    .filter((t) => idSet.has(t.id))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 3)
    .map((t) => `${t.actionType}:${t.id}`);
}

function evaluateScenario(def: ScenarioDefinition): ScenarioEvaluation {
  const input = toCaseProfile(def.profileInput);
  const evaluation = evaluateTriggers(input);
  const matchedTriggers = evaluation.triggers.map((t) => t.id);
  const matchedPrograms = getRelevantPrograms(input).map((p) => p.id);
  const priorityJourney = derivePriorityJourneyForScenario(matchedTriggers, input);
  const priorityActions = derivePriorityActions(matchedTriggers, input);

  const missingTriggers = def.expectedTriggers.filter(
    (id) => !matchedTriggers.includes(id)
  );
  const forbiddenHit =
    def.forbiddenTriggers?.filter((id) => matchedTriggers.includes(id)) ?? [];
  const triggerPassed =
    missingTriggers.length === 0 && forbiddenHit.length === 0;

  const triggerResult: ScenarioResult = {
    name: def.name,
    expectedTriggers: def.expectedTriggers,
    actualTriggers: matchedTriggers,
    passed: triggerPassed,
  };

  let programResult: ScenarioProgramResult | undefined;
  if (def.expectedPrograms || def.forbiddenPrograms) {
    const expected = def.expectedPrograms ?? [];
    const missingPrograms = expected.filter(
      (id) => !matchedPrograms.includes(id)
    );
    const forbiddenProgramHit =
      def.forbiddenPrograms?.filter((id) =>
        matchedPrograms.includes(id)
      ) ?? [];
    programResult = {
      expectedPrograms: expected,
      actualPrograms: matchedPrograms,
      passed:
        missingPrograms.length === 0 && forbiddenProgramHit.length === 0,
    };
  }

  let journeyResult: ScenarioJourneyResult | undefined;
  if (def.expectedJourney !== undefined) {
    journeyResult = {
      expectedJourney: def.expectedJourney,
      actualJourney: priorityJourney,
      passed: priorityJourney === def.expectedJourney,
    };
  }

  const gaps: string[] = [];
  if (missingTriggers.length > 0) {
    gaps.push(`不足トリガー: ${missingTriggers.join(", ")}`);
  }
  if (forbiddenHit.length > 0) {
    gaps.push(`過剰トリガー: ${forbiddenHit.join(", ")}`);
  }
  if (programResult && !programResult.passed) {
    const missing = def.expectedPrograms?.filter(
      (id) => !matchedPrograms.includes(id)
    );
    const forbidden = def.forbiddenPrograms?.filter((id) =>
      matchedPrograms.includes(id)
    );
    if (missing?.length) gaps.push(`不足制度: ${missing.join(", ")}`);
    if (forbidden?.length) gaps.push(`過剰制度: ${forbidden.join(", ")}`);
  }
  if (journeyResult && !journeyResult.passed) {
    gaps.push(
      `優先ジャーニー不一致: 期待 ${journeyResult.expectedJourney} / 実際 ${journeyResult.actualJourney}`
    );
  }
  for (const aspirational of def.aspirationalTriggers ?? []) {
    if (!matchedTriggers.includes(aspirational)) {
      gaps.push(`未実装（理想）: ${aspirational}`);
    }
  }
  for (const note of def.notes ?? []) {
    gaps.push(note);
  }

  const passed =
    triggerResult.passed &&
    (programResult?.passed ?? true) &&
    (journeyResult?.passed ?? true) &&
    (def.aspirationalTriggers?.every((id) => matchedTriggers.includes(id)) ??
      true);

  return {
    name: def.name,
    description: def.description,
    input,
    matchedTriggers,
    matchedPrograms,
    matchedAlertIds: evaluation.matchedAlertIds,
    priorityJourney,
    priorityActions,
    triggerResult,
    programResult,
    journeyResult,
    gaps,
    passed,
  };
}

/** 6検証ケース定義 */
export const VALIDATION_SCENARIOS: ScenarioDefinition[] = [
  {
    name: "Case1",
    description: "宇城市・半壊・断水・子ども・持ち家",
    profileInput: {
      municipality: "宇城市",
      municipalityCode: MUNICIPALITY_CODES.UKI_CITY,
      damageLevel: "半壊",
      hasWaterOutage: true,
      hasChildren: true,
      housingTenure: "持ち家",
      photoRecordStatus: "none",
    },
    expectedTriggers: [
      "TRIGGER-WATER-PRIORITY",
      "TRIGGER-PHOTO-RECORD",
      "TRIGGER-ALERT-ALERT-WATER-CHILDREN",
      "TRIGGER-ALERT-ALERT-UKI-CERT-CROWD",
    ],
    expectedJourney: "J-02",
  },
  {
    name: "Case2",
    description: "氷川町・全壊・高齢者・賃貸",
    profileInput: {
      municipality: "氷川町",
      municipalityCode: MUNICIPALITY_CODES.HIKAWA_TOWN,
      damageLevel: "全壊",
      hasElderly: true,
      housingTenure: "賃貸",
      shelterStatus: "避難所",
      hasWaterOutage: true,
    },
    expectedTriggers: [
      "TRIGGER-PHOTO-RECORD",
      "TRIGGER-TEMP-HOUSING-PRIORITY",
      "TRIGGER-WELFARE-SHELTER",
    ],
    expectedJourney: "J-01",
    forbiddenPrograms: ["SP-LIFE-REBUILD"],
  },
  {
    name: "Case3",
    description: "八代市・自宅被害なし・断水のみ",
    profileInput: {
      municipality: "八代市",
      municipalityCode: MUNICIPALITY_CODES.YATSUSHIRO_CITY,
      hasWaterOutage: true,
      hasChildren: false,
      hasElderly: false,
    },
    expectedTriggers: [
      "TRIGGER-WATER-PRIORITY",
      "TRIGGER-ALERT-ALERT-WATER-PRIORITY",
    ],
    forbiddenTriggers: [
      "TRIGGER-PHOTO-RECORD",
      "TRIGGER-REGIONAL-PROGRAMS",
    ],
    expectedPrograms: ["SP-WATER-RATE-REDUCTION"],
    forbiddenPrograms: [
      "SP-DISASTER-CERTIFICATE",
      "SP-TEMP-HOUSING",
      "SP-LIFE-REBUILD",
      "SP-EMERGENCY-REPAIR",
    ],
    expectedJourney: "J-02",
  },
  {
    name: "Case4",
    description: "熊本市・半壊・持ち家・ローン・2016年経験",
    profileInput: {
      municipality: "熊本市",
      municipalityCode: MUNICIPALITY_CODES.KUMAMOTO_CITY,
      damageLevel: "半壊",
      housingTenure: "持ち家",
      hasMortgage: true,
      prior2016Disaster: true,
      photoRecordStatus: "none",
    },
    expectedTriggers: ["TRIGGER-2016-LOAN-RELIEF", "TRIGGER-PHOTO-RECORD"],
    expectedPrograms: [
      "SP-DISASTER-LOAN-RELIEF",
      "SP-DISASTER-CERTIFICATE",
      "SP-EMERGENCY-REPAIR",
    ],
  },
  {
    name: "Case5",
    description: "宇土市・一部損壊・単身",
    profileInput: {
      municipalityName: "宇土市",
      municipality: "宇土市",
      municipalityCode: MUNICIPALITY_CODES.UTO_CITY,
      damageLevel: "一部損壊",
      hasChildren: false,
      hasElderly: false,
      hasWaterOutage: false,
      hasPowerOutage: false,
    },
    expectedTriggers: ["TRIGGER-PHOTO-RECORD"],
    forbiddenTriggers: [
      "TRIGGER-WATER-PRIORITY",
      "TRIGGER-2016-LOAN-RELIEF",
      "TRIGGER-REGIONAL-PROGRAMS",
    ],
    forbiddenPrograms: [
      "SP-TEMP-HOUSING",
      "SP-LIFE-REBUILD",
      "SP-EMERGENCY-REPAIR",
    ],
    notes: ["制度表示は最大3件に制限"],
  },
  {
    name: "Case6",
    description: "自営業・半壊・店舗被害",
    profileInput: {
      municipality: "熊本市",
      municipalityCode: MUNICIPALITY_CODES.KUMAMOTO_CITY,
      damageLevel: "半壊",
      housingTenure: "持ち家",
      employmentType: "自営業",
      hasBusinessDamage: true,
      photoRecordStatus: "none",
    },
    expectedTriggers: ["TRIGGER-PHOTO-RECORD", "TRIGGER-BUSINESS-RECOVERY"],
    expectedPrograms: [
      "SP-BUSINESS-SME-RECOVERY",
      "SP-BUSINESS-JFC-LOAN",
      "SP-BUSINESS-CHAMBER",
    ],
  },
];

/** 単一シナリオを実行 */
export function runValidationScenario(
  scenarioName: string
): ScenarioEvaluation | null {
  const def = VALIDATION_SCENARIOS.find((s) => s.name === scenarioName);
  if (!def) return null;
  const result = evaluateScenario(def);
  if (def.name === "Case4" && result.input.isDoubleDisaster !== true) {
    result.gaps.push("isDoubleDisaster が true になっていない");
    result.passed = false;
  }
  return result;
}

/** 任意 CaseProfile で評価（開発者向け） */
export function evaluateCaseProfile(profile: CaseProfile): {
  matchedTriggers: string[];
  matchedPrograms: string[];
  matchedAlertIds: string[];
  priorityJourney: JourneyId | null;
  priorityActions: string[];
} {
  const evaluation = evaluateTriggers(profile);
  const matchedTriggers = evaluation.triggers.map((t) => t.id);
  const matchedPrograms = getRelevantPrograms(profile).map((p) => p.id);
  return {
    matchedTriggers,
    matchedPrograms,
    matchedAlertIds: evaluation.matchedAlertIds,
    priorityJourney: derivePriorityJourneyForScenario(matchedTriggers, profile),
    priorityActions: derivePriorityActions(matchedTriggers, profile),
  };
}

const RECOMMENDED_RULE_FIXES = [
  "prior2016Disaster + 被害 → TRIGGER-DOUBLE-DISASTER 専用トリガー",
  "全壊 + 賃貸 → 避難継続（TRIGGER-EVACUATION-CONTINUE）の明示",
  "事業復旧制度の sourceUrl・詳細条件の確認と更新",
  "宇土市 overlay の罹災証明・ライフライン詳細の追加調査",
];

/** 全6ケース実行 */
export function runAllValidationScenarios(): ValidationReport {
  const scenarios = VALIDATION_SCENARIOS.map((def) => {
    const result = evaluateScenario(def);
    if (def.name === "Case4" && result.input.isDoubleDisaster !== true) {
      result.gaps.push("isDoubleDisaster が true になっていない");
      result.passed = false;
    }
    return result;
  });

  return {
    generatedAt: new Date().toISOString(),
    total: scenarios.length,
    passed: scenarios.filter((s) => s.passed).length,
    failed: scenarios.filter((s) => !s.passed).length,
    scenarios,
    recommendedRuleFixes: RECOMMENDED_RULE_FIXES,
  };
}

/** コンソール向けテキストレポート */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [
    `# AIケースワーカー検証レポート`,
    `生成: ${report.generatedAt}`,
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];

  for (const s of report.scenarios) {
    lines.push(`## ${s.name}: ${s.description}`);
    lines.push(`passed: ${s.passed ? "✅" : "❌"}`);
    lines.push(`priorityJourney: ${s.priorityJourney ?? "—"}`);
    lines.push(`priorityActions: ${s.priorityActions.join(" → ") || "—"}`);
    lines.push(`matchedTriggers: ${s.matchedTriggers.join(", ") || "（なし）"}`);
    lines.push(`matchedPrograms: ${s.matchedPrograms.join(", ") || "（なし）"}`);
    if (s.gaps.length > 0) {
      lines.push("gaps:");
      for (const g of s.gaps) lines.push(`  - ${g}`);
    }
    lines.push("");
  }

  lines.push("## 次に修正すべき判断ルール");
  for (const fix of report.recommendedRuleFixes) {
    lines.push(`- ${fix}`);
  }

  return lines.join("\n");
}
