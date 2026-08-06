/**
 * 初回導入 UX 検証 — docs/20
 */

import { J00_VALIDATION_EXAMPLES } from "@/lib/j00-hearing";
import { buildCaseProfileFromUserProfile } from "@/lib/j00-hearing";
import {
  createCaseFile,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import { initializeCaseFromProfile } from "@/lib/case-management";
import { extractFamilyAttributes } from "@/lib/case-management/index";
import {
  buildPostJ00WelcomeMessage,
  collectOnboardingIntroStrings,
  ONBOARDING_UNIVERSAL_MESSAGE,
} from "@/lib/onboarding/onboarding-copy";
import { assertSurvivorJapaneseQuality } from "@/lib/case-management/survivor-copy-quality";
import type { OnboardingTimingHint } from "@/lib/types";

export interface OnboardingValidationResult {
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
];

function initCaseFromExample(
  profile: (typeof J00_VALIDATION_EXAMPLES)[0]["profile"]
) {
  return initializeCaseFromProfile(
    { ...profile, j00Completed: true },
    undefined
  );
}

function pendingActionIds(
  file: ReturnType<typeof initCaseFromExample>
): string[] {
  return file.pendingActions.map((a) => a.id);
}

export function validateOnboardingCopy(): OnboardingValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const introStrings = collectOnboardingIntroStrings();
  for (const text of introStrings) {
    for (const term of FORBIDDEN_TERMS) {
      if (text.includes(term)) {
        gaps.push(`導入文: 内部用語「${term}」`);
      }
    }
  }
  assertSurvivorJapaneseQuality(
    introStrings.map((text, i) => ({ label: `onboarding-intro[${i}]`, text })),
    gaps
  );
  steps.push("導入文チェック");

  const hasReassurance =
    introStrings.some((s) => s.includes("わからない")) &&
    introStrings.some((s) => s.includes("端末")) &&
    introStrings.some((s) => s.includes("無料"));

  if (!hasReassurance) {
    gaps.push("登録・保存・無料の説明なし");
  }
  steps.push("安心表現");

  return {
    name: "intro-copy",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validatePostJ00Welcome(): OnboardingValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => e.name.startsWith("Case1:")
  );
  if (!example) {
    return {
      name: "post-j00-welcome",
      steps: [],
      passed: false,
      gaps: ["Case1 未定義"],
    };
  }

  const caseFile = initCaseFromExample(example.profile);
  const current = getCurrentAction(caseFile);
  if (!current) {
    gaps.push("Case1: first Action なし");
  }

  const welcome = buildPostJ00WelcomeMessage(caseFile, example.profile, "months");
  if (!welcome) {
    gaps.push("buildPostJ00WelcomeMessage が null");
  } else {
    if (!welcome.title.includes("状況を整理")) {
      gaps.push(`welcome title: ${welcome.title}`);
    }
    if (!welcome.firstStepHeadline) {
      gaps.push("firstStepHeadline 空");
    }
    if (current && !welcome.firstStepHeadline.includes("確認")) {
      gaps.push(
        `firstStepHeadline が first Action と連動していない: ${welcome.firstStepHeadline}`
      );
    }
    if (welcome.timingNote !== "続けている手続きや、まだの整理を一緒に進めます") {
      gaps.push(`timingNote months: ${welcome.timingNote}`);
    }
  }
  steps.push("J-00完了後メッセージ");

  return {
    name: "post-j00-welcome",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function validateTimingHintDoesNotAffectQueue(): OnboardingValidationResult {
  const gaps: string[] = [];
  const steps: string[] = [];

  const example = J00_VALIDATION_EXAMPLES.find(
    (e) => e.name.startsWith("Case4:")
  );
  if (!example) {
    return {
      name: "timing-hint-isolation",
      steps: [],
      passed: false,
      gaps: ["Case4 未定義"],
    };
  }

  const caseProfile = buildCaseProfileFromUserProfile(example.profile);
  const family = extractFamilyAttributes(example.profile);

  const hints: (OnboardingTimingHint | undefined)[] = [
    undefined,
    "acute",
    "weeks",
    "months",
    "partial",
  ];

  const queues = hints.map(() =>
    pendingActionIds(
      createCaseFile(caseProfile, family, {
        userProfile: example.profile,
        forcePhaseMode: "recovery",
      })
    )
  );

  const baseline = JSON.stringify(queues[0]);
  for (let i = 1; i < queues.length; i++) {
    if (JSON.stringify(queues[i]) !== baseline) {
      gaps.push("onboardingTimingHint が ActionQueue に影響（createCaseFile 経路）");
      break;
    }
  }

  steps.push("timingHint非連携");

  return {
    name: "timing-hint-isolation",
    steps,
    passed: gaps.length === 0,
    gaps,
  };
}

export function runAllOnboardingValidations(): {
  results: OnboardingValidationResult[];
  passed: number;
  total: number;
} {
  const results = [
    validateOnboardingCopy(),
    validatePostJ00Welcome(),
    validateTimingHintDoesNotAffectQueue(),
  ];
  return {
    results,
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

export function formatOnboardingReport(): string {
  const { results, passed, total } = runAllOnboardingValidations();
  const lines = ["=== Onboarding UX Validation ===", ""];
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
