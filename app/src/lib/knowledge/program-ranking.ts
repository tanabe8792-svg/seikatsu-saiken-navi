import type { CaseProfile, CaseTrigger, SupportProgram } from "./types";
import { SUPPORT_PROGRAMS } from "./support-programs";
import { matchesAllConditions } from "./triggers";
import { MUNICIPALITY_CODES } from "./municipalities";

const HOUSING_REBUILD_PROGRAM_IDS = new Set([
  "SP-LIFE-REBUILD",
  "SP-TEMP-HOUSING",
  "SP-EMERGENCY-REPAIR",
]);

/** 断水・停電等の重大ライフライン問題 */
export function hasMajorLifeLineIssue(profile: CaseProfile): boolean {
  return (
    profile.hasWaterOutage === true || profile.hasPowerOutage === true
  );
}

/** 一部損壊かつライフライン問題なし（情報量抑制対象） */
export function isMinorDamageNoLifeline(profile: CaseProfile): boolean {
  return (
    profile.damageLevel === "一部損壊" && !hasMajorLifeLineIssue(profile)
  );
}

function matchesMunicipalityScope(
  profile: CaseProfile,
  program: SupportProgram
): boolean {
  const code = profile.municipalityCode;
  const scope = program.municipalityScope;

  switch (scope.type) {
    case "national":
      return true;
    case "prefecture":
      return !!code && code.startsWith(scope.code);
    case "municipalities":
      return !!code && scope.codes.includes(code);
    default:
      return false;
  }
}

/** 賃貸+全壊では生活再建支援（持家向け）を除外 */
function shouldExcludeProgram(
  profile: CaseProfile,
  programId: string
): boolean {
  if (
    programId === "SP-LIFE-REBUILD" &&
    profile.damageLevel === "全壊" &&
    profile.housingTenure === "賃貸"
  ) {
    return true;
  }
  return false;
}

function rankPrograms(
  profile: CaseProfile,
  programs: SupportProgram[]
): SupportProgram[] {
  const deprioritizeHousing = isMinorDamageNoLifeline(profile);

  return [...programs].sort((a, b) => {
    const aHousing = HOUSING_REBUILD_PROGRAM_IDS.has(a.id);
    const bHousing = HOUSING_REBUILD_PROGRAM_IDS.has(b.id);
    if (deprioritizeHousing && aHousing !== bHousing) {
      return aHousing ? 1 : -1;
    }
    const aBusiness = a.id.startsWith("SP-BUSINESS-");
    const bBusiness = b.id.startsWith("SP-BUSINESS-");
    if (aBusiness !== bBusiness) {
      return aBusiness ? -1 : 1;
    }
    return 0;
  });
}

/** ルールトリガーの優先度に基づく最大表示件数 */
export function getProgramDisplayLimit(
  profile: CaseProfile,
  ruleTriggers: CaseTrigger[]
): number {
  if (isMinorDamageNoLifeline(profile)) return 3;

  const hasCritical = ruleTriggers.some((t) => t.priority === "critical");
  const hasHigh = ruleTriggers.some((t) => t.priority === "high");
  if (hasCritical) return 5;
  if (hasHigh) return 4;
  return 3;
}

/** 条件合致制度をランキング・件数制限して返す */
export function filterRelevantPrograms(
  profile: CaseProfile,
  ruleTriggers: CaseTrigger[]
): SupportProgram[] {
  const matched = SUPPORT_PROGRAMS.filter(
    (program) =>
      matchesAllConditions(profile, program.targetConditions) &&
      matchesMunicipalityScope(profile, program) &&
      !shouldExcludeProgram(profile, program.id)
  );

  const ranked = rankPrograms(profile, matched);
  const limit = getProgramDisplayLimit(profile, ruleTriggers);
  return ranked.slice(0, limit);
}

/** 地域制度トリガーを抑制すべきか（軽微被害・単身向けノイズ抑制） */
export function shouldSuppressRegionalProgramsTrigger(
  profile: CaseProfile,
  programCount: number
): boolean {
  if (isMinorDamageNoLifeline(profile)) return true;
  return programCount === 0;
}
