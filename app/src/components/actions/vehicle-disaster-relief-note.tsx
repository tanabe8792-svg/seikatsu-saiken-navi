"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CERT_PREP_ACTION_ID,
  VEHICLE_DISASTER_RELIEF_ITEMS,
  VEHICLE_RELIEF_INTRO,
} from "@/lib/case-management/vehicle-disaster-relief";
import { getCaseActionDetailPath } from "@/lib/navigation";

interface VehicleDisasterReliefNoteProps {
  /** 罹災証明ページではリンクを出さない */
  compact?: boolean;
}

/** 車・免許の手数料免除など。罹災証明への入口を示す */
export function VehicleDisasterReliefNote({
  compact = false,
}: VehicleDisasterReliefNoteProps) {
  return (
    <Card className="border-sky-200/80 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/20">
      <CardContent className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-sky-950 dark:text-sky-50">
          車が使えなくなった・免許や車庫の手続き
        </h3>
        <p className="text-sm leading-relaxed text-sky-950/90 dark:text-sky-100/90">
          {VEHICLE_RELIEF_INTRO}
        </p>
        {!compact && (
          <Button asChild size="sm" variant="secondary" className="h-9">
            <Link href={getCaseActionDetailPath(CERT_PREP_ACTION_ID)}>
              罹災証明書の申請へ
            </Link>
          </Button>
        )}
        <ul className="space-y-3">
          {VEHICLE_DISASTER_RELIEF_ITEMS.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-sky-200/60 bg-background/80 px-3 py-3 dark:border-sky-800"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              {item.needsCertificate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  先に：罹災証明（り災証明）の取得・申請
                </p>
              )}
              <div className="mt-2 flex flex-col gap-1.5">
                {item.links.map((link) => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          制度名・期限・金額は変わることがあります。必ず公式の案内で最新を確認してください。
        </p>
      </CardContent>
    </Card>
  );
}
