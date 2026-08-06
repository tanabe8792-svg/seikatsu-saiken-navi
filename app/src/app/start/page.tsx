"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { OnboardingIntro } from "@/components/onboarding/onboarding-intro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChoiceList,
  MultiToggleList,
  StepProgress,
  YesNoRow,
} from "@/components/j00/j00-step-ui";
import { useUserSession } from "@/hooks/use-user-session";
import {
  J00_DISASTER_EVENT_LABEL,
  J00_DISASTER_TYPE,
  J00_STEP1_COPY,
  J00_LIFELINE_STEP_COPY,
  HOUSING_DAMAGE_OPTIONS,
  HOUSING_TENURE_OPTIONS,
  isJ00StepComplete,
  J00_TOTAL_STEPS,
  LIFELINE_OPTIONS,
  MUNICIPALITY_OPTIONS,
} from "@/lib/j00-hearing";
import { MUNICIPALITIES } from "@/lib/knowledge/municipalities";
import { DEFAULT_ONBOARDING_TIMING_HINT } from "@/lib/onboarding/onboarding-copy";
import type { OnboardingTimingHint, UserProfile } from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5;
type PagePhase = "intro" | "hearing";

function readStartQuery(): { redo: boolean; step: Step | null } {
  if (typeof window === "undefined") {
    return { redo: false, step: null };
  }
  const sp = new URLSearchParams(window.location.search);
  const raw = Number(sp.get("step"));
  const step =
    raw >= 1 && raw <= J00_TOTAL_STEPS ? (raw as Step) : null;
  return { redo: sp.get("redo") === "1", step };
}

function buildStartUrl(phase: PagePhase, step: Step, redo: boolean): string {
  const params = new URLSearchParams();
  if (redo) params.set("redo", "1");
  if (phase === "hearing") params.set("step", String(step));
  const qs = params.toString();
  return qs ? `/start?${qs}` : "/start";
}

export default function J00HearingPage() {
  const router = useRouter();
  const {
    session,
    loading,
    updateProfile,
    initializeCase,
    setJ00Step,
    setOnboardingTimingHint,
  } = useUserSession();

  const [phase, setPhase] = useState<PagePhase>("intro");
  const [step, setStep] = useState<Step>(1);
  const [redo, setRedo] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({});
  const [lifelineTouched, setLifelineTouched] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [timingHint, setTimingHint] = useState<OnboardingTimingHint | undefined>(
    () => session.onboardingTimingHint ?? DEFAULT_ONBOARDING_TIMING_HINT
  );

  const writeHistory = useCallback(
    (nextPhase: PagePhase, nextStep: Step, mode: "push" | "replace") => {
      const url = buildStartUrl(nextPhase, nextStep, redo);
      const state = { phase: nextPhase, step: nextStep, redo };
      if (mode === "push") {
        window.history.pushState(state, "", url);
      } else {
        window.history.replaceState(state, "", url);
      }
    },
    [redo]
  );

  useEffect(() => {
    if (loading || initialized) return;

    const query = readStartQuery();
    setRedo(query.redo);

    if (
      session.profile.j00Completed &&
      session.caseFile &&
      !query.redo
    ) {
      router.replace("/");
      return;
    }

    const savedProfile = session.profile;
    if (Object.keys(savedProfile).length > 0) {
      setProfile(
        query.redo
          ? { ...savedProfile, j00Completed: false }
          : savedProfile
      );
      if (
        savedProfile.hasPowerOutage !== undefined ||
        savedProfile.hasWaterOutage !== undefined ||
        savedProfile.hasGasOutage !== undefined
      ) {
        setLifelineTouched(true);
      }
    } else {
      setProfile({});
      setLifelineTouched(false);
    }

    if (session.onboardingTimingHint) {
      setTimingHint(session.onboardingTimingHint);
    }

    let nextPhase: PagePhase = "intro";
    let nextStep: Step = 1;

    if (query.step) {
      nextPhase = "hearing";
      nextStep = query.step;
    } else if (!query.redo) {
      const savedStep = session.j00Step;
      if (savedStep && savedStep >= 1 && savedStep <= J00_TOTAL_STEPS) {
        nextPhase = "hearing";
        nextStep = savedStep as Step;
      }
    }

    setPhase(nextPhase);
    setStep(nextStep);
    if (nextPhase === "hearing") {
      setJ00Step(nextStep);
    }
    window.history.replaceState(
      { phase: nextPhase, step: nextStep, redo: query.redo },
      "",
      buildStartUrl(nextPhase, nextStep, query.redo)
    );
    setInitialized(true);
  }, [
    loading,
    initialized,
    session.j00Step,
    session.profile,
    session.caseFile,
    session.onboardingTimingHint,
    session.profile.j00Completed,
    router,
    setJ00Step,
  ]);

  // リセット後など、セッションが空に戻ったら導入画面へ戻す
  useEffect(() => {
    if (loading || !initialized) return;
    if (session.profile.j00Completed && session.caseFile && !redo) return;
    if (Object.keys(session.profile).length === 0 && !session.j00Step) {
      setPhase("intro");
      setStep(1);
      setProfile({});
      setLifelineTouched(false);
      writeHistory("intro", 1, "replace");
    }
  }, [
    loading,
    initialized,
    session.profile,
    session.j00Step,
    session.caseFile,
    session.profile.j00Completed,
    redo,
    writeHistory,
  ]);

  // 端末の戻る／進むでステップを1つずつ戻す
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const state = event.state as
        | { phase?: PagePhase; step?: Step; redo?: boolean }
        | null;
      if (state?.phase === "hearing" && state.step) {
        setPhase("hearing");
        setStep(state.step);
        setJ00Step(state.step);
        return;
      }
      if (state?.phase === "intro" || !state) {
        const query = readStartQuery();
        if (query.step) {
          setPhase("hearing");
          setStep(query.step);
          setJ00Step(query.step);
          return;
        }
        setPhase("intro");
        setJ00Step(undefined);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setJ00Step]);

  const persistDraft = useCallback(
    (nextProfile: UserProfile, nextStep: Step) => {
      updateProfile(nextProfile);
      setJ00Step(nextStep);
    },
    [updateProfile, setJ00Step]
  );

  function handleTimingSelect(hint: OnboardingTimingHint | undefined) {
    setTimingHint(hint);
    setOnboardingTimingHint(hint);
  }

  function handleIntroStart() {
    const hint = timingHint ?? DEFAULT_ONBOARDING_TIMING_HINT;
    if (!timingHint) {
      setTimingHint(hint);
      setOnboardingTimingHint(hint);
    }
    setPhase("hearing");
    setStep(1);
    setJ00Step(1);
    writeHistory("hearing", 1, "push");
  }

  function handleLifelineToggle(key: string) {
    setLifelineTouched(true);
    setProfile((prev) => {
      const next =
        key === "none"
          ? {
              ...prev,
              hasPowerOutage: false,
              hasWaterOutage: false,
              hasGasOutage: false,
            }
          : (() => {
              const field = key as
                | "hasPowerOutage"
                | "hasWaterOutage"
                | "hasGasOutage";
              const current = prev[field] ?? false;
              return { ...prev, [field]: !current };
            })();
      persistDraft(next, step);
      return next;
    });
  }

  const lifelineSelectedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (profile.hasPowerOutage) keys.add("hasPowerOutage");
    if (profile.hasWaterOutage) keys.add("hasWaterOutage");
    if (profile.hasGasOutage) keys.add("hasGasOutage");
    if (
      lifelineTouched &&
      !profile.hasPowerOutage &&
      !profile.hasWaterOutage &&
      !profile.hasGasOutage
    ) {
      keys.add("none");
    }
    return keys;
  }, [profile, lifelineTouched]);

  function goNext(nextStep: Step, nextProfile: UserProfile) {
    setProfile(nextProfile);
    persistDraft(nextProfile, nextStep);
    setStep(nextStep);
    writeHistory("hearing", nextStep, "push");
  }

  function goPrevStep(prevStep: Step) {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setStep(prevStep);
    setJ00Step(prevStep);
    writeHistory("hearing", prevStep, "replace");
  }

  function handleComplete() {
    const finalProfile: UserProfile = {
      ...profile,
      j00Completed: true,
    };
    void (async () => {
      await initializeCase(finalProfile);
      setJ00Step(undefined);
      router.push("/");
    })();
  }

  const stepComplete = isJ00StepComplete(step, profile);
  const step3Ready =
    !!profile.housingDamage &&
    (lifelineTouched ||
      (profile.hasPowerOutage !== undefined &&
        profile.hasWaterOutage !== undefined &&
        profile.hasGasOutage !== undefined));

  function handleHeaderBack() {
    if (phase !== "hearing") return;
    if (step > 1) {
      goPrevStep((step - 1) as Step);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setPhase("intro");
    setJ00Step(undefined);
    writeHistory("intro", 1, "replace");
  }

  const hearingHeader = (
    <SiteHeader
      title="はじめに"
      showBack
      onBack={handleHeaderBack}
      backLabel="← 前へ"
    />
  );

  if (loading || !initialized) {
    return (
      <>
        <SiteHeader title="はじめに" />
        <main className="px-4 py-8 text-center text-muted-foreground">
          読み込み中…
        </main>
      </>
    );
  }

  if (phase === "intro") {
    return (
      <>
        <SiteHeader title="はじめに" />
        <main className="space-y-6 px-4 py-4 pb-28">
          <OnboardingIntro
            selectedTiming={timingHint}
            onSelectTiming={handleTimingSelect}
            onStart={handleIntroStart}
          />
        </main>
      </>
    );
  }

  return (
    <>
      {hearingHeader}
      <main className="space-y-6 px-4 py-4 pb-28">
        <StepProgress step={step} total={J00_TOTAL_STEPS} />

        {step === 1 && (
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="space-y-3">
                <h2 className="text-xl font-bold leading-snug">
                  {J00_DISASTER_EVENT_LABEL}
                </h2>
                <p className="text-base leading-relaxed">
                  {J00_STEP1_COPY.lead}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/30 px-4 py-4">
                <p className="text-sm font-medium leading-relaxed">
                  {J00_STEP1_COPY.helpLead}
                </p>
                <ul className="space-y-2">
                  {J00_STEP1_COPY.helpItems.map((item) => (
                    <li
                      key={item}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                className="h-14 w-full text-lg"
                onClick={() =>
                  goNext(2, { ...profile, disasterType: J00_DISASTER_TYPE })
                }
              >
                次へ
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <>
            <ChoiceList
              title="お住まいの地域は？"
              options={MUNICIPALITY_OPTIONS}
              selected={profile.municipality}
              onSelect={(v) =>
                goNext(3, { ...profile, municipality: v })
              }
            />
            <Button variant="ghost" size="lg" onClick={() => goPrevStep(1)}>
              ← 戻る
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <ChoiceList
              title="住宅の被害は？"
              options={[...HOUSING_DAMAGE_OPTIONS]}
              selected={profile.housingDamage}
              onSelect={(v) => {
                const next = { ...profile, housingDamage: v };
                setProfile(next);
                persistDraft(next, step);
              }}
            />

            <MultiToggleList
              title={J00_LIFELINE_STEP_COPY.title}
              subtitle={J00_LIFELINE_STEP_COPY.subtitle}
              options={LIFELINE_OPTIONS.map(({ key, label }) => ({
                key,
                label,
              }))}
              selectedKeys={lifelineSelectedKeys}
              onToggle={handleLifelineToggle}
            />

            {!step3Ready && profile.housingDamage && !lifelineTouched && (
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                {J00_LIFELINE_STEP_COPY.hint}
              </p>
            )}

            <Button
              size="lg"
              className="h-14 w-full text-lg"
              disabled={!step3Ready}
              onClick={() => {
                const nextProfile =
                  lifelineTouched || lifelineSelectedKeys.size > 0
                    ? profile
                    : {
                        ...profile,
                        hasPowerOutage: false,
                        hasWaterOutage: false,
                        hasGasOutage: false,
                      };
                goNext(4, nextProfile);
              }}
            >
              次へ
            </Button>
            <Button variant="ghost" size="lg" onClick={() => goPrevStep(2)}>
              ← 戻る
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <Card>
              <CardContent className="space-y-3 p-5">
                <h2 className="text-xl font-bold">ご家族・状況</h2>
                <YesNoRow
                  label="子ども"
                  value={profile.hasChildren}
                  onChange={(v) => {
                    const next = { ...profile, hasChildren: v };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
                <YesNoRow
                  label="高齢者"
                  value={profile.hasElderly}
                  onChange={(v) => {
                    const next = { ...profile, hasElderly: v };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
                <YesNoRow
                  label="ペット"
                  value={profile.hasPet}
                  onChange={(v) => {
                    const next = { ...profile, hasPet: v };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
                <YesNoRow
                  label="自営業"
                  value={profile.isSelfEmployed}
                  onChange={(v) => {
                    const next = {
                      ...profile,
                      isSelfEmployed: v,
                      ...(v
                        ? {}
                        : {
                            hasBusinessDamage: undefined,
                            businessMunicipality: undefined,
                          }),
                    };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
                {profile.isSelfEmployed === true && (
                  <>
                    <YesNoRow
                      label="店舗・事業所の被害"
                      value={profile.hasBusinessDamage}
                      onChange={(v) => {
                        const next = {
                          ...profile,
                          hasBusinessDamage: v,
                          businessMunicipality: v
                            ? profile.businessMunicipality ||
                              profile.municipality
                            : undefined,
                        };
                        setProfile(next);
                        persistDraft(next, step);
                      }}
                    />
                    {profile.hasBusinessDamage === true && (
                      <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                        <p className="text-sm font-medium">
                          店舗・事業所はどこにありますか？
                        </p>
                        <p className="text-xs text-muted-foreground">
                          住まいと別の市町村でも構いません。相談先は店舗側で案内します。
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                              profile.businessMunicipality ===
                              profile.municipality
                                ? "border-primary bg-primary/10 font-medium"
                                : "bg-card"
                            }`}
                            onClick={() => {
                              const next = {
                                ...profile,
                                businessMunicipality: profile.municipality,
                              };
                              setProfile(next);
                              persistDraft(next, step);
                            }}
                          >
                            住まいと同じ（{profile.municipality}）
                          </button>
                          {MUNICIPALITIES.filter(
                            (m) => m.name !== profile.municipality
                          ).map((m) => (
                            <button
                              key={m.code}
                              type="button"
                              className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                                profile.businessMunicipality === m.name
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "bg-card"
                              }`}
                              onClick={() => {
                                const next = {
                                  ...profile,
                                  businessMunicipality: m.name,
                                };
                                setProfile(next);
                                persistDraft(next, step);
                              }}
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="h-14 w-full text-lg"
              disabled={!stepComplete}
              onClick={() => goNext(5, profile)}
            >
              次へ
            </Button>
            <Button variant="ghost" size="lg" onClick={() => goPrevStep(3)}>
              ← 戻る
            </Button>
          </>
        )}

        {step === 5 && (
          <>
            <ChoiceList
              title="住居の形態は？"
              options={[...HOUSING_TENURE_OPTIONS]}
              selected={profile.housingTenure}
              onSelect={(v) => {
                const next = { ...profile, housingTenure: v };
                setProfile(next);
                persistDraft(next, step);
              }}
            />

            <Card>
              <CardContent className="space-y-3 p-5">
                <YesNoRow
                  label="住宅ローン"
                  value={profile.hasMortgage}
                  onChange={(v) => {
                    const next = { ...profile, hasMortgage: v };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
                <YesNoRow
                  label="2016年熊本地震の経験"
                  value={profile.prior2016Disaster}
                  onChange={(v) => {
                    const next = { ...profile, prior2016Disaster: v };
                    setProfile(next);
                    persistDraft(next, step);
                  }}
                />
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="h-14 w-full text-lg"
              disabled={!stepComplete}
              onClick={handleComplete}
            >
              完了
            </Button>
            <Button variant="ghost" size="lg" onClick={() => goPrevStep(4)}>
              ← 戻る
            </Button>
          </>
        )}
      </main>
    </>
  );
}
