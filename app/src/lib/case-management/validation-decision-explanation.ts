/**
 * 判断説明 UI 検証 — Case1 / Case4 / Case6
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
  explanationIncludesTrigger,
  explanationReasonIncludes,
} from "./decision-explanation";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";

export interface DecisionExplanationValidationResult {
  name: string;
  actionTitle: string;
  primaryReason: string;
  triggerIds: string[];
  passed: boolean;
  gaps: string[];
}

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

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

export function validateDecisionExplanation(
  caseKey: string
): DecisionExplanationValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  const gaps: string[] = [];

  if (!example) {
    return {
      name: caseKey,
      actionTitle: "",
      primaryReason: "",
      triggerIds: [],
      passed: false,
      gaps: ["ケース未定義"],
    };
  }

  const caseProfile = buildCaseProfileFromUserProfile(example.profile);
  const family = extractFamilyAttributes(example.profile);
  let file = createCaseFile(caseProfile, family, {
    userProfile: example.profile,
    forcePhaseMode: caseKey === "Case1" ? "acute" : "recovery",
  });
  const triggers = triggersFrom(file);

  switch (caseKey) {
    case "Case1": {
      const water = getCurrentAction(file)!;
      const explanation = buildActionDecisionExplanation(
        file,
        water,
        example.profile
      );

      if (!explanationIncludesTrigger(explanation, "TRIGGER-WATER-PRIORITY")) {
        gaps.push("TRIGGER-WATER-PRIORITY が条件に含まれない");
      }
      if (!explanationReasonIncludes(explanation, "断水")) {
        gaps.push("給水優先理由に「断水」が含まれない");
      }

      return {
        name: caseKey,
        actionTitle: water.title,
        primaryReason: explanation.primaryReason,
        triggerIds: explanation.conditions.map((c) => c.triggerId),
        passed: gaps.length === 0,
        gaps,
      };
    }
    case "Case4": {
      const photo = getCurrentAction(file)!;
      file = completeCaseAction(
        file,
        photo.id,
        triggers,
        photoEvidenceInput()
      ).caseFile;

      const loan = getCurrentAction(file)!;
      const explanation = buildActionDecisionExplanation(
        file,
        loan,
        example.profile
      );

      if (!explanationIncludesTrigger(explanation, "TRIGGER-2016-LOAN-RELIEF")) {
        gaps.push("TRIGGER-2016-LOAN-RELIEF が条件に含まれない");
      }
      if (
        !explanationReasonIncludes(explanation, "2016") &&
        !explanationReasonIncludes(explanation, "ローン")
      ) {
        gaps.push("ローン減免理由に 2016年/ローン が含まれない");
      }
      if (explanation.relatedPrograms.length === 0) {
        gaps.push("関連制度（SP-DISASTER-LOAN-RELIEF）が表示されない");
      }

      return {
        name: caseKey,
        actionTitle: loan.title,
        primaryReason: explanation.primaryReason,
        triggerIds: explanation.conditions.map((c) => c.triggerId),
        passed: gaps.length === 0,
        gaps,
      };
    }
    case "Case6": {
      const biz = getCurrentAction(file)!;
      const explanation = buildActionDecisionExplanation(
        file,
        biz,
        example.profile
      );

      if (!explanationIncludesTrigger(explanation, "TRIGGER-BUSINESS-RECOVERY")) {
        gaps.push("TRIGGER-BUSINESS-RECOVERY が条件に含まれない");
      }
      if (!explanationReasonIncludes(explanation, "事業")) {
        gaps.push("事業復旧理由に「事業」が含まれない");
      }

      return {
        name: caseKey,
        actionTitle: biz.title,
        primaryReason: explanation.primaryReason,
        triggerIds: explanation.conditions.map((c) => c.triggerId),
        passed: gaps.length === 0,
        gaps,
      };
    }
    default:
      return {
        name: caseKey,
        actionTitle: "",
        primaryReason: "",
        triggerIds: [],
        passed: false,
        gaps: ["未対応ケース"],
      };
  }
}

export function runAllDecisionExplanationValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateDecisionExplanation);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatDecisionExplanationReport(): string {
  const report = runAllDecisionExplanationValidations();
  const lines = [
    "# 判断説明 UI 検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];
  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    lines.push(`Action: ${r.actionTitle}`);
    lines.push(`理由: ${r.primaryReason}`);
    lines.push(`Triggers: ${r.triggerIds.join(", ") || "なし"}`);
    for (const g of r.gaps) lines.push(`  - ${g}`);
    lines.push("");
  }
  return lines.join("\n");
}
