export type Priority = "immediate" | "week" | "month" | "later";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface UserProfile {
  address?: string;
  municipality?: string;
  disasterType?: string;
  housingDamage?: string;
  currentShelter?: string;
  householdSize?: number;
  hasElderly?: boolean;
  hasChildren?: boolean;
  hasPet?: boolean;
  hasPowerOutage?: boolean;
  hasWaterOutage?: boolean;
  hasGasOutage?: boolean;
  housingTenure?: string;
  hasMortgage?: boolean;
  prior2016Disaster?: boolean;
  isSelfEmployed?: boolean;
  /** 店舗・事業所の被害（自営業向け。未回答は undefined） */
  hasBusinessDamage?: boolean;
  /** 店舗・事業所の所在市町村（住まいと別の場合あり） */
  businessMunicipality?: string;
  notes?: string;
  /** J-00 初回ヒアリング完了フラグ */
  j00Completed?: boolean;
  /** 再建フェーズ開始をユーザーが選択 */
  startRecoveryPhase?: boolean;
}

/** 初回導入 — 表示専用（ActionQueue / KB 非連携） */
export type OnboardingTimingHint = "acute" | "weeks" | "months" | "partial";

/** 継続利用 — 前回確認時点（表示専用 · CaseFile 非変更） */
export interface ContinuitySnapshot {
  capturedAt: string;
  timelineEventIds: string[];
  primaryProcedureId?: string;
  primaryProcedureStatus?: string;
  currentActionId?: string;
  completedActionCount: number;
}

/** Knowledge Base 評価結果のホーム表示用サマリー @deprecated caseFile を優先 */
export interface CaseWorkerSummary {
  priorityJourney: string | null;
  primaryAction: {
    title: string;
    message: string;
    triggerId: string;
  };
  nextAction?: {
    title: string;
    message: string;
    triggerId: string;
  };
  generatedAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  procedureId?: string;
}

export interface ProcedureDetail {
  id: string;
  title: string;
  summary: string;
  documents: string[];
  submissionPlace: string;
  deadline: string;
  notes: string[];
  contact?: string;
  relatedActions: string[];
}

export interface UserSession {
  profile: UserProfile;
  actions: ActionItem[];
  chatHistory: ChatMessage[];
  updatedAt: string;
  /** J-00 途中再開用（1〜5） */
  j00Step?: number;
  /** ケースワーカー初回提案（後方互換） */
  caseWorkerSummary?: CaseWorkerSummary;
  /** Case Management Layer — 被災者ケースファイル */
  caseFile?: import("./case-management/types").CaseFile;
  /** J-00 完了直後の伴走メッセージ表示（1回） */
  showPostJ00Welcome?: boolean;
  /** 導入画面のタイミング選択 — 表示専用 */
  onboardingTimingHint?: OnboardingTimingHint;
  /** 継続利用 — 前回「一緒に確認した」操作時点 */
  continuitySnapshot?: ContinuitySnapshot;
}

export interface ChatApiResponse {
  message: string;
  profile?: UserProfile;
  actions?: ActionItem[];
  isComplete?: boolean;
  usedFallback?: boolean;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  immediate: "今すぐ",
  week: "数日以内",
  month: "1ヶ月以内",
  later: "後で確認",
};

export const PRIORITY_ORDER: Priority[] = [
  "immediate",
  "week",
  "month",
  "later",
];

export const STORAGE_KEY = "seikatsu-saiken-navi-session";
