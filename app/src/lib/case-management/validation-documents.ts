/**
 * Document 管理検証 — Case1 / Case4 / Case6 Recovery
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
import {
  analyzeNextPreparation,
  getRebuildStatusDashboard,
} from "./document-gap";
import { getRequirementsForProgram } from "./document-requirements";
import {
  getDocumentRecordsForProgram,
  syncDocumentRecords,
} from "./document-records";

export interface DocumentValidationResult {
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

export function validateDocumentFlow(
  caseKey: string
): DocumentValidationResult {
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
      file = completeCaseAction(
        file,
        photo.id,
        triggersFrom(file),
        photoEvidenceInput()
      ).caseFile;
      steps.push("写真記録");

      const certRecords = getDocumentRecordsForProgram(
        file,
        "SP-DISASTER-CERTIFICATE"
      );
      const photoRecord = certRecords.find((r) => r.category === "photo");
      if (!photoRecord || photoRecord.status !== "submitted") {
        gaps.push(`写真記録: 期待 submitted / 実際 ${photoRecord?.status ?? "なし"}`);
      }

      const cert = getCurrentAction(file)!;
      if (cert.title !== "罹災証明書の申請を確認する") {
        gaps.push(`次Action: 期待「罹災証明書の申請を確認する」/ 実際「${cert.title}」`);
      }

      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;
      steps.push("罹災証明準備");

      const lifeProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-LIFE-REBUILD"
      );
      if (!lifeProc || lifeProc.status !== "preparing") {
        gaps.push(`生活再建 Procedure: 期待 preparing / 実際 ${lifeProc?.status ?? "?"}`);
      }

      file = syncDocumentRecords(file);
      const dashboard = getRebuildStatusDashboard(file, getCurrentAction(file));
      if (dashboard.nextPreparation.length === 0 && dashboard.prepared.length === 0) {
        gaps.push("再建状況ブロック用データが空");
      }

      const nextItems = analyzeNextPreparation(file, getCurrentAction(file));
      const hasFriendly = nextItems.some((i) => i.message.includes("確認に向けて"));
      if (!hasFriendly && nextItems.length > 0) {
        gaps.push("次に準備するものの文言が被災者向けでない");
      }
      steps.push("生活再建支援");
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
      steps.push("写真");

      file = syncDocumentRecords(file);
      const loanBefore = getDocumentRecordsForProgram(
        file,
        "SP-DISASTER-LOAN-RELIEF"
      ).find((r) => r.category === "disaster_certificate");
      if (loanBefore?.status === "submitted") {
        gaps.push("罹災証明前にローン側罹災証明が submitted");
      }

      const cert = getCurrentAction(file)!;
      file = completeCaseAction(file, cert.id, triggersFrom(file)).caseFile;
      steps.push("罹災証明準備");

      file = syncDocumentRecords(file);
      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (!loanProc || loanProc.status !== "preparing") {
        gaps.push(`ローン減免: 期待 preparing / 実際 ${loanProc?.status ?? "?"}`);
      }

      const nextItems = analyzeNextPreparation(file, getCurrentAction(file));
      if (!nextItems.some((i) => i.message.length > 0)) {
        gaps.push("ローン手続きの次に準備するものが空");
      }
      steps.push("ローン減免");
      break;
    }
    case "Case6": {
      const biz = getCurrentAction(file)!;
      file = completeCaseAction(file, biz.id, triggersFrom(file)).caseFile;
      steps.push("事業復旧");

      file = syncDocumentRecords(file);
      const reqs = getRequirementsForProgram("SP-BUSINESS-SME-RECOVERY");
      if (reqs.length !== 1 || reqs[0].kbStatus !== "unknown") {
        gaps.push("事業支援 Requirement が unknown 1件ではない");
      }

      const invented = reqs.filter((r) => r.kbStatus === "confirmed");
      if (invented.length > 0) {
        gaps.push("事業支援に推測 Requirement が含まれる");
      }

      const bizRecords = getDocumentRecordsForProgram(
        file,
        "SP-BUSINESS-SME-RECOVERY"
      );
      if (bizRecords.some((r) => r.status !== "unknown")) {
        gaps.push("事業支援 record が unknown 以外");
      }

      const dashboard = getRebuildStatusDashboard(file, getCurrentAction(file));
      const unknownNext = dashboard.nextPreparation.filter(
        (i) => i.recordStatus === "unknown"
      );
      if (unknownNext.length === 0 && reqs.length > 0) {
        gaps.push("unknown 準備項目が UI 用データにない");
      }
      steps.push("business unknown のみ");
      break;
    }
    default:
      gaps.push("未対応");
  }

  return { name: caseKey, steps, passed: gaps.length === 0, gaps };
}

export function runAllDocumentValidations() {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map(validateDocumentFlow);
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatDocumentReport(): string {
  const report = runAllDocumentValidations();
  const lines = [
    "# Document 管理検証レポート",
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
