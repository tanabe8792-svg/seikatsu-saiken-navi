"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ONBOARDING_INTRO_LABEL,
  ONBOARDING_INTRO_LEAD,
  ONBOARDING_REASSURANCE,
  ONBOARDING_DATA_NOTE,
  ONBOARDING_SERVICE_FEATURES,
  ONBOARDING_TIMING_OPTIONS,
  ONBOARDING_UNIVERSAL_MESSAGE,
} from "@/lib/onboarding/onboarding-copy";
import type { OnboardingTimingHint } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OnboardingIntroProps {
  selectedTiming?: OnboardingTimingHint;
  onSelectTiming: (hint: OnboardingTimingHint | undefined) => void;
  onStart: () => void;
}

export function OnboardingIntro({
  selectedTiming,
  onSelectTiming,
  onStart,
}: OnboardingIntroProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-4">
        <p className="text-sm font-medium text-primary">{ONBOARDING_INTRO_LABEL}</p>
        <p className="mt-2 text-base leading-relaxed">{ONBOARDING_INTRO_LEAD}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ONBOARDING_UNIVERSAL_MESSAGE}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold">このサービスでできること</h2>
          <ul className="space-y-2">
            {ONBOARDING_SERVICE_FEATURES.map((item) => (
              <li key={item} className="text-sm leading-relaxed">
                · {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="space-y-2 p-5">
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            {ONBOARDING_REASSURANCE.title}
          </h2>
          <p className="text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-100/90">
            {ONBOARDING_REASSURANCE.body}
          </p>
          <p className="text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
            {ONBOARDING_DATA_NOTE}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold">
            いまの段階に合わせて（任意）
          </h2>
          <p className="text-xs text-muted-foreground">
            当てはまるものがあればタップ。生活再建の整理に活かします
          </p>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_TIMING_OPTIONS.map((opt) => {
              const active = selectedTiming === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onSelectTiming(active ? undefined : opt.id)
                  }
                  className={cn(
                    "rounded-full border px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {opt.note}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 w-full text-lg" onClick={onStart}>
        状況の整理をはじめる
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        登録不要 · 無料 · 約2分
      </p>
    </div>
  );
}
