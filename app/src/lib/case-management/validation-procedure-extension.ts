/**
 * Procedure 拡張検証 — Recovery フェーズ Case1 / Case4 / Case6
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import { getPrimaryProcedure } from "./procedures";
import { areProcedurePrerequisitesMet } from "./procedure-dependencies";

export interface ProcedureExtensionValidationResult {
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

function initRecoveryCase(
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return createCaseFile(caseProfile, family, {
    userProfile: profile,
    forcePhaseMode: "recovery",
  });
}

function triggersFrom(file: ReturnType<typeof initRecoveryCase>) {
  return [
    ...file.pendingActions,
    ...file.completedActions,
  ].flatMap((a) => a.sourceTriggerIds);
}

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

export function validateProcedureExtensionFlow(
  caseKey: string
): ProcedureExtensionValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return { name: caseKey, steps: [], passed: false, gaps: ["ケース未定義"] };
  }

  const steps: string[] = [];
  const gaps: string[] = [];
  let file = initRecoveryCase(example.profile);

  switch (caseKey) {
    case "Case1": {
      const photo = getCurrentAction(file)!;
      if (photo.title !== "被害写真を撮影する") {
        gaps.push(`Recovery 先頭: 期待「被害写真を撮影する」/ 実際「${photo.title}」`);
      }

      file = completeCaseAction(
        file,
        photo.id,
        triggersFrom(file),
        photoEvidenceInput()
      ).caseFile;
      steps.push("写真完了");

      let proc = getPrimaryProcedure(file, getCurrentAction(file));
      steps.push(`Procedure: ${proc?.type ?? "?"} / ${proc?.status ?? "?"}`);

      if (proc?.type !== "disaster_certificate") {
        gaps.push(`期待 disaster_certificate / 実際 ${proc?.type}`);
      }

      const lifeBeforeCert = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-LIFE-REBUILD"
      );
      const lifeDep = areProcedurePrerequisitesMet(
        file.procedures ?? [],
        "SP-LIFE-REBUILD"
      );
      if (lifeBeforeCert?.status === "preparing" && !lifeDep.met) {
        gaps.push("罹災証明前に生活再建支援が preparing");
      }

      const cert = getCurrentAction(file)!;
      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;
      steps.push("罹災証明準備完了");

      proc =
        (file.procedures ?? []).find(
          (p) => p.relatedProgramId === "SP-LIFE-REBUILD"
        ) ?? null;
      steps.push(`生活再建: ${proc?.type ?? "?"} / ${proc?.status ?? "?"}`);

      if (!proc) {
        gaps.push("生活再建支援 Procedure が生成されていない");
      } else if (proc.type !== "life_rebuild_grant") {
        gaps.push(`期待 life_rebuild_grant / 実際 ${proc.type}`);
      } else if (proc.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${proc.status}`);
      }

      const lifeDl = (file.deadlines ?? []).find(
        (d) => d.programId === "SP-LIFE-REBUILD"
      );
      if (!lifeDl) {
        gaps.push("生活再建支援の Deadline が生成されていない");
      } else if (lifeDl.status !== "unknown") {
        gaps.push(`期限不明の制度: 期待 unknown / 実際 ${lifeDl.status}`);
      }
      break;
    }
    case "Case4": {
      const photo = getCurrentAction(file)!;
      file = completeCaseAction(
        file,
        photo.id,
        triggersFrom(file),
        photoEvidenceInput()
      ).caseFile;
      steps.push("写真完了");

      const loanAfterPhoto = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (loanAfterPhoto?.status === "preparing") {
        gaps.push("罹災証明前にローン減免が preparing");
      }

      const cert = getCurrentAction(file)!;
      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;
      steps.push("罹災証明準備完了");

      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      steps.push(`ローン減免: ${loanProc?.status ?? "?"}`);

      if (!loanProc) {
        gaps.push("ローン減免 Procedure が存在しない");
      } else if (loanProc.type !== "loan_relief") {
        gaps.push(`期待 loan_relief / 実際 ${loanProc.type}`);
      } else if (loanProc.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${loanProc.status}`);
      }
      break;
    }
    case "Case6": {
      const biz = getCurrentAction(file)!;
      if (biz.title !== "事業復旧を確認") {
        gaps.push(`Recovery 先頭: 期待「事業復旧を確認」/ 実際「${biz.title}」`);
      }

      file = completeCaseAction(file, biz.id, triggersFrom(file)).caseFile;
      steps.push("事業復旧完了");

      const proc = (file.procedures ?? []).find(
        (p) => p.type === "business_support"
      );
      steps.push(`Procedure: ${proc?.name ?? "?"} / ${proc?.status ?? "?"}`);

      if (!proc) {
        gaps.push("business_support Procedure が存在しない");
      } else if (proc.status !== "preparing") {
        gaps.push(`期待 preparing / 実際 ${proc.status}`);
      }
      break;
    }
    default:
      gaps.push("未対応ケース");
  }

  return {
    name: caseKey,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllProcedureExtensionValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateProcedureExtensionFlow);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatProcedureExtensionReport(): string {
  const report = runAllProcedureExtensionValidations();
  const lines = [
    "# Procedure 拡張検証レポート（Recovery）",
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
