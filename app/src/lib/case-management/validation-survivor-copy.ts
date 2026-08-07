/**
 * 被災者向けコピーの日本語品質検証
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import { collectOnboardingIntroStrings } from "@/lib/onboarding/onboarding-copy";
import {
  TRUST_ABOUT_SERVICE,
  TRUST_CONTINUITY_SUPPORT,
  TRUST_DEVELOPER,
  TRUST_FAQ_OPERATOR_ANSWER,
  TRUST_FEEDBACK,
  TRUST_INFO_HANDLING,
  TRUST_PERSONAL_DATA,
  TRUST_PAGE_TITLE,
  TRUST_WHY_BUILT,
} from "@/lib/trust/trust-copy";
import {
  completeCaseAction,
  createCaseFile,
  getCompanionCopyCatalog,
  getCurrentAction,
} from "./action-queue";
import { createDefaultPhotoEvidence, type EvidenceInput } from "./evidence";
import { extractFamilyAttributes } from "./index";
import { getContinuityDashboard } from "./continuity-dashboard";
import {
  buildCurrentSituation,
  getSurvivorSituationDashboard,
} from "./recovery-dashboard";
import {
  assertSurvivorJapaneseQuality,
  formatCopyLintReport,
  lintSurvivorJapaneseBatch,
} from "./survivor-copy-quality";
import { syncCaseTimeline } from "./case-timeline";

export interface SurvivorCopyValidationResult {
  name: string;
  checked: number;
  failures: number;
  passed: boolean;
  gaps: string[];
}

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

function collectStaticCopyStrings(): Array<{ label: string; text: string }> {
  const entries: Array<{ label: string; text: string }> = [];

  getCompanionCopyCatalog().forEach((text, i) => {
    entries.push({ label: `companion-catalog[${i}]`, text });
  });

  collectOnboardingIntroStrings().forEach((text, i) => {
    entries.push({ label: `onboarding[${i}]`, text });
  });

  const trustStrings = [
    TRUST_PAGE_TITLE,
    TRUST_ABOUT_SERVICE.heading,
    ...TRUST_ABOUT_SERVICE.body,
    TRUST_WHY_BUILT.heading,
    ...TRUST_WHY_BUILT.body,
    TRUST_DEVELOPER.heading,
    TRUST_DEVELOPER.name,
    TRUST_DEVELOPER.nameReading,
    TRUST_DEVELOPER.affiliation,
    ...TRUST_DEVELOPER.body,
    TRUST_INFO_HANDLING.heading,
    ...TRUST_INFO_HANDLING.body,
    TRUST_PERSONAL_DATA.heading,
    ...TRUST_PERSONAL_DATA.body,
    TRUST_FEEDBACK.lead,
    TRUST_FEEDBACK.note,
    TRUST_CONTINUITY_SUPPORT.heading,
    ...TRUST_CONTINUITY_SUPPORT.body,
    TRUST_CONTINUITY_SUPPORT.bodyWhenPending,
    TRUST_CONTINUITY_SUPPORT.bodyWhenReady,
    TRUST_FAQ_OPERATOR_ANSWER,
  ];
  trustStrings.forEach((text, i) => {
    entries.push({ label: `trust[${i}]`, text });
  });

  return entries;
}

function collectScenarioCopyStrings(): Array<{ label: string; text: string }> {
  const entries: Array<{ label: string; text: string }> = [];

  for (const example of J00_VALIDATION_EXAMPLES) {
    const label = example.name.split(":")[0] ?? example.name;
    let file = initRecoveryCase(example.profile);
    const profile = example.profile;

    let current = getCurrentAction(file);
    if (!current) continue;

    const pushDashboard = (phase: string) => {
      const survivor = getSurvivorSituationDashboard(file, current!, profile);
      const continuity = getContinuityDashboard(file, profile);

      entries.push({
        label: `${label}/${phase}/currentSituation`,
        text: survivor.currentSituation,
      });
      entries.push({
        label: `${label}/${phase}/situation-built`,
        text: buildCurrentSituation(file, current!, profile),
      });
      entries.push({
        label: `${label}/${phase}/next-headline`,
        text: survivor.nextAction.headline,
      });
      entries.push({
        label: `${label}/${phase}/next-friendlyReason`,
        text: survivor.nextAction.friendlyReason,
      });
      entries.push({
        label: `${label}/${phase}/continuity-currentSituation`,
        text: continuity.currentSituation,
      });
      if (continuity.deadlineNote?.message) {
        entries.push({
          label: `${label}/${phase}/deadlineNote`,
          text: continuity.deadlineNote.message,
        });
      }
      for (const item of continuity.needsAttention) {
        entries.push({
          label: `${label}/${phase}/needsAttention-${item.kind}`,
          text: item.message,
        });
      }
    };

    pushDashboard("initial");

    file = syncCaseTimeline(
      completeCaseAction(
        file,
        current.id,
        triggersFrom(file),
        photoEvidenceInput()
      ).caseFile
    );
    current = getCurrentAction(file);
    if (current) pushDashboard("after-photo");
  }

  return entries;
}

export function validateSurvivorCopyQuality(): SurvivorCopyValidationResult {
  const gaps: string[] = [];
  const staticEntries = collectStaticCopyStrings();
  const scenarioEntries = collectScenarioCopyStrings();
  const allEntries = [...staticEntries, ...scenarioEntries];

  assertSurvivorJapaneseQuality(allEntries, gaps);

  const failures = lintSurvivorJapaneseBatch(allEntries);

  return {
    name: "survivor-copy-japanese",
    checked: allEntries.length,
    failures: failures.length,
    passed: gaps.length === 0,
    gaps,
  };
}

export function formatSurvivorCopyReport(): string {
  const staticEntries = collectStaticCopyStrings();
  const scenarioEntries = collectScenarioCopyStrings();
  const failures = lintSurvivorJapaneseBatch([
    ...staticEntries,
    ...scenarioEntries,
  ]);
  return formatCopyLintReport(failures);
}

export function runSurvivorCopyValidation(): {
  result: SurvivorCopyValidationResult;
  report: string;
} {
  const result = validateSurvivorCopyQuality();
  const report = formatSurvivorCopyReport();
  return { result, report };
}
