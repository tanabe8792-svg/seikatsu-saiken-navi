/**
 * 継続利用 UX 検証 — docs/21
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  completeCaseAction,
  createCaseFile,
  getCurrentAction,
} from "./action-queue";
import {
  buildContinuitySnapshot,
  computeChangesSinceSnapshot,
  formatContinuityDeadlineMessage,
  getContinuityDashboard,
} from "./continuity-dashboard";
import { syncCaseTimeline } from "./case-timeline";
import { assertSurvivorJapaneseQuality } from "./survivor-copy-quality";
import { formatDeadlineDisplay } from "./deadlines";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import type { CaseFile } from "./types";
import type { ContinuitySnapshot } from "@/lib/types";

export interface ContinuityUxValidationResult {
  name: string;
  steps: string[];
  passed: boolean;
  gaps: string[];
}

const FORBIDDEN_TERMS = [
  "Procedure",
  "Evidence",
  "CaseDecision",
  "Trigger",
  "RW Action",
  "KB",
  "ActionQueue",
  "証跡",
  "おかえり",
];

const FORBIDDEN_DEADLINE_PATTERNS = [/あと\d+日/, /過ぎています/, /申請期限まで/];

function photoEvidenceInput(): EvidenceInput {
  const ev = createDefaultPhotoEvidence("rw-j03-photo");
  return { type: ev.type, metadata: ev.metadata };
}

function triggersFrom(file: CaseFile) {
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

function collectContinuityStrings(
  dashboard: ReturnType<typeof getContinuityDashboard>
): string[] {
  return [
    dashboard.sectionTitle,
    dashboard.currentSituation,
    dashboard.situationContext ?? "",
    dashboard.progressReassurance ?? "",
    dashboard.nextAction.headline,
    dashboard.nextAction.description,
    dashboard.deadlineNote?.message ?? "",
    ...dashboard.changesSinceLastVisit.map((c) => c.summary),
    ...dashboard.completedItems.map((c) => c.summary),
    ...dashboard.needsAttention.map((n) => n.message),
    dashboard.whyThisGuidance,
    ...dashboard.relatedSupportNames,
  ];
}

export function validateContinuitySnapshotStructure(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find((e) =>
    e.name.startsWith("Case1:")
  );
  if (!example) {
    return {
      name: "snapshot-structure",
      steps: [],
      passed: false,
      gaps: ["Case1 未定義"],
    };
  }

  const caseFile = initRecoveryCase(example.profile);
  const current = getCurrentAction(caseFile);
  if (!current) {
    gaps.push("Case1: first Action なし");
  } else {
    const snapshot = buildContinuitySnapshot(caseFile, current);
    if (!snapshot.capturedAt) gaps.push("capturedAt 空");
    if (!Array.isArray(snapshot.timelineEventIds)) {
      gaps.push("timelineEventIds が配列でない");
    }
    if (typeof snapshot.completedActionCount !== "number") {
      gaps.push("completedActionCount が数値でない");
    }
    if (snapshot.currentActionId !== current.id) {
      gaps.push("currentActionId が current Action と不一致");
    }
  }
  steps.push("スナップショット構造");

  return {
    name: "snapshot-structure",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

/** ホーム表示のみでは変化が消えない — 旧スナップショットで差分が残る */
export function validateViewDoesNotConsumeChanges(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find((e) =>
    e.name.startsWith("Case1:")
  );
  if (!example) {
    return {
      name: "view-preserves-changes",
      steps: [],
      passed: false,
      gaps: ["Case1 未定義"],
    };
  }

  let caseFile = initRecoveryCase(example.profile);
  const current = getCurrentAction(caseFile);
  if (!current) {
    return {
      name: "view-preserves-changes",
      steps: [],
      passed: false,
      gaps: ["first Action なし"],
    };
  }

  const oldSnapshot: ContinuitySnapshot = buildContinuitySnapshot(
    caseFile,
    current
  );

  const evidence =
    current.id === "rw-j03-photo" ? photoEvidenceInput() : undefined;
  const result = completeCaseAction(
    caseFile,
    current.id,
    triggersFrom(caseFile),
    evidence
  );
  caseFile = syncCaseTimeline(result.caseFile);

  const changesAfterProgress = computeChangesSinceSnapshot(
    oldSnapshot,
    caseFile,
    getCurrentAction(caseFile)
  );
  if (changesAfterProgress.length === 0) {
    gaps.push("操作後も旧スナップショットとの差分が表示されるべき");
  }

  const dashboard = getContinuityDashboard(
    caseFile,
    example.profile,
    oldSnapshot
  );
  if (dashboard.changesSinceLastVisit.length === 0) {
    gaps.push("getContinuityDashboard: 前回からの変化ブロックが空");
  }
  steps.push("表示のみでは差分維持");

  return {
    name: "view-preserves-changes",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

/** ヒーローカード操作相当 — 新スナップショット保存後は当該差分が吸収される */
export function validateHeroActionUpdatesSnapshot(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find((e) =>
    e.name.startsWith("Case1:")
  );
  if (!example) {
    return {
      name: "hero-action-snapshot",
      steps: [],
      passed: false,
      gaps: ["Case1 未定義"],
    };
  }

  let caseFile = initRecoveryCase(example.profile);
  const current = getCurrentAction(caseFile);
  if (!current) {
    return {
      name: "hero-action-snapshot",
      steps: [],
      passed: false,
      gaps: ["first Action なし"],
    };
  }

  const evidence =
    current.id === "rw-j03-photo" ? photoEvidenceInput() : undefined;
  const result = completeCaseAction(
    caseFile,
    current.id,
    triggersFrom(caseFile),
    evidence
  );
  caseFile = syncCaseTimeline(result.caseFile);
  const next = getCurrentAction(caseFile);

  const newSnapshot = buildContinuitySnapshot(caseFile, next);
  const changesAfterSave = computeChangesSinceSnapshot(
    newSnapshot,
    caseFile,
    next
  );
  if (changesAfterSave.length > 0) {
    gaps.push(
      `操作直後スナップショット保存後も差分あり: ${changesAfterSave.map((c) => c.summary).join(", ")}`
    );
  }
  steps.push("ヒーロー操作でスナップショット更新");

  return {
    name: "hero-action-snapshot",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validateFirstVisitNoChanges(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find((e) =>
    e.name.startsWith("Case4:")
  );
  if (!example) {
    return {
      name: "first-visit",
      steps: [],
      passed: false,
      gaps: ["Case4 未定義"],
    };
  }

  const caseFile = initRecoveryCase(example.profile);
  const dashboard = getContinuityDashboard(
    caseFile,
    example.profile,
    undefined
  );

  if (dashboard.changesSinceLastVisit.length !== 0) {
    gaps.push("初回（スナップショットなし）は前回からの変化を出さない");
  }
  if (dashboard.sectionTitle !== "あなたの再建状況") {
    gaps.push(`sectionTitle: ${dashboard.sectionTitle}`);
  }
  steps.push("初回訪問");

  return {
    name: "first-visit",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validateContinuityDeadlineTone(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const base = {
    id: "test",
    templateId: "t",
    programId: "p",
    type: "application" as const,
    label: "罹災証明",
    dueDate: "2026-12-31",
    sourceUrl: "",
    updatedAt: "",
    reminderDaysBefore: [],
    createdAt: "",
  };

  const statuses = [
    "unknown",
    "due_soon",
    "overdue",
    "upcoming",
    "completed",
  ] as const;

  for (const status of statuses) {
    const message = formatContinuityDeadlineMessage({ ...base, status });
    if (status === "upcoming" || status === "completed") {
      if (message) gaps.push(`${status}: 空であるべき`);
      continue;
    }
    if (!message) {
      gaps.push(`${status}: 伴走メッセージなし`);
      continue;
    }
    for (const pattern of FORBIDDEN_DEADLINE_PATTERNS) {
      if (pattern.test(message)) {
        gaps.push(`${status}: 禁止パターン ${pattern}`);
      }
    }
    const harsh = formatDeadlineDisplay({
      ...base,
      status: "overdue",
      dueDate: "2020-01-01",
    });
    if (message === harsh) {
      gaps.push(`${status}: formatDeadlineDisplay と同一文言`);
    }
  }
  steps.push("伴走期限トーン");

  return {
    name: "deadline-tone",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validateContinuityDashboardQuality(): ContinuityUxValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find((e) =>
    e.name.startsWith("Case6:")
  );
  if (!example) {
    return {
      name: "dashboard-quality",
      steps: [],
      passed: false,
      gaps: ["Case6 未定義"],
    };
  }

  const caseFile = initRecoveryCase(example.profile);
  const before = JSON.stringify(caseFile);
  const dashboard = getContinuityDashboard(caseFile, example.profile, undefined);
  const after = JSON.stringify(caseFile);

  if (before !== after) {
    gaps.push("getContinuityDashboard が CaseFile を変更した");
  }

  const strings = collectContinuityStrings(dashboard);
  for (const text of strings) {
    for (const term of FORBIDDEN_TERMS) {
      if (text.includes(term)) {
        gaps.push(`禁止語「${term}」: ${text.slice(0, 40)}`);
      }
    }
  }

  assertSurvivorJapaneseQuality(
    strings.map((text, i) => ({ label: `continuity-dashboard[${i}]`, text })),
    gaps
  );

  for (const item of dashboard.needsAttention) {
    if (item.kind === "deadline") {
      gaps.push("needsAttention に deadline が残っている");
    }
  }

  const changeSet = new Set(
    dashboard.changesSinceLastVisit.map((c) => c.summary)
  );
  for (const item of dashboard.completedItems) {
    if (changeSet.has(item.summary)) {
      gaps.push(`completedItems と changes の重複: ${item.summary}`);
    }
  }

  if (!dashboard.nextAction.headline) {
    gaps.push("nextAction.headline 空");
  }
  steps.push("Dashboard品質");

  return {
    name: "dashboard-quality",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllContinuityUxValidations(): {
  results: ContinuityUxValidationResult[];
  passed: number;
  total: number;
} {
  const results = [
    validateContinuitySnapshotStructure(),
    validateFirstVisitNoChanges(),
    validateViewDoesNotConsumeChanges(),
    validateHeroActionUpdatesSnapshot(),
    validateContinuityDeadlineTone(),
    validateContinuityDashboardQuality(),
  ];
  return {
    results,
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

export function formatContinuityUxReport(): string {
  const { results, passed, total } = runAllContinuityUxValidations();
  const lines = ["=== Continuity UX Validation ===", ""];
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
