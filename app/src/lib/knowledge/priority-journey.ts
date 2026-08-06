import type { CaseProfile, CaseTrigger, JourneyId } from "./types";

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const EVACUATION_SHELTER_KEYWORDS = ["避難所", "避難", "車中泊", "仮設"];

function isEvacuationShelter(status?: string): boolean {
  if (!status) return false;
  return EVACUATION_SHELTER_KEYWORDS.some((kw) => status.includes(kw));
}

/** 安全確保ジャーニー（J-01）を優先すべき状況 */
export function shouldPrioritizeSafetyJourney(profile: CaseProfile): boolean {
  return (
    profile.damageLevel === "全壊" ||
    isEvacuationShelter(profile.shelterStatus) ||
    profile.hasElderly === true ||
    profile.hasInjury === true
  );
}

function sortByTriggerPriority(triggers: CaseTrigger[]): CaseTrigger[] {
  return [...triggers].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}

/** トリガー群とプロファイルから最優先ジャーニーを決定 */
export function derivePriorityJourney(
  triggers: CaseTrigger[],
  profile: CaseProfile
): JourneyId | null {
  if (triggers.length === 0) return null;

  if (shouldPrioritizeSafetyJourney(profile)) {
    const j01Triggers = triggers.filter((t) => t.journeyId === "J-01");
    if (j01Triggers.length > 0) {
      return sortByTriggerPriority(j01Triggers)[0]?.journeyId ?? "J-01";
    }
  }

  return sortByTriggerPriority(triggers)[0]?.journeyId ?? null;
}
