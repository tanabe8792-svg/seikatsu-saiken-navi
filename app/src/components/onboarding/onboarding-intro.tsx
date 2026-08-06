"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/brand/app-logo";
import {
  ONBOARDING_INTRO_LABEL,
  ONBOARDING_INFO_HANDLING_SHORT,
  ONBOARDING_SERVICE_FEATURES,
  ONBOARDING_TIMING_OPTIONS,
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
      <div className="flex flex-col items-center gap-2 pt-1 text-center">
        <AppLogo size="lg" />
        <p className="text-xs text-muted-foreground">
          一歩ずつ、暮らしを取り戻すために
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-medium text-muted-foreground">{ONBOARDING_INTRO_LABEL}</p>
          <h2 className="text-lg font-bold">このサービスでできること</h2>
          <ul className="space-y-2">
            {ONBOARDING_SERVICE_FEATURES.map((item) => (
              <li key={item} className="text-sm leading-relaxed">
                · {item}
              </li>
            ))}
          </ul>
          <ul className="space-y-1 border-t border-border pt-3">
            {ONBOARDING_INFO_HANDLING_SHORT.map((item) => (
              <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 w-full text-lg" onClick={onStart}>
        質問をはじめる
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        登録不要 · 無料 · 約2分です
      </p>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold">いまの段階に合わせて（任意）</h2>
          <p className="text-xs text-muted-foreground">
            当てはまるものがあればタップしてください。最初はどれも選ばなくて大丈夫です。
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
                      ? "border-brand-green bg-muted font-medium"
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
