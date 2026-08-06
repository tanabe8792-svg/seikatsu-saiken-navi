"use client";

import { Clock } from "lucide-react";
import {
  describeSourceFreshness,
  formatFetchedAt,
} from "@/lib/case-management/format-source-updated-at";
import { cn } from "@/lib/utils";

interface SourceFreshnessNoteProps {
  /** KB の updatedAt など */
  updatedAt?: string | null;
  /** API 取得時刻（ISO） */
  fetchedAt?: string | null;
  /** 見出し（例: この案内の情報時点） */
  label?: string;
  className?: string;
  /** コンパクト表示 */
  compact?: boolean;
}

/**
 * 公式・公開情報の「いつの時点か」を被災者に分かりやすく出す
 */
export function SourceFreshnessNote({
  updatedAt,
  fetchedAt,
  label = "この案内の情報時点",
  className,
  compact = false,
}: SourceFreshnessNoteProps) {
  const fromKb = describeSourceFreshness(updatedAt ?? null);
  const fromFetch = formatFetchedAt(fetchedAt ?? null);
  const display = fromKb?.display ?? fromFetch;

  if (compact) {
    return (
      <p
        className={cn(
          "inline-flex flex-wrap items-center gap-1 text-xs text-muted-foreground",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {label}: {display ?? "日時未確認"}
          {fromKb?.timeNote ? `（${fromKb.timeNote}）` : ""}
        </span>
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-1.5 rounded-lg border border-dashed bg-muted/30 px-3 py-2.5",
        className
      )}
      role="status"
    >
      <p className="flex items-start gap-2 text-sm font-medium text-foreground">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden />
        <span>
          {label}:{" "}
          <span className="tabular-nums">
            {display ?? "日時を確認できませんでした"}
          </span>
        </span>
      </p>
      {fromKb?.timeNote && (
        <p className="pl-6 text-xs text-muted-foreground">{fromKb.timeNote}</p>
      )}
      <p className="pl-6 text-xs leading-relaxed text-muted-foreground">
        古く感じる場合や、申請・判断の前には、公式ページで最新をご自身でも確認してください。
      </p>
    </div>
  );
}
