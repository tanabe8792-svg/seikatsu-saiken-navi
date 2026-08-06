/**
 * Deadline 検証 — Case1 / Case4 / Case6
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

export interface DeadlineValidationResult {
  name: string;
  deadlineCount: number;
  programIds: string[];
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

export function validateDeadlineFlow(
  caseKey: string
): DeadlineValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  const gaps: string[] = [];

  if (!example) {
    return {
      name: caseKey,
      deadlineCount: 0,
      programIds: [],
      passed: false,
      gaps: ["ケース未定義"],
    };
  }

  let file = initRecoveryCase(example.profile);
  const triggers = triggersFrom(file);

  switch (caseKey) {
    case "Case1": {
      const photo = getCurrentAction(file)!;
      file = completeCaseAction(
        file,
        photo.id,
        triggers,
        photoEvidenceInput()
      ).caseFile;
      triggersFrom(file);

      const cert = getCurrentAction(file)!;
      if (cert.title !== "罹災証明書の申請を確認する") {
        gaps.push(`期待「罹災証明書の申請を確認する」/ 実際「${cert.title}」`);
      }

      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;

      const programIds = (file.deadlines ?? []).map((d) => d.programId);
      if (!programIds.includes("SP-DISASTER-CERTIFICATE")) {
        gaps.push("罹災証明の期限が生成されていない");
      }
      if (!programIds.includes("SP-LIFE-REBUILD")) {
        gaps.push("生活再建支援金の期限が生成されていない");
      }
      for (const d of file.deadlines ?? []) {
        if (!d.sourceUrl || d.sourceUrl === "確認不可") {
          gaps.push(`出典なし期限: ${d.programId}`);
        }
      }
      break;
    }
    case "Case4": {
      const photo = getCurrentAction(file)!;
      file = completeCaseAction(
        file,
        photo.id,
        triggers,
        photoEvidenceInput()
      ).caseFile;

      const loanAfterPhoto = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (loanAfterPhoto?.status === "preparing") {
        gaps.push("罹災証明前にローン減免 Procedure が preparing");
      }

      const cert = getCurrentAction(file)!;
      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;

      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (!loanProc) {
        gaps.push("ローン減免 Procedure が存在しない");
      }
      if (loanProc && loanProc.status !== "preparing") {
        gaps.push(`ローン減免: 期待 preparing / 実際 ${loanProc.status}`);
      }

      const loanDl = (file.deadlines ?? []).find(
        (d) => d.programId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (!loanDl) {
        gaps.push("ローン減免 Deadline が生成されていない");
      } else if (!loanDl.procedureId) {
        gaps.push("ローン減免 Deadline に procedureId がない");
      }
      break;
    }
    case "Case6": {
      const biz = getCurrentAction(file)!;
      file = completeCaseAction(file, biz.id, triggersFrom(file)).caseFile;

      const bizProc = (file.procedures ?? []).find(
        (p) => p.type === "business_support"
      );
      if (!bizProc) {
        gaps.push("business_support Procedure が存在しない");
      }
      if (bizProc && bizProc.status !== "preparing") {
        gaps.push(`business_support: 期待 preparing / 実際 ${bizProc.status}`);
      }

      const bizDl = (file.deadlines ?? []).find(
        (d) => d.programId === "SP-BUSINESS-SME-RECOVERY"
      );
      if (bizDl) {
        gaps.push(
          "出典なしの business 期限が誤って生成された（SP-BUSINESS-SME-RECOVERY）"
        );
      }
      break;
    }
    default:
      gaps.push("未対応ケース");
  }

  const programIds = (file.deadlines ?? []).map((d) => d.programId);

  return {
    name: caseKey,
    deadlineCount: file.deadlines?.length ?? 0,
    programIds,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllDeadlineValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateDeadlineFlow);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatDeadlineReport(): string {
  const report = runAllDeadlineValidations();
  const lines = [
    "# Deadline 検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];
  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    lines.push(`期限数: ${r.deadlineCount}`);
    lines.push(`制度: ${r.programIds.join(", ") || "なし"}`);
    for (const g of r.gaps) lines.push(`  - ${g}`);
    lines.push("");
  }
  return lines.join("\n");
}
