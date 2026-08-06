/**
 * Knowledge Base — 全国災害対応可能な型定義
 * 特定自治体・特定災害に依存しない汎用型のみ
 */

/** 出典付きフィールド。sourceUrl が null の場合 value は「確認不可」 */
export interface SourcedValue<T = string> {
  value: T | "確認不可";
  sourceUrl: string | null;
  updatedAt: string;
}

export interface Municipality {
  code: string;
  name: string;
  prefecture: string;
  prefectureCode: string;
  officialUrl: string;
  /** 現在アクティブな災害救助法適用等 */
  disasterApplicable: boolean;
}

export interface LifelineIssues {
  waterOutage: SourcedValue<string>;
  powerOutage: SourcedValue<string>;
  gasOutage: SourcedValue<string>;
  waterStationCount: SourcedValue<number>;
  waterStationInfoUrl: SourcedValue<string>;
}

export interface CertificateInfo {
  summary: SourcedValue<string>;
  onlineAvailable: SourcedValue<boolean>;
  onlineUrl: SourcedValue<string>;
  officeHours: SourcedValue<string>;
  dailyLimit: SourcedValue<number | null>;
  ticketSystem: SourcedValue<boolean>;
  requiredDocuments: SourcedValue<string[]>;
  notes: SourcedValue<string>;
}

export interface DisasterOverlay {
  disasterEventId: string;
  disasterName: string;
  municipalityCode: string;
  intensity: SourcedValue<string>;
  damageSummary: SourcedValue<string>;
  lifelineIssues: LifelineIssues;
  certificateInfo: CertificateInfo;
  sourceUrl: string;
  updatedAt: string;
}

export type JourneyId =
  | "J-00"
  | "J-01"
  | "J-02"
  | "J-03"
  | "J-04"
  | "J-05"
  | "J-06";

export type MunicipalityScope =
  | { type: "national" }
  | { type: "prefecture"; code: string }
  | { type: "municipalities"; codes: string[] };

export interface TargetCondition {
  field: keyof CaseProfile;
  operator: "eq" | "ne" | "in" | "exists" | "true";
  value?: string | string[] | boolean;
}

export interface SupportProgram {
  id: string;
  name: string;
  journeyId: JourneyId;
  targetConditions: TargetCondition[];
  requiredDocuments: string[];
  municipalityScope: MunicipalityScope;
  sourceUrl: string;
  updatedAt: string;
  description?: string;
}

export type AlertPriority = "critical" | "high" | "medium" | "low";

export interface AlertCondition {
  municipalityCode?: string;
  hasWaterOutage?: boolean;
  hasPowerOutage?: boolean;
  hasChildren?: boolean;
  wantsDisasterCertificate?: boolean;
  damageLevels?: string[];
  journeyId?: JourneyId;
}

export interface RegionalAlert {
  id: string;
  conditions: AlertCondition;
  title: string;
  message: string;
  priority: AlertPriority;
  journeyIds: JourneyId[];
  sourceUrl: string;
  updatedAt: string;
}

export type TriggerPriority = "critical" | "high" | "medium" | "low";

export interface CaseTrigger {
  id: string;
  priority: TriggerPriority;
  title: string;
  message: string;
  actionType:
    | "photo_guidance"
    | "water_priority"
    | "program_candidate"
    | "regional_programs"
    | "alert"
    | "temp_housing_priority"
    | "welfare_shelter"
    | "business_recovery";
  relatedProgramIds?: string[];
  journeyId?: JourneyId;
}

/** ケースワーカー判断用プロファイル（UserProfile のスーパーセット） */
export interface CaseProfile {
  municipalityCode?: string;
  municipalityName?: string;
  disasterEventId?: string;
  disasterType?: string;
  damageLevel?: string;
  shelterStatus?: string;
  housingTenure?: string;
  hasChildren?: boolean;
  hasElderly?: boolean;
  hasPet?: boolean;
  hasPowerOutage?: boolean;
  hasWaterOutage?: boolean;
  hasMortgage?: boolean;
  /** けが・負傷の有無（J-01 優先判断用） */
  hasInjury?: boolean;
  prior2016Disaster?: boolean;
  isDoubleDisaster?: boolean;
  photoRecordStatus?: "none" | "partial" | "complete";
  insuranceStatus?: "unknown" | "enrolled" | "reported" | "claimed";
  disasterCertificateStatus?: "none" | "applied" | "issued";
  wantsDisasterCertificate?: boolean;
  /** 自営業 / 雇用等（「自営業」または self_employed） */
  employmentType?:
    | "employed"
    | "self_employed"
    | "自営業"
    | "unemployed"
    | "other";
  /** 検証・将来分岐用: 店舗・事業所の被害 */
  hasBusinessDamage?: boolean;
}

/** 検証シナリオの期待結果との差分 */
export interface ScenarioResult {
  name: string;
  expectedTriggers: string[];
  actualTriggers: string[];
  passed: boolean;
}

export interface MunicipalityContext {
  municipality: Municipality | null;
  overlay: DisasterOverlay | null;
  alerts: RegionalAlert[];
  programs: SupportProgram[];
  triggers: CaseTrigger[];
}

export interface TriggerEvaluationResult {
  triggers: CaseTrigger[];
  matchedProgramIds: string[];
  matchedAlertIds: string[];
}
