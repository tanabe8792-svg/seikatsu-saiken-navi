"use client";

import { ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProcedureGuidanceView } from "@/lib/case-management/procedure-guidance";

interface PrepNextDestinationProps {
  guidance: ProcedureGuidanceView;
}

/** 準備物の直下：次にどこへ進むか（電話・公式ページ）を短く示す */
export function PrepNextDestination({ guidance }: PrepNextDestinationProps) {
  const primaryLinks = guidance.links.filter((l) => l.primary).slice(0, 2);
  const fallbackLinks =
    primaryLinks.length > 0 ? primaryLinks : guidance.links.slice(0, 2);
  const firstPhone = guidance.contactAssist?.steps.find((s) => s.phone)?.phone;

  if (fallbackLinks.length === 0 && !firstPhone) return null;

  return (
    <div
      id="prep-next-destination"
      className="space-y-2 rounded-xl border border-border bg-background/80 px-3 py-3"
    >
      <p className="text-sm font-semibold">そろったら、次に進む先</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        準備ができたら、ここで申請や連絡に進めます。迷ったら上の「申請案内」も見返せます。
      </p>
      {firstPhone ? (
        <Button asChild size="lg" className="h-11 w-full justify-between text-sm">
          <a href={`tel:${firstPhone.replace(/[^\d+]/g, "")}`}>
            <span className="inline-flex items-center gap-2 truncate">
              <Phone className="h-4 w-4 shrink-0" />
              電話する（{firstPhone}）
            </span>
          </a>
        </Button>
      ) : null}
      {fallbackLinks.map((link) => (
        <Button
          key={link.href + link.label}
          asChild
          size="lg"
          variant={link.primary || !firstPhone ? "default" : "outline"}
          className="h-11 w-full justify-between text-sm"
        >
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            <span className="truncate text-left">{link.label}</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </Button>
      ))}
    </div>
  );
}
