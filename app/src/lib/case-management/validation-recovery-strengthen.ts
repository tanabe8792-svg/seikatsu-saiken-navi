/**
 * Recovery Phase 強化検証 — UI/helpers + Recovery Mode フロー Case1/4/6
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
  refreshActionQueueForPhase,
} from "./action-queue";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import {
  getAcuteExternalLinksForRecovery,
  getProcedureOverview,
  getRecoveryPhaseDisplay,
} from "./recovery-dashboard";
import {
  applyUserRecoveryPhaseTransition,
  canUserStartRecoveryPhase,
  USER_RECOVERY_START_TRIGGER,
} from "./recovery-phase";
import { ACTION_TEMPLATES, isTemplateIncludedInPhase } from "./action-templates";
import { syncCaseTimeline } from "./case-timeline";

export interface RecoveryStrengthenValidationResult {
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

function initAcuteCase(
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
) {
  const caseProfile = buildCaseProfileFromUserProfile(profile);
  const family = extractFamilyAttributes(profile);
  return createCaseFile(caseProfile, family, {
    userProfile: profile,
    forcePhaseMode: "acute",
  });
}

export function validateRecoveryStrengthenHelpers(): RecoveryStrengthenValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const recoveryDisplay = getRecoveryPhaseDisplay("recovery");
  if (recoveryDisplay.title !== "生活の立て直し") {
    gaps.push(`段階表示: ${recoveryDisplay.title}`);
  }
  if (!recoveryDisplay.subtitle.includes("被害の記録")) {
    gaps.push("再建段階 subtitle 不足");
  }
  steps.push("getRecoveryPhaseDisplay");

  const acuteHidden = ACTION_TEMPLATES.filter(
    (t) => t.id === "rw-j02-water-station" || t.id === "rw-j01-welfare-shelter"
  );
  for (const t of acuteHidden) {
    if (isTemplateIncludedInPhase(t, "recovery")) {
      gaps.push(`${t.id} が Recovery に含まれている`);
    }
  }
  steps.push("phaseScope acute 非表示");

  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === "Case1"
  )!;
  const acuteFile = initAcuteCase(example.profile);
  if (!canUserStartRecoveryPhase(acuteFile)) {
    gaps.push("acute ケースで canUserStartRecoveryPhase が false");
  }

  let transitioned = applyUserRecoveryPhaseTransition(acuteFile);
  const caseProfile = buildCaseProfileFromUserProfile(example.profile);
  transitioned = refreshActionQueueForPhase(
    transitioned,
    caseProfile,
    "recovery"
  );
  const decision = transitioned.decisions.find(
    (d) => d.outcome === "phase_transition"
  );
  if (!decision) gaps.push("ユーザー移行で CaseDecision 未記録");
  if (!decision?.triggerIds.includes(USER_RECOVERY_START_TRIGGER)) {
    gaps.push("TRIGGER-USER-RECOVERY-START 未記録");
  }
  if (getCurrentAction(transitioned)?.title === "給水場所を確認") {
    gaps.push("ユーザー移行後も給水が先頭");
  }
  steps.push("ユーザー再建開始導線");

  const recoveryFile = initRecoveryCase(example.profile);
  const links = getAcuteExternalLinksForRecovery(example.profile, recoveryFile);
  if (links.length === 0) {
    gaps.push("Case1 Recovery で外部導線が0件");
  }
  if (!links.every((l) => l.sourceUrl.startsWith("http"))) {
    gaps.push("外部導線に出典 URL なし");
  }
  steps.push("外部導線");

  return {
    name: "Helpers",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validateRecoveryStrengthenFlow(
  caseKey: string
): RecoveryStrengthenValidationResult {
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
      let photoDone = completeCaseAction(
        file,
        photo.id,
        triggersFrom(file),
        photoEvidenceInput()
      );
      if (
        photoDone.blocked ||
        getCurrentAction(photoDone.caseFile)?.id === photo.id
      ) {
        photoDone = completeCaseAction(
          file,
          photo.id,
          triggersFrom(file),
          undefined,
          { alreadyCompletedOutside: true }
        );
      }
      file = syncCaseTimeline(photoDone.caseFile);
      steps.push("写真");

      const cert = getCurrentAction(file)!;
      if (cert.id === "rw-j03-cert-prep" || cert.title.includes("罹災")) {
        file = syncCaseTimeline(
          completeCaseAction(file, cert.id, triggersFrom(file)).caseFile
        );
      }
      steps.push("罹災証明準備");

      const overview = getProcedureOverview(file, getCurrentAction(file));
      const lifeItem = overview.find((o) =>
        o.name.includes("生活再建")
      );
      if (!lifeItem) {
        gaps.push("手続き一覧に生活再建支援がない");
      } else if (
        lifeItem.statusLabel !== "申請の準備中" &&
        lifeItem.statusLabel !== "申請準備中" &&
        lifeItem.statusLabel !== "まだ申請していない"
      ) {
        gaps.push(`生活再建: 想定外の状態 / 実際 ${lifeItem.statusLabel}`);
      }
      steps.push("生活再建支援金");
      break;
    }
    case "Case4": {
      const photo = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          photo.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      steps.push("写真");

      const cert = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(file, cert.id, triggersFrom(file)).caseFile
      );
      steps.push("罹災証明準備");

      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-LOAN-RELIEF"
      );
      if (!loanProc) {
        gaps.push("ローン減免の手続きがありません");
      }

      const overview = getProcedureOverview(file, getCurrentAction(file));
      if (!overview.some((o) => o.name.includes("ローン"))) {
        gaps.push("手続き一覧にローン減免がない");
      }
      steps.push("ローン減免維持");
      break;
    }
    case "Case6": {
      const biz = file.pendingActions.find((a) => a.id === "rw-j04-business-recovery");
      if (!biz) {
        gaps.push("事業復旧 Action がない");
        break;
      }
      file = completeCaseAction(file, biz.id, triggersFrom(file)).caseFile;
      steps.push("事業復旧");

      const bizProc = (file.procedures ?? []).find(
        (p) => p.type === "business_support"
      );
      if (!bizProc || bizProc.status !== "preparing") {
        gaps.push(`business_support: 期待 preparing / 実際 ${bizProc?.status ?? "?"}`);
      }

      const overview = getProcedureOverview(file, getCurrentAction(file));
      if (!overview.some((o) => o.name.includes("中小企業"))) {
        gaps.push("手続き一覧に business_support がない");
      }
      steps.push("business_support");
      break;
    }
    default:
      gaps.push("未対応");
  }

  return { name: caseKey, steps, passed: gaps.length === 0, gaps };
}

export function runAllRecoveryStrengthenValidations() {
  const helper = validateRecoveryStrengthenHelpers();
  const flows = ["Case1", "Case4", "Case6"].map(validateRecoveryStrengthenFlow);
  const results = [helper, ...flows];
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    results,
  };
}

export function formatRecoveryStrengthenReport(): string {
  const report = runAllRecoveryStrengthenValidations();
  const lines = [
    "# Recovery Phase 強化検証レポート",
    `結果: ${report.passed}/${report.total} passed`,
    "",
  ];
  for (const r of report.results) {
    lines.push(`## ${r.name}: ${r.passed ? "✅" : "❌"}`);
    if (r.steps.length > 0) lines.push(`フロー: ${r.steps.join(" → ")}`);
    for (const g of r.gaps) lines.push(`  - ${g}`);
    lines.push("");
  }
  return lines.join("\n");
}
