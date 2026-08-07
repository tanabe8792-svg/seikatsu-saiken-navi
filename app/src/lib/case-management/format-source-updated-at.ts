/**
 * 公式情報の更新日時表示 — 日付・時刻を示して安心感を出す
 */

export interface SourceFreshness {
  /** 例: 2026年8月1日 12:00 時点 */
  display: string;
  /** 時刻まで分かるか */
  hasClockTime: boolean;
  /** 日付だけのときの補足 */
  timeNote: string | null;
}

/** KB / API の updatedAt を被災者向けに整形 */
export function formatSourceUpdatedAt(
  raw: string | null | undefined
): string | null {
  return describeSourceFreshness(raw)?.display ?? null;
}

/** 構造化して返す（UI 用） */
export function describeSourceFreshness(
  raw: string | null | undefined
): SourceFreshness | null {
  if (!raw || raw === "確認不可") return null;

  const normalized = raw
    .trim()
    .replace("T", " ")
    .replace(/\+09:00$/, "")
    .replace(/Z$/, "")
    .replace(/\.\d{3}$/, "");

  // ISO / 2026-08-01 12:00[:ss]
  const withTime = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{1,2}):(\d{2})(?::\d{2})?/
  );
  if (withTime) {
    const [, y, m, d, hh, mm] = withTime;
    return {
      display: `${y}年${Number(m)}月${Number(d)}日 ${hh.padStart(2, "0")}:${mm} 時点`,
      hasClockTime: true,
      timeNote: null,
    };
  }

  // 2026-08-01
  const dateOnly = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return {
      display: `${y}年${Number(m)}月${Number(d)}日 時点`,
      hasClockTime: false,
      timeNote: "時刻の記載はありません",
    };
  }

  // 2026.08.01
  const dotted = normalized.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotted) {
    const [, y, m, d] = dotted;
    return {
      display: `${y}年${Number(m)}月${Number(d)}日 時点`,
      hasClockTime: false,
      timeNote: "時刻の記載はありません",
    };
  }

  return {
    display: `${raw} 時点`,
    hasClockTime: false,
    timeNote: null,
  };
}

/** Date / ISO 文字列（取得時刻など）を表示用に */
export function formatFetchedAt(
  isoOrDate: string | Date | null | undefined
): string | null {
  if (!isoOrDate) return null;
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return describeSourceFreshness(String(isoOrDate))?.display ?? null;
  }
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm} 時点`;
}

/** 端末の今日（日本時間）— サーバー再取得なしの「開いた日」表示用 */
export function formatTodayJstDisplay(): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}年${get("month")}月${get("day")}日 ${get("hour")}:${get("minute")}`;
}
