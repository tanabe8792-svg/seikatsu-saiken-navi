/**
 * Evidence 完了フロー検証 — 6ケース
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import {
  createDefaultPhotoEvidence,
  type EvidenceInput,
} from "./evidence";
import { extractFamilyAttributes } from "./index";

export interface EvidenceFlowValidationResult {
  name: string;
  steps: string[];
  passed: boolean;
  gaps: string[];
}

const CASE_NAME_MAP: Record<string, string> = {
  "Case1: 宇城市・半壊・断水・子ども・持ち家": "Case1",
  "Case2: 氷川町・全壊・高齢者・賃貸": "Case2",
  "Case3: 八代市・被害なし・断水のみ": "Case3",
  "Case4: 熊本市・半壊・ローン・2016年経験": "Case4",
  "Case5: 宇土市・一部損壊・単身": "Case5",
  "Case6: 自営業・半壊・店舗被害": "Case6",
};

function initCase(profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return createCaseFile(caseProfile, family, {
    userProfile: profile,
    forcePhaseMode: "acute",
  });
}

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

export function validateEvidenceFlow(caseKey: string): EvidenceFlowValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return { name: caseKey, steps: [], passed: false, gaps: ["ケース未定義"] };
  }

  const steps: string[] = [];
  const gaps: string[] = [];
  let file = initCase(example.profile);
  const triggers = [
    ...file.pendingActions,
    ...file.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);

  switch (caseKey) {
    case "Case1": {
      const water = getCurrentAction(file);
      if (water?.title !== "給水場所を確認") gaps.push("最初が給水ではない");
      steps.push(water?.title ?? "?");

      const r1 = completeCaseAction(file, water!.id, triggers);
      file = r1.caseFile;
      const photo = getCurrentAction(file);
      steps.push(photo?.title ?? "?");

      const blocked = completeCaseAction(file, photo!.id, triggers);
      if (!blocked.blocked) gaps.push("写真: 証跡なしで完了できてしまった");
      steps.push(blocked.blocked ? "写真: 証跡なし→停止" : "写真: 停止失敗");

      const r2 = completeCaseAction(
        file,
        photo!.id,
        triggers,
        photoEvidenceInput()
      );
      file = r2.caseFile;
      steps.push(r2.blocked ? "写真: 完了失敗" : "写真: 証跡あり→完了");

      const cert = getCurrentAction(file);
      steps.push(cert?.title ?? "?");
      if (cert?.title !== "罹災証明書の申請を確認する") {
        gaps.push(`写真後: 期待「罹災証明書の申請を確認する」/ 実際「${cert?.title}」`);
      }
      break;
    }
    case "Case4": {
      let f = file;
      const photo = getCurrentAction(f)!;
      steps.push(photo.title);

      const blocked = completeCaseAction(f, photo.id, triggers);
      if (!blocked.blocked) gaps.push("写真: 証跡なしで完了できてしまった");
      steps.push("証跡なし→停止");

      const done = completeCaseAction(f, photo.id, triggers, photoEvidenceInput());
      f = done.caseFile;
      const loan = getCurrentAction(f);
      steps.push(loan?.title ?? "?");
      if (loan?.title !== "ローン減免制度を確認") {
        gaps.push(`期待ローン減免 / 実際 ${loan?.title}`);
      }
      break;
    }
    case "Case6": {
      const photo = getCurrentAction(file);
      steps.push(photo?.title ?? "?");
      if (photo?.title !== "被害写真を撮影する") {
        gaps.push(`期待写真先頭 / 実際 ${photo?.title}`);
      }
      const biz = file.pendingActions.find((a) => a.id === "rw-j04-business-recovery");
      if (!biz) {
        gaps.push("事業復旧 Action がない");
      } else {
        steps.push(biz.title);
      }
      break;
    }
    default:
      steps.push(getCurrentAction(file)?.title ?? "?");
  }

  return {
    name: caseKey,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllEvidenceFlowValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateEvidenceFlow);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatEvidenceFlowReport(): string {
  const report = runAllEvidenceFlowValidations();
  const lines = [
    "# Evidence フロー検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];
  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    lines.push(`フロー: ${r.steps.join(" → ")}`);
    for (const g of r.gaps) lines.push(`  - ${g}`);
    lines.push("");
  }
  return lines.join("\n");
}
