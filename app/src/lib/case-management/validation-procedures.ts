/**
 * Procedure 追跡検証 — 6ケース
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { getPrimaryProcedure } from "./procedures";
import { extractFamilyAttributes } from "./index";

export interface ProcedureValidationResult {
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

function triggersFrom(file: ReturnType<typeof initCase>) {
  return [
    ...file.pendingActions,
    ...file.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);
}

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

export function validateProcedureFlow(
  caseKey: string
): ProcedureValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return { name: caseKey, steps: [], passed: false, gaps: ["ケース未定義"] };
  }

  const steps: string[] = [];
  const gaps: string[] = [];
  let file = initCase(example.profile);
  const triggers = triggersFrom(file);

  switch (caseKey) {
    case "Case1": {
      const water = getCurrentAction(file)!;
      file = completeCaseAction(file, water.id, triggers).caseFile;
      steps.push("給水完了");

      const photo = getCurrentAction(file)!;
      const blocked = completeCaseAction(file, photo.id, triggers);
      if (!blocked.blocked) gaps.push("写真: 証跡なしで完了できてしまった");

      file = completeCaseAction(
        file,
        photo.id,
        triggers,
        photoEvidenceInput()
      ).caseFile;
      steps.push("写真完了");

      const proc = getPrimaryProcedure(file, getCurrentAction(file));
      steps.push(`Procedure: ${proc?.name ?? "?"} / ${proc?.status ?? "?"}`);

      if (proc?.type !== "disaster_certificate") {
        gaps.push(`期待 disaster_certificate / 実際 ${proc?.type}`);
      }
      if (proc?.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${proc?.status}`);
      }

      const cert = getCurrentAction(file);
      if (cert?.title !== "罹災証明書の申請を確認する") {
        gaps.push(`次Action: 期待「罹災証明書の申請を確認する」/ 実際「${cert?.title}」`);
      }
      break;
    }
    case "Case4": {
      const photo = getCurrentAction(file)!;
      completeCaseAction(file, photo.id, triggers);
      file = completeCaseAction(
        file,
        photo.id,
        triggers,
        photoEvidenceInput()
      ).caseFile;
      steps.push("写真完了");

      let proc = getPrimaryProcedure(file, getCurrentAction(file));
      steps.push(`Procedure(写真後): ${proc?.name ?? "?"} / ${proc?.status ?? "?"}`);

      if (proc?.type !== "disaster_certificate") {
        gaps.push(`写真後: 期待 disaster_certificate / 実際 ${proc?.type}`);
      }
      if (proc?.status !== "preparing") {
        gaps.push(`写真後: 期待 preparing / 実際 ${proc?.status}`);
      }

      const loanAfterPhoto = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (loanAfterPhoto?.status === "preparing") {
        gaps.push("罹災証明前にローン減免が preparing になっている");
      }

      const cert = getCurrentAction(file)!;
      file = completeCaseAction(file, cert.id, triggers).caseFile;
      steps.push("罹災証明準備完了");

      proc =
        (file.procedures ?? []).find(
          (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
        ) ?? null;
      steps.push(`Procedure(証明後): ${proc?.name ?? "?"} / ${proc?.status ?? "?"}`);

      if (proc?.type !== "loan_relief") {
        gaps.push(`期待 loan_relief / 実際 ${proc?.type}`);
      }
      if (proc?.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${proc?.status}`);
      }
      break;
    }
    case "Case6": {
      const biz = getCurrentAction(file)!;
      file = completeCaseAction(file, biz.id, triggers).caseFile;
      steps.push("事業復旧完了");

      const proc = getPrimaryProcedure(file, getCurrentAction(file));
      steps.push(`Procedure: ${proc?.name ?? "?"} / ${proc?.status ?? "?"}`);

      if (proc?.type !== "business_support") {
        gaps.push(`期待 business_support / 実際 ${proc?.type}`);
      }
      if (proc?.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${proc?.status}`);
      }
      break;
    }
    default: {
      const proc = getPrimaryProcedure(file, getCurrentAction(file));
      steps.push(proc ? `${proc.name}:${proc.status}` : "Procedureなし");
    }
  }

  return {
    name: caseKey,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllProcedureValidations() {
  const keys = [
    "Case1",
    "Case2",
    "Case3",
    "Case4",
    "Case5",
    "Case6",
  ];
  const results = keys.map(validateProcedureFlow);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatProcedureReport(): string {
  const report = runAllProcedureValidations();
  const lines = [
    "# Procedure 追跡検証レポート",
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
