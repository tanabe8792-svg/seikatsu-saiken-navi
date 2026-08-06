import type {
  CaseProfile,
  MunicipalityContext,
  SupportProgram,
  TriggerEvaluationResult,
} from "./types";
import type { UserProfile } from "../types";
import { REGIONAL_ALERTS } from "./alerts";
import { getDisasterOverlay } from "./disaster-overlays";
import {
  DISASTER_EVENT_R8_KUMAMOTO,
  getMunicipalityByCode,
  resolveMunicipalityCode,
} from "./municipalities";
import {
  evaluateTriggers,
  evaluateRuleTriggers,
  toCaseProfile,
} from "./triggers";
import { filterRelevantPrograms } from "./program-ranking";

export type { CaseProfile, MunicipalityContext, TriggerEvaluationResult };
export type {
  DisasterOverlay,
  Municipality,
  RegionalAlert,
  SupportProgram,
  CaseTrigger,
  SourcedValue,
} from "./types";

export {
  MUNICIPALITIES,
  MUNICIPALITY_CODES,
  DISASTER_EVENT_R8_KUMAMOTO,
  getMunicipalityByCode,
  resolveMunicipalityCode,
} from "./municipalities";

export {
  DISASTER_OVERLAYS,
  getDisasterOverlay,
  getOverlaysForDisaster,
} from "./disaster-overlays";

export {
  SUPPORT_PROGRAMS,
  getSupportProgramById,
  getAllSupportPrograms,
} from "./support-programs";

export {
  PROGRAM_DEADLINE_TEMPLATES,
  getDeadlineTemplateByProgramId,
  getAllProgramDeadlineTemplates,
} from "./program-deadlines";
export type {
  ProgramDeadlineTemplate,
  ProgramDeadlineType,
  DeadlineCalculation,
} from "./program-deadlines";

export { REGIONAL_ALERTS, getAllAlerts } from "./alerts";

export {
  evaluateTriggers,
  evaluateRuleTriggers,
  toCaseProfile,
  normalizeDamageLevel,
  matchesAllConditions,
} from "./triggers";

export { derivePriorityJourney, shouldPrioritizeSafetyJourney } from "./priority-journey";
export {
  filterRelevantPrograms,
  getProgramDisplayLimit,
  hasMajorLifeLineIssue,
  isMinorDamageNoLifeline,
} from "./program-ranking";

export type { ScenarioResult } from "./types";
export {
  VALIDATION_SCENARIOS,
  runValidationScenario,
  runAllValidationScenarios,
  evaluateCaseProfile,
  formatValidationReport,
} from "./validation-scenarios";
export type {
  ScenarioEvaluation,
  ScenarioProgramResult,
  ScenarioJourneyResult,
  ValidationReport,
} from "./validation-scenarios";

function matchesAlertForProfile(
  profile: CaseProfile,
  alert: (typeof REGIONAL_ALERTS)[number]
): boolean {
  const c = alert.conditions;
  if (c.municipalityCode && profile.municipalityCode !== c.municipalityCode) {
    return false;
  }
  if (c.hasWaterOutage && !profile.hasWaterOutage) return false;
  if (c.hasPowerOutage && !profile.hasPowerOutage) return false;
  if (c.hasChildren && !profile.hasChildren) return false;
  if (c.damageLevels && profile.damageLevel) {
    if (!c.damageLevels.includes(profile.damageLevel)) return false;
  }
  if (c.wantsDisasterCertificate) {
    const wants =
      profile.wantsDisasterCertificate === true ||
      (profile.damageLevel &&
        ["全壊", "半壊", "一部損壊", "浸水"].includes(profile.damageLevel) &&
        profile.disasterCertificateStatus !== "issued" &&
        profile.disasterCertificateStatus !== "applied");
    if (!wants) return false;
  }
  return true;
}

/** UserProfile から CaseProfile を構築 */
export function caseProfileFromUserProfile(
  userProfile: UserProfile,
  extras?: Partial<CaseProfile>
): CaseProfile {
  return toCaseProfile({
    municipality: userProfile.municipality,
    housingDamage: userProfile.housingDamage,
    currentShelter: userProfile.currentShelter,
    disasterType: userProfile.disasterType,
    hasChildren: userProfile.hasChildren,
    hasElderly: userProfile.hasElderly,
    hasPowerOutage: userProfile.hasPowerOutage,
    hasWaterOutage: userProfile.hasWaterOutage,
    ...extras,
  });
}

/** 自治体コードから地域コンテキスト（オーバーレイ・アラート・制度・トリガー）を取得 */
export function getMunicipalityContext(
  municipalityCodeOrName: string,
  profileInput?: Partial<CaseProfile> | UserProfile,
  disasterEventId: string = DISASTER_EVENT_R8_KUMAMOTO.id
): MunicipalityContext {
  const code = resolveMunicipalityCode(municipalityCodeOrName);
  const municipality = code ? getMunicipalityByCode(code) ?? null : null;
  const overlay = code
    ? getDisasterOverlay(code, disasterEventId) ?? null
    : null;

  const profile: CaseProfile =
    profileInput && "housingDamage" in (profileInput as UserProfile)
      ? caseProfileFromUserProfile(profileInput as UserProfile)
      : toCaseProfile({
          ...(profileInput as Partial<CaseProfile>),
          municipalityCode: code,
        });

  if (code && !profile.municipalityCode) {
    profile.municipalityCode = code;
  }

  const programs = getRelevantPrograms(profile);
  const alerts = REGIONAL_ALERTS.filter((a) =>
    matchesAlertForProfile(profile, a)
  );
  const { triggers } = evaluateTriggers(profile);

  return {
    municipality,
    overlay,
    alerts,
    programs,
    triggers,
  };
}

/** CaseProfile に該当する支援制度をフィルタ（件数制限・優先度付き） */
export function getRelevantPrograms(
  profile: CaseProfile
): SupportProgram[] {
  const ruleTriggers = evaluateRuleTriggers(profile);
  return filterRelevantPrograms(profile, ruleTriggers);
}

/** AI ケースワーカー API 向け Runtime Context */
export function buildCaseWorkerKnowledgeContext(profile: CaseProfile): {
  municipalityContext: MunicipalityContext;
  triggerEvaluation: TriggerEvaluationResult;
  generatedAt: string;
} {
  const municipalityContext = getMunicipalityContext(
    profile.municipalityCode ?? profile.municipalityName ?? "",
    profile
  );
  const triggerEvaluation = evaluateTriggers(profile);

  return {
    municipalityContext,
    triggerEvaluation,
    generatedAt: new Date().toISOString(),
  };
}
