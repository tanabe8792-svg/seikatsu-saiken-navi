"use client";

import { MUNICIPALITIES } from "@/lib/knowledge/municipalities";
import {
  isBusinessMunicipalitySameAsHome,
  resolveBusinessMunicipalityName,
  resolveHomeMunicipalityName,
} from "@/lib/case-management/municipality-context";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BusinessMunicipalityPickerProps {
  profile: UserProfile;
  onChange: (businessMunicipality: string) => void;
}

export function BusinessMunicipalityPicker({
  profile,
  onChange,
}: BusinessMunicipalityPickerProps) {
  const home = resolveHomeMunicipalityName(profile);
  const selected = resolveBusinessMunicipalityName(profile);
  const sameAsHome = isBusinessMunicipalitySameAsHome(profile);

  const options = [
    {
      value: profile.municipality || home,
      label: `住まいと同じ（${home}）`,
      isSame: true,
    },
    ...MUNICIPALITIES.filter((m) => m.name !== home).map((m) => ({
      value: m.name,
      label: m.name,
      isSame: false,
    })),
  ];

  return (
    <div className="rounded-xl border bg-background/80 px-4 py-3 space-y-2">
      <p className="text-sm font-semibold">店舗・事業所の所在地</p>
      <p className="text-xs text-muted-foreground">
        住まいと店舗が別の市町村にある場合があります。相談先は店舗側の地域で案内します。
      </p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = opt.isSame
            ? sameAsHome
            : selected === opt.value && !sameAsHome;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm",
                active
                  ? "border-brand-green bg-muted font-medium"
                  : "bg-card hover:bg-accent/40"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
