"use client";

import { MUNICIPALITIES } from "@/lib/knowledge/municipalities";
import { resolveHomeMunicipalityName } from "@/lib/case-management/municipality-context";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HomeMunicipalityPickerProps {
  profile: UserProfile;
  onChange: (municipality: string) => void;
  /** り災証明など、申請先の説明 */
  heading?: string;
  hint?: string;
}

export function HomeMunicipalityPicker({
  profile,
  onChange,
  heading = "申請する市町村",
  hint = "り災証明は、被災した住家がある市町村へ申請します。選ぶと、オンライン（マイナポータル等）か窓口かの案内が変わります。",
}: HomeMunicipalityPickerProps) {
  const selected = resolveHomeMunicipalityName(profile);

  return (
    <div className="rounded-xl border bg-background/80 px-4 py-3 space-y-2">
      <p className="text-sm font-semibold">{heading}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <div className="flex flex-col gap-2">
        {MUNICIPALITIES.map((m) => {
          const active = selected === m.name;
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => onChange(m.name)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm",
                active
                  ? "border-brand-green bg-muted font-medium"
                  : "bg-card hover:bg-accent/40"
              )}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
