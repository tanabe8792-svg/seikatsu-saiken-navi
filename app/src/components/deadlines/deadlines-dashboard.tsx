"use client";

import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  daysSinceDisaster,
  formatDisasterRelativeDeadline,
  getAllDeadlineDisplays,
  getDeadlineStatusLabel,
  getDeadlineTemplateNote,
} from "@/lib/case-management/deadlines";
import type { CaseFile } from "@/lib/case-management/types";
import { getCaseActionDetailPath } from "@/lib/navigation";

interface DeadlinesDashboardProps {
  caseFile: CaseFile;
}

function statusBorderClass(status: string): string {
  switch (status) {
    case "overdue":
      return "border-destructive/50 bg-destructive/5";
    case "due_soon":
      return "border-amber-300/70 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20";
    case "unknown":
      return "border-border/80 bg-background/80";
    default:
      return "border-border/80 bg-background/90";
  }
}

export function DeadlinesDashboard({ caseFile }: DeadlinesDashboardProps) {
  const items = getAllDeadlineDisplays(caseFile);
  const elapsed = daysSinceDisaster();

  return (
    <div className="space-y-5 pb-28">
      <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-5">
        <p className="text-sm font-medium text-primary">被災日からの目安</p>
        <p className="text-base leading-relaxed">
          2026年7月28日（熊本地震）起算で、被災から
          <span className="font-semibold"> {elapsed}日</span>
          経過しています。
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          制度ごとの目安は、あなたの手続き状況に合わせて出します。罹災証明など市町村ごとに受付期間が違うものは、「○日まで」と決めつけません。避難中や状況が分からないときは、安全を優先して大丈夫です。
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-lg font-bold">いま確認すべき期限はありません</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              手続きが進むと、関連する期限がここに表示されます。ホーム画面から次の確認を進めてください。
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ChevronLeft className="h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const { deadline } = item;
            const note = getDeadlineTemplateNote(deadline);
            const relativeText = formatDisasterRelativeDeadline(deadline);
            const actionHref = deadline.relatedActionId
              ? getCaseActionDetailPath(deadline.relatedActionId)
              : undefined;

            return (
              <li key={deadline.id}>
                <Card className={statusBorderClass(deadline.status)}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-lg font-bold leading-snug">
                        {deadline.label}
                      </p>
                      <span className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-xs font-medium">
                        {getDeadlineStatusLabel(deadline.status)}
                      </span>
                    </div>

                    <p className="text-xl font-semibold text-primary">
                      {item.displayText}
                    </p>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {relativeText}
                    </p>

                    {note && (
                      <p className="text-sm leading-relaxed">{note}</p>
                    )}

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                      {deadline.sourceUrl && (
                        <Button asChild variant="outline" className="h-12 flex-1">
                          <a
                            href={deadline.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            公式情報を確認
                          </a>
                        </Button>
                      )}
                      {actionHref && (
                        <Button asChild className="h-12 flex-1">
                          <Link href={actionHref}>関連する確認へ</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
