/**
 * Recovery Phase — Acute / Recovery モード管理
 * docs/16 RecoveryPhase（Phase 1）
 */

import type { CaseProfile } from "@/lib/knowledge/types";
import { DISASTER_EVENT_R8_KUMAMOTO } from "@/lib/knowledge/municipalities";
import type { UserProfile } from "@/lib/types";
import type { CaseAction, CaseDecision, CaseFile, RecoveryPhase } from "./types";

export type RecoveryPhaseMode = RecoveryPhase["mode"];

/** 被災直後ウィンドウ（日） — 約72時間 */
export const ACUTE_WINDOW_DAYS = 3;

/** 自動 Recovery 移行（日） */
export const RECOVERY_AUTO_DAYS = 7;

const SAFETY_ACTION_IDS = new Set([
  "rw-j01-welfare-shelter",
  "rw-j01-family-safety",
]);

export const USER_RECOVERY_START_TRIGGER = "TRIGGER-USER-RECOVERY-START";

export function getRecoveryPhaseLabel(mode: RecoveryPhaseMode): string {
  return mode === "acute"
    ? "いまは安全の確認を優先"
    : "被害の記録と手続きの確認";
}

function daysSinceDisaster(referenceDate: Date = new Date()): number {
  const occurred = new Date(DISASTER_EVENT_R8_KUMAMOTO.occurredAt);
  const diff = referenceDate.getTime() - occurred.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface InitialRecoveryPhaseOptions {
  /** 検証・後方互換: フェーズを強制 */
  forceMode?: RecoveryPhaseMode;
  referenceDate?: Date;
}

/** 初期 RecoveryPhase を生成（既存 Case は migration で recovery デフォルト） */
export function createInitialRecoveryPhase(
  profile: UserProfile,
  caseProfile: CaseProfile,
  options?: InitialRecoveryPhaseOptions
): RecoveryPhase {
  const now = new Date().toISOString();
  const ref = options?.referenceDate ?? new Date();

  if (options?.forceMode) {
    return {
      mode: options.forceMode,
      enteredAt: now,
      transitionReason:
        options.forceMode === "acute"
          ? "被災直後のため発災直後フェーズで開始"
          : "再建フェーズで開始",
    };
  }

  if (profile.startRecoveryPhase === true) {
    return {
      mode: "recovery",
      enteredAt: now,
      transitionReason: "生活の立て直しの確認を始めました",
      transitionTriggerIds: [USER_RECOVERY_START_TRIGGER],
    };
  }

  const elapsed = daysSinceDisaster(ref);
  const transitionReason =
    elapsed >= RECOVERY_AUTO_DAYS
      ? `被災から${elapsed}日経過したため生活再建フェーズで開始`
      : "生活の立て直しの確認を始めました";

  return {
    mode: "recovery",
    enteredAt: now,
    transitionReason,
    transitionTriggerIds:
      elapsed >= RECOVERY_AUTO_DAYS
        ? ["TRIGGER-RECOVERY-ELAPSED"]
        : undefined,
  };
}

export function normalizeRecoveryPhase(
  raw: unknown,
  fallbackCreatedAt?: string
): RecoveryPhase {
  if (raw && typeof raw === "object" && "mode" in raw) {
    const p = raw as RecoveryPhase;
    if (p.mode === "acute" || p.mode === "recovery") {
      return {
        mode: p.mode,
        enteredAt: p.enteredAt ?? fallbackCreatedAt ?? new Date().toISOString(),
        transitionReason: p.transitionReason ?? "再建フェーズで開始",
        transitionTriggerIds: p.transitionTriggerIds,
      };
    }
  }
  return {
    mode: "recovery",
    enteredAt: fallbackCreatedAt ?? new Date().toISOString(),
    transitionReason: "既存ケースを再建フェーズとして継続",
  };
}

/** acute → recovery 移行判定 */
export function shouldTransitionToRecovery(
  caseFile: CaseFile,
  completedAction?: CaseAction
): boolean {
  if (caseFile.recoveryPhase?.mode !== "acute") return false;

  if (completedAction && SAFETY_ACTION_IDS.has(completedAction.id)) {
    return true;
  }

  if (daysSinceDisaster() >= RECOVERY_AUTO_DAYS) {
    return true;
  }

  return false;
}

export function buildRecoveryTransitionReason(
  completedAction?: CaseAction
): { reason: string; triggerIds: string[] } {
  if (completedAction && SAFETY_ACTION_IDS.has(completedAction.id)) {
    return {
      reason: "安全確保完了のため再建フェーズへ移行",
      triggerIds: completedAction.sourceTriggerIds,
    };
  }
  return {
    reason: "被災直後期間を経過したため再建フェーズへ移行",
    triggerIds: ["TRIGGER-RECOVERY-ELAPSED"],
  };
}

export function buildPhaseTransitionDecision(
  triggerIds: string[],
  previousPhase: RecoveryPhaseMode,
  nextPhase: RecoveryPhaseMode,
  reason: string
): CaseDecision {
  return {
    timestamp: new Date().toISOString(),
    triggerIds,
    selectedActionId: "phase-transition",
    selectedActionTitle: "フェーズ移行",
    reason,
    confidence: "high",
    outcome: "phase_transition",
    previousPhase,
    nextPhase,
  };
}

/** CaseFile を recovery フェーズへ移行し Action Queue を再生成 */
export function applyRecoveryPhaseTransition(
  caseFile: CaseFile,
  caseProfile: CaseProfile,
  familyAttributes: CaseFile["familyAttributes"],
  completedAction?: CaseAction
): CaseFile {
  const { reason, triggerIds } = buildRecoveryTransitionReason(completedAction);
  const now = new Date().toISOString();

  const newPhase: RecoveryPhase = {
    mode: "recovery",
    enteredAt: now,
    transitionReason: reason,
    transitionTriggerIds: triggerIds,
  };

  const decision = buildPhaseTransitionDecision(
    triggerIds,
    "acute",
    "recovery",
    reason
  );

  return {
    ...caseFile,
    recoveryPhase: newPhase,
    updatedAt: now,
    lastContactAt: now,
    workerMessage: reason,
    decisions: [...caseFile.decisions, decision],
  };
}

/** ユーザーが安全確保後に再建フェーズへ移行（既存 TRIGGER-USER-RECOVERY-START を使用） */
export function canUserStartRecoveryPhase(caseFile: CaseFile): boolean {
  return caseFile.recoveryPhase?.mode === "acute";
}

export function applyUserRecoveryPhaseTransition(
  caseFile: CaseFile
): CaseFile {
  const now = new Date().toISOString();
  const reason = "安全が取れたあと、生活の立て直しの確認を始めました";
  const triggerIds = [USER_RECOVERY_START_TRIGGER];

  const newPhase: RecoveryPhase = {
    mode: "recovery",
    enteredAt: now,
    transitionReason: reason,
    transitionTriggerIds: triggerIds,
  };

  const decision = buildPhaseTransitionDecision(
    triggerIds,
    "acute",
    "recovery",
    reason
  );

  return {
    ...caseFile,
    recoveryPhase: newPhase,
    updatedAt: now,
    lastContactAt: now,
    workerMessage: reason,
    decisions: [...caseFile.decisions, decision],
  };
}
