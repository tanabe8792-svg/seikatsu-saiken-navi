"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/brand/app-logo";
import {
  ONBOARDING_INTRO_LABEL,
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
        <p className="text-base text-muted-foreground">{ONBOARDING_INTRO_LABEL}</p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-2xl font-bold leading-snug">
            状況を整理し、確認することを順番に案内します
          </h2>
          <p className="text-lg text-muted-foreground">無料・登録なし</p>
          <Button size="lg" className="h-14 w-full text-lg" onClick={onStart}>
            状況を選んで案内を作る
          </Button>
          <p className="text-center text-base text-muted-foreground">
            <Link href="/faq" className="underline underline-offset-2">
              くわしくはよくある質問へ
            </Link>
          </p>
        </CardContent>
      </Card>

      <details className="rounded-xl border bg-card px-4 py-3">
        <summary className="cursor-pointer text-base font-medium text-muted-foreground">
          いまの段階（任意）
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {ONBOARDING_TIMING_OPTIONS.map((opt) => {
            const active = selectedTiming === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectTiming(active ? undefined : opt.id)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-base transition-colors",
                  active
                    ? "border-brand-green bg-muted font-medium"
                    : "border-border bg-background hover:bg-muted/50"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
