import type {
  CaseProfile,
  CaseTrigger,
  TargetCondition,
  TriggerEvaluationResult,
} from "./types";
import { REGIONAL_ALERTS } from "./alerts";
import {
  filterRelevantPrograms,
  shouldSuppressRegionalProgramsTrigger,
} from "./program-ranking";
import { MUNICIPALITY_CODES } from "./municipalities";

const HOUSE_DAMAGE_LEVELS = ["全壊", "半壊", "一部損壊", "浸水"];

function hasHouseDamage(profile: CaseProfile): boolean {
  return (
    !!profile.damageLevel &&
    HOUSE_DAMAGE_LEVELS.includes(profile.damageLevel)
  );
}

function needsPhoto(profile: CaseProfile): boolean {
  const status = profile.photoRecordStatus ?? "none";
  return status === "none" || status === "partial";
}

function matchesCondition(
  profile: CaseProfile,
  condition: TargetCondition
): boolean {
  const fieldValue = profile[condition.field];

  switch (condition.operator) {
    case "true":
      return fieldValue === true;
    case "exists":
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
    case "eq":
      return fieldValue === condition.value;
    case "ne":
      return fieldValue !== condition.value;
    case "in":
      if (!Array.isArray(condition.value)) return false;
      return condition.value.includes(String(fieldValue));
    default:
      return false;
  }
}

export function matchesAllConditions(
  profile: CaseProfile,
  conditions: TargetCondition[]
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((c) => matchesCondition(profile, c));
}

function evaluatePhotoTrigger(profile: CaseProfile): CaseTrigger | null {
  if (!needsPhoto(profile) || !hasHouseDamage(profile)) {
    return null;
  }

  return {
    id: "TRIGGER-PHOTO-RECORD",
    priority: "critical",
    title: "被害写真の撮影",
    message:
      "片付け・修理の前に被害箇所の写真を撮影してください。外観全体と損傷部分を複数枚残すと、罹災証明・保険請求に役立ちます。",
    actionType: "photo_guidance",
    journeyId: "J-03",
  };
}

function evaluateWaterTrigger(profile: CaseProfile): CaseTrigger | null {
  if (!profile.hasWaterOutage) {
    return null;
  }

  return {
    id: "TRIGGER-WATER-PRIORITY",
    priority: "critical",
    title: "給水情報を優先",
    message:
      "断水が続いています。最寄りの給水所情報の確認を最優先にしてください。",
    actionType: "water_priority",
    journeyId: "J-02",
  };
}

function evaluate2016MortgageTrigger(profile: CaseProfile): CaseTrigger | null {
  if (!profile.prior2016Disaster || !profile.hasMortgage) {
    return null;
  }

  return {
    id: "TRIGGER-2016-LOAN-RELIEF",
    priority: "high",
    title: "被災ローン減免制度の確認",
    message:
      "2016年熊本地震での被災経験と住宅ローンがある場合、返済猶予・減免制度の対象になる可能性があります。",
    actionType: "program_candidate",
    relatedProgramIds: ["SP-DISASTER-LOAN-RELIEF"],
    journeyId: "J-04",
  };
}

const EVACUATION_SHELTER_KEYWORDS = ["避難所", "避難", "車中泊", "仮設"];

function isEvacuationShelter(status?: string): boolean {
  if (!status) return false;
  return EVACUATION_SHELTER_KEYWORDS.some((kw) => status.includes(kw));
}

function isRentalTenure(profile: CaseProfile): boolean {
  return profile.housingTenure === "賃貸";
}

function isSelfEmployed(profile: CaseProfile): boolean {
  return (
    profile.employmentType === "self_employed" ||
    profile.employmentType === "自営業"
  );
}

function evaluateTempHousingPriorityTrigger(
  profile: CaseProfile
): CaseTrigger | null {
  if (profile.damageLevel !== "全壊" || !isRentalTenure(profile)) {
    return null;
  }

  return {
    id: "TRIGGER-TEMP-HOUSING-PRIORITY",
    priority: "critical",
    title: "安全な住居確保を最優先",
    message:
      "賃貸住宅が全壊の場合、建物の再建より安全な住居確保を優先してください。応急仮設住宅・みなし仮設の検討、大家・管理会社への連絡を忘れずに。",
    actionType: "temp_housing_priority",
    relatedProgramIds: ["SP-TEMP-HOUSING"],
    journeyId: "J-05",
  };
}

function evaluateWelfareShelterTrigger(
  profile: CaseProfile
): CaseTrigger | null {
  if (!profile.hasElderly || !isEvacuationShelter(profile.shelterStatus)) {
    return null;
  }

  return {
    id: "TRIGGER-WELFARE-SHELTER",
    priority: "high",
    title: "福祉避難所の検討",
    message:
      "高齢者がいる避難世帯は、福祉避難所の利用を検討してください。服薬の確認、必要な介護サービスの継続可否も確認しましょう。",
    actionType: "welfare_shelter",
    journeyId: "J-01",
  };
}

function evaluateBusinessRecoveryTrigger(
  profile: CaseProfile
): CaseTrigger | null {
  if (!isSelfEmployed(profile) || profile.hasBusinessDamage !== true) {
    return null;
  }

  return {
    id: "TRIGGER-BUSINESS-RECOVERY",
    priority: "high",
    title: "事業復旧を優先確認",
    message:
      "住居の再建だけでなく、事業の復旧を優先して確認してください。営業継続可否、事業者向け支援制度（復旧支援・災害融資・商工会相談）をご案内します。",
    actionType: "business_recovery",
    relatedProgramIds: [
      "SP-BUSINESS-SME-RECOVERY",
      "SP-BUSINESS-JFC-LOAN",
      "SP-BUSINESS-CHAMBER",
    ],
    journeyId: "J-04",
  };
}

function evaluateInsuranceReportTrigger(
  profile: CaseProfile
): CaseTrigger | null {
  if (!hasHouseDamage(profile)) {
    return null;
  }

  return {
    id: "TRIGGER-INSURANCE-REPORT",
    priority: "high",
    title: "保険会社への事故報告",
    message:
      "火災保険・地震保険等に加入している場合、早めの事故報告が必要です。契約内容・報告期限は加入保険会社の案内を確認してください。",
    actionType: "program_candidate",
    relatedProgramIds: ["SP-INSURANCE-CLAIM"],
    journeyId: "J-04",
  };
}

function evaluateTaxSocialTrigger(profile: CaseProfile): CaseTrigger | null {
  if (!hasHouseDamage(profile)) {
    return null;
  }

  return {
    id: "TRIGGER-TAX-SOCIAL-SUPPORT",
    priority: "medium",
    title: "税・社会保険の被災者手続",
    message:
      "所得税・住民税の期限延長や社会保険料の免除・猶予等の制度があります。所管機関の公式案内で確認してください。",
    actionType: "program_candidate",
    relatedProgramIds: ["SP-TAX-SOCIAL-INSURANCE"],
    journeyId: "J-04",
  };
}

/** ルールベーストリガー（アラート・地域制度トリガー除く） */
export function evaluateRuleTriggers(profile: CaseProfile): CaseTrigger[] {
  const triggers: CaseTrigger[] = [];

  const evaluators = [
    evaluatePhotoTrigger,
    evaluateWaterTrigger,
    evaluateTempHousingPriorityTrigger,
    evaluateWelfareShelterTrigger,
    evaluateBusinessRecoveryTrigger,
    evaluate2016MortgageTrigger,
    evaluateInsuranceReportTrigger,
    evaluateTaxSocialTrigger,
  ];

  for (const evaluate of evaluators) {
    const trigger = evaluate(profile);
    if (trigger) triggers.push(trigger);
  }

  return triggers;
}

function evaluateRegionalProgramsTrigger(
  profile: CaseProfile,
  matchedProgramIds: string[]
): CaseTrigger | null {
  if (!profile.municipalityCode || !profile.damageLevel) {
    return null;
  }
  if (matchedProgramIds.length === 0) {
    return null;
  }

  return {
    id: "TRIGGER-REGIONAL-PROGRAMS",
    priority: "medium",
    title: "お住まいの地域の支援制度",
    message: `現在の状況に関連する支援制度が ${matchedProgramIds.length} 件見つかりました。`,
    actionType: "regional_programs",
    relatedProgramIds: matchedProgramIds,
    journeyId: "J-04",
  };
}

/** 既存 CaseProfile / UserProfile から判断ルールを評価 */
export function evaluateTriggers(
  profile: CaseProfile
): TriggerEvaluationResult {
  const triggers: CaseTrigger[] = [];
  const matchedAlertIds: string[] = [];

  const ruleTriggers = evaluateRuleTriggers(profile);
  triggers.push(...ruleTriggers);

  const relevantPrograms = filterRelevantPrograms(profile, ruleTriggers);
  const matchedProgramIds = relevantPrograms.map((p) => p.id);

  if (
    profile.municipalityCode &&
    profile.damageLevel &&
    !shouldSuppressRegionalProgramsTrigger(profile, matchedProgramIds.length)
  ) {
    const regionalTrigger = evaluateRegionalProgramsTrigger(
      profile,
      matchedProgramIds
    );
    if (regionalTrigger) triggers.push(regionalTrigger);
  }

  for (const alert of REGIONAL_ALERTS) {
    if (matchesAlertConditions(profile, alert.conditions)) {
      matchedAlertIds.push(alert.id);
      triggers.push({
        id: `TRIGGER-ALERT-${alert.id}`,
        priority: alert.priority === "low" ? "medium" : alert.priority,
        title: alert.title,
        message: alert.message,
        actionType: "alert",
        journeyId: alert.journeyIds[0],
      });
    }
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  triggers.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return { triggers, matchedProgramIds, matchedAlertIds };
}

function matchesAlertConditions(
  profile: CaseProfile,
  conditions: import("./types").AlertCondition
): boolean {
  if (
    conditions.municipalityCode &&
    profile.municipalityCode !== conditions.municipalityCode
  ) {
    return false;
  }
  if (
    conditions.hasWaterOutage === true &&
    profile.hasWaterOutage !== true
  ) {
    return false;
  }
  if (
    conditions.hasPowerOutage === true &&
    profile.hasPowerOutage !== true
  ) {
    return false;
  }
  if (conditions.hasChildren === true && profile.hasChildren !== true) {
    return false;
  }
  if (
    conditions.wantsDisasterCertificate === true &&
    profile.wantsDisasterCertificate !== true &&
    profile.disasterCertificateStatus !== "none" &&
    profile.disasterCertificateStatus !== undefined
  ) {
    return false;
  }
  if (conditions.wantsDisasterCertificate === true) {
    const wants =
      profile.wantsDisasterCertificate === true ||
      (hasHouseDamage(profile) &&
        profile.disasterCertificateStatus !== "issued" &&
        profile.disasterCertificateStatus !== "applied");
    if (!wants) return false;
  }
  if (conditions.damageLevels && profile.damageLevel) {
    if (!conditions.damageLevels.includes(profile.damageLevel)) {
      return false;
    }
  }
  if (conditions.journeyId) {
    void conditions.journeyId;
  }
  return true;
}

/** UserProfile の housingDamage を damageLevel に正規化 */
export function normalizeDamageLevel(
  housingDamage?: string
): string | undefined {
  if (!housingDamage) return undefined;
  const map: Record<string, string> = {
    全壊: "全壊",
    "全壊（住めない）": "全壊",
    半壊: "半壊",
    一部損壊: "一部損壊",
    浸水: "浸水",
    わからない: "わからない",
  };
  return map[housingDamage] ?? housingDamage;
}

/** アプリの UserProfile から Knowledge CaseProfile へ変換 */
export function toCaseProfile(
  input: Partial<CaseProfile> & {
    municipality?: string;
    housingDamage?: string;
    currentShelter?: string;
  }
): CaseProfile {
  const municipalityCode =
    input.municipalityCode ??
    (input.municipality
      ? resolveCodeFromName(input.municipality)
      : undefined);

  const damageLevel =
    input.damageLevel ?? normalizeDamageLevel(input.housingDamage);
  const damageCheck: CaseProfile = { damageLevel };

  return {
    municipalityCode,
    municipalityName: input.municipalityName ?? input.municipality,
    disasterEventId:
      input.disasterEventId ?? "DE-R8-KUMAMOTO-20260728",
    disasterType: input.disasterType,
    damageLevel,
    shelterStatus: input.shelterStatus ?? input.currentShelter,
    housingTenure: input.housingTenure,
    hasChildren: input.hasChildren,
    hasElderly: input.hasElderly,
    hasPet: input.hasPet,
    hasPowerOutage: input.hasPowerOutage,
    hasWaterOutage: input.hasWaterOutage,
    hasInjury: input.hasInjury,
    hasMortgage: input.hasMortgage,
    prior2016Disaster: input.prior2016Disaster,
    isDoubleDisaster:
      input.isDoubleDisaster ??
      (input.prior2016Disaster === true && hasHouseDamage(damageCheck)),
    photoRecordStatus: input.photoRecordStatus ?? "none",
    insuranceStatus: input.insuranceStatus ?? "unknown",
    disasterCertificateStatus: input.disasterCertificateStatus ?? "none",
    wantsDisasterCertificate:
      input.wantsDisasterCertificate ??
      (hasHouseDamage(damageCheck) &&
        input.disasterCertificateStatus !== "issued" &&
        input.disasterCertificateStatus !== "applied"),
    employmentType: input.employmentType,
    hasBusinessDamage: input.hasBusinessDamage,
  };
}

function resolveCodeFromName(name: string): string | undefined {
  const entries: [string, string][] = [
    ["熊本市", MUNICIPALITY_CODES.KUMAMOTO_CITY],
    ["宇城市", MUNICIPALITY_CODES.UKI_CITY],
    ["氷川町", MUNICIPALITY_CODES.HIKAWA_TOWN],
    ["八代市", MUNICIPALITY_CODES.YATSUSHIRO_CITY],
    ["甲佐町", MUNICIPALITY_CODES.KOSA_TOWN],
    ["宇土市", MUNICIPALITY_CODES.UTO_CITY],
  ];
  return entries.find(([n]) => n === name)?.[1];
}
