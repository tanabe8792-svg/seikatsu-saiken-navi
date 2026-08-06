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
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-5">
        <p className="text-sm font-medium text-primary">{ONBOARDING_INTRO_LABEL}</p>
        <p className="mt-2 text-xl font-bold leading-snug">
          次に確認することを、順番に案内します
        </p>
        <p className="mt-2 text-base leading-relaxed">{ONBOARDING_INTRO_LEAD}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {ONBOARDING_UNIVERSAL_MESSAGE}
        </p>
      </div>

      <Button size="lg" className="h-14 w-full text-lg" onClick={onStart}>
        質問をはじめる
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        登録不要 · 無料 · 約2分
      </p>

      <details className="rounded-xl border bg-card px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          このサービスでできること
        </summary>
        <ul className="mt-3 space-y-2 pb-1">
          {ONBOARDING_SERVICE_FEATURES.map((item) => (
            <li key={item} className="text-sm leading-relaxed">
              · {item}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {ONBOARDING_REASSURANCE.body} {ONBOARDING_DATA_NOTE}
        </p>
      </details>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold">いまの段階に合わせて（任意）</h2>
          <p className="text-xs text-muted-foreground">
            当てはまるものがあればタップ
          </p>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_TIMING_OPTIONS.map((opt) => {
              const active = selectedTiming === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectTiming(active ? undefined : opt.id)}
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
    </div>
  );
}
