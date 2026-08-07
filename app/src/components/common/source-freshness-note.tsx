"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import {
  describeSourceFreshness,
  formatFetchedAt,
  formatTodayJstDisplay,
} from "@/lib/case-management/format-source-updated-at";
import { cn } from "@/lib/utils";

interface SourceFreshnessNoteProps {
  /** KB の updatedAt など（公式内容の時点） */
  updatedAt?: string | null;
  /** API 取得時刻（ISO） */
  fetchedAt?: string | null;
  /** 見出し（例: 公式情報の内容時点） */
  label?: string;
  className?: string;
  /** コンパクト表示 */
  compact?: boolean;
  /**
   * 古く感じたら公式確認、の案内を出すか。
   * 天気のような「いま取得した」情報では false。
   */
  showStaleHint?: boolean;
  /**
   * サーバー再取得なしで、画面を開いた日（今日）を併記する。
   * 「内容が今日更新された」とは言わず、案内の確認日として出す。
   */
  showOpenedToday?: boolean;
}

/**
 * 公式・公開情報の「いつの時点か」を被災者に分かりやすく出す
 */
export function SourceFreshnessNote({
  updatedAt,
  fetchedAt,
  label = "公式情報の内容時点",
  className,
  compact = false,
  showStaleHint = true,
  showOpenedToday = false,
}: SourceFreshnessNoteProps) {
  const fromKb = describeSourceFreshness(updatedAt ?? null);
  const fromFetch = formatFetchedAt(fetchedAt ?? null);
  const display = fromKb?.display ?? fromFetch;
  const [openedToday, setOpenedToday] = useState<string | null>(null);

  useEffect(() => {
    if (!showOpenedToday) return;
    setOpenedToday(formatTodayJstDisplay());
  }, [showOpenedToday]);

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
          {openedToday ? ` / この画面を開いた日: ${openedToday}` : ""}
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
      {openedToday && (
        <p className="pl-6 text-sm tabular-nums text-foreground">
          この画面を開いた日: {openedToday}
        </p>
      )}
      {fromKb?.timeNote && (
        <p className="pl-6 text-xs text-muted-foreground">{fromKb.timeNote}</p>
      )}
      {showOpenedToday && (
        <p className="pl-6 text-xs leading-relaxed text-muted-foreground">
          「内容時点」は公式資料の日付です。「開いた日」はサーバーに問い合わせず、端末の今日の日付です。申請の前は公式ページで最新も確認してください。
        </p>
      )}
      {showStaleHint && !showOpenedToday && (
        <p className="pl-6 text-xs leading-relaxed text-muted-foreground">
          古く感じる場合や、申請・判断の前には、公式ページで最新をご自身でも確認してください。
        </p>
      )}
    </div>
  );
}
