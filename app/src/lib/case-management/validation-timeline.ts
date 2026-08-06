/**
 * Case Timeline 検証 — Case1 / Case4 / Case6 Recovery
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import {
  formatActionCompletedSummary,
  generateTimelineEventsFromCaseFile,
  getCaseTimelineDashboard,
  syncCaseTimeline,
} from "./case-timeline";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";

export interface TimelineValidationResult {
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

const PROFESSIONAL_TERMS = [
  "CaseDecision",
  "Trigger",
  "ProcedureStatus",
  "KB",
  "RW Action",
  "申請準備中",
];

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
  return syncCaseTimeline(
    createCaseFile(caseProfile, family, {
      userProfile: profile,
      forcePhaseMode: "recovery",
    })
  );
}

function assertNoProfessionalTerms(
  summaries: string[],
  gaps: string[],
  label: string
) {
  for (const summary of summaries) {
    for (const term of PROFESSIONAL_TERMS) {
      if (summary.includes(term)) {
        gaps.push(`${label}: 専門家向け表現「${term}」`);
      }
    }
  }
}

function assertHasEventType(
  events: ReturnType<typeof generateTimelineEventsFromCaseFile>,
  type: string,
  gaps: string[],
  label: string
) {
  if (!events.some((e) => e.type === type)) {
    gaps.push(`${label}: ${type} イベントなし`);
  }
}

export function validateTimelineFlow(
  caseKey: string
): TimelineValidationResult {
  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => CASE_NAME_MAP[e.name] === caseKey
  );
  if (!example) {
    return { name: caseKey, steps: [], passed: false, gaps: ["ケース未定義"] };
  }

  const steps: string[] = [];
  const gaps: string[] = [];
  let file = initRecoveryCase(example.profile);

  const initialTimeline = file.timeline ?? [];
  if (initialTimeline.length === 0) {
    gaps.push("初期タイムラインが空");
  }
  steps.push("初期生成");

  switch (caseKey) {
    case "Case1": {
      const photo = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          photo.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      steps.push("写真記録");

      const afterPhoto = file.timeline ?? [];
      assertHasEventType(afterPhoto, "evidence_added", gaps, "Case1");
      assertHasEventType(afterPhoto, "action_completed", gaps, "Case1");

      const photoCompleted = file.completedActions.find((a) => a.id === photo.id);
      if (photoCompleted) {
        const summary = formatActionCompletedSummary(photoCompleted);
        if (!summary.includes("被害写真")) {
          gaps.push(`写真完了要約: ${summary}`);
        }
      }

      const cert = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(file, cert.id, triggersFrom(file)).caseFile
      );
      steps.push("罹災証明準備");

      const certProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-DISASTER-CERTIFICATE"
      );
      if (certProc?.status === "preparing") {
        const hasStarted = (file.timeline ?? []).some(
          (e) =>
            e.type === "procedure_started" &&
            e.relatedIds.includes(certProc.id)
        );
        if (!hasStarted) {
          gaps.push("罹災証明 procedure_started なし");
        }
      }

      const dashboard = getCaseTimelineDashboard(file, getCurrentAction(file));
      if (dashboard.pastEvents.length < 1) {
        gaps.push("直近履歴が空");
      }
      if (!dashboard.nextActionTitle) {
        gaps.push("次 Action 表示なし");
      }
      assertNoProfessionalTerms(
        [
          ...dashboard.pastEvents.map((e) => e.summary),
          dashboard.currentStatus ?? "",
          dashboard.nextActionTitle ?? "",
        ],
        gaps,
        "Case1 UI"
      );
      steps.push("ダッシュボード");
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
      steps.push("写真記録");

      const cert = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(file, cert.id, triggersFrom(file)).caseFile
      );
      steps.push("罹災証明準備");

      const loanProc = (file.procedures ?? []).find(
        (p) => p.relatedProgramId === "SP-LOAN-RELIEF"
      );
      if (loanProc && loanProc.status === "not_started") {
        steps.push("ローン relief 未着手（期待）");
      }

      const dashboard = getCaseTimelineDashboard(file, getCurrentAction(file));
      assertNoProfessionalTerms(
        dashboard.pastEvents.map((e) => e.summary),
        gaps,
        "Case4"
      );
      if (dashboard.pastEvents.length < 2) {
        gaps.push(`Case4 履歴件数不足: ${dashboard.pastEvents.length}`);
      }
      steps.push("Case4 履歴");
      break;
    }
    case "Case6": {
      const photo = getCurrentAction(file)!;
      file = syncCaseTimeline(
        completeCaseAction(
          file,
          photo.id,
          triggersFrom(file),
          photoEvidenceInput()
        ).caseFile
      );
      steps.push("写真記録");

      const events = file.timeline ?? [];
      assertHasEventType(events, "deadline_created", gaps, "Case6");
      assertHasEventType(events, "phase_transition", gaps, "Case6");

      const dashboard = getCaseTimelineDashboard(file, getCurrentAction(file));
      if (!dashboard.currentStatus && !dashboard.nextActionTitle) {
        gaps.push("現在/次の表示が両方空");
      }
      steps.push("Case6 タイムライン");
      break;
    }
    default:
      gaps.push(`未対応ケース: ${caseKey}`);
  }

  const timelineIds = new Set((file.timeline ?? []).map((e) => e.id));
  if (timelineIds.size !== (file.timeline ?? []).length) {
    gaps.push("タイムライン ID 重複");
  }

  return {
    name: caseKey,
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllTimelineValidations(): {
  results: TimelineValidationResult[];
  passed: number;
  total: number;
} {
  const keys = ["Case1", "Case4", "Case6"];
  const results = keys.map((k) => validateTimelineFlow(k));
  const passed = results.filter((r) => r.passed).length;
  return { results, passed, total: results.length };
}

export function formatTimelineReport(): string {
  const { results, passed, total } = runAllTimelineValidations();
  const lines = ["=== Case Timeline Validation ===", ""];
  for (const r of results) {
    lines.push(`${r.passed ? "✓" : "✗"} ${r.name}`);
    lines.push(`  steps: ${r.steps.join(" → ")}`);
    if (r.gaps.length) {
      lines.push(`  gaps: ${r.gaps.join("; ")}`);
    }
    lines.push("");
  }
  lines.push(`Result: ${passed}/${total} passed`);
  return lines.join("\n");
}
