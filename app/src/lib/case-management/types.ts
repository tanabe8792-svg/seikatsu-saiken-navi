/**
 * Case Management Layer — 型定義
 * docs/08 RW Action / docs/06 ケースワーカー設計との整合
 */

import type { JourneyId } from "@/lib/knowledge/types";
import type { CompletionRule, Evidence, EvidenceStatus } from "./evidence";
import type { ExternalProcedure } from "./procedures";
import type { CaseDeadline } from "./deadlines";

export type { CaseDeadline, CaseDeadlineStatus } from "./deadlines";

export type { CompletionRule, Evidence, EvidenceStatus };
export type { EvidenceType } from "./evidence";
export type { ExternalProcedure, ProcedureStatus, ProcedureType } from "./procedures";

export type CaseActionPriority = "critical" | "high" | "medium" | "low";

export type CaseActionStatus = "todo" | "doing" | "done" | "skipped";

export type CaseFileStatus =
  | "active"
  | "waiting_user"
  | "waiting_external"
  | "completed";

export type RecoveryPhaseMode = "acute" | "recovery";

/** Acute（発災直後）/ Recovery（再建伴走）モード */
export interface RecoveryPhase {
  mode: RecoveryPhaseMode;
  enteredAt: string;
  transitionReason: string;
  transitionTriggerIds?: string[];
}

export interface FamilyAttributes {
  hasChildren?: boolean;
  hasElderly?: boolean;
  hasPet?: boolean;
  isSelfEmployed?: boolean;
}

/** Real World Action（docs/08 接続） */
export interface CaseAction {
  id: string;
  rwActionId: string;
  journeyId: JourneyId;
  title: string;
  description: string;
  /** 被災者向け説明理由 */
  reason: string;
  priority: CaseActionPriority;
  required: boolean;
  status: CaseActionStatus;
  evidenceRequired: boolean;
  completionRule: CompletionRule;
  sourceTriggerIds: string[];
  relatedProgramIds?: string[];
  completedAt?: string;
}

/** ケースワーカー判断ログ（ブラックボックス禁止） */
export interface CaseDecision {
  timestamp: string;
  triggerIds: string[];
  selectedActionId: string;
  selectedActionTitle: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  /** 完了時: 直前に完了した Action */
  previousAction?: { id: string; title: string };
  /** 完了時の証跡状態 */
  evidenceStatus?: "none" | "submitted" | "verified" | "rejected" | "not_required";
  /** 次に提示する Action */
  nextAction?: { id: string; title: string };
  /** selected=提示 / completed=完了 / blocked_missing_evidence=証跡不足 / phase_transition=フェーズ移行 / document_gap_priority=準備項目優先 */
  outcome?:
    | "selected"
    | "completed"
    | "blocked_missing_evidence"
    | "phase_transition"
    | "document_gap_priority";
  /** フェーズ移行時 */
  previousPhase?: RecoveryPhaseMode;
  nextPhase?: RecoveryPhaseMode;
}

/** 被災者ケースファイル（将来 DB 移行可能なフラット構造） */
export interface CaseFile {
  caseId: string;
  /**
   * 紙・口頭・QR用の公開番号（例: KMT-74XQ-3L）
   * 内部 caseId とは別。docs/26
   */
  publicCaseId?: string;
  /**
   * 端末内のみ保持する回復コード（平文）。
   * サーバー移行時はハッシュのみ保存する想定。
   */
  recoveryCode?: string;
  createdAt: string;
  updatedAt: string;
  municipalityCode?: string;
  municipalityName?: string;
  damageLevel?: string;
  housingTenure?: string;
  familyAttributes: FamilyAttributes;
  activeJourney: JourneyId | null;
  pendingActions: CaseAction[];
  completedActions: CaseAction[];
  riskScore: number;
  lastContactAt: string;
  status: CaseFileStatus;
  decisions: CaseDecision[];
  /** V2: Action 証跡一覧 */
  evidences?: Evidence[];
  /** V3: 外部手続き一覧 */
  procedures?: ExternalProcedure[];
  /** Phase 1: Acute / Recovery モード */
  recoveryPhase?: RecoveryPhase;
  /** Phase 1: 期限管理 */
  deadlines?: CaseDeadline[];
  /** 再建伴走: 書類・記録台帳（docs/17） */
  documentRecords?: import("./document-records").DocumentRecord[];
  /** 再建履歴タイムライン（docs/18 — 既存データから派生） */
  timeline?: import("./case-timeline").CaseTimelineEvent[];
  /** ケースワーカーからの最新メッセージ（リマインド・完了通知） */
  workerMessage?: string;
}

export interface CaseActionQueueResult {
  caseFile: CaseFile;
  triggerIds: string[];
}

/** Action 完了試行結果 */
export interface CompleteActionResult {
  caseFile: CaseFile;
  blocked: boolean;
  workerMessage?: string;
}
