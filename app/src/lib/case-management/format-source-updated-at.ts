/**
 * 公式情報の更新日時表示 — 日付だけでなく時刻も示して安心感を出す
 */

/** KB の updatedAt（日付のみ／日時）を被災者向けに整形 */
export function formatSourceUpdatedAt(raw: string | null | undefined): string | null {
  if (!raw || raw === "確認不可") return null;

  const normalized = raw.trim().replace("T", " ").replace(/\+09:00$/, "").replace(/Z$/, "");

  // 2026-08-01 12:00[:ss]
  const withTime = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{1,2}):(\d{2})(?::\d{2})?/
  );
  if (withTime) {
    const [, y, m, d, hh, mm] = withTime;
    return `${y}年${Number(m)}月${Number(d)}日 ${hh.padStart(2, "0")}:${mm}`;
  }

  // 2026-08-01
  const dateOnly = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${y}年${Number(m)}月${Number(d)}日`;
  }

  // 2026.08.01
  const dotted = normalized.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotted) {
    const [, y, m, d] = dotted;
    return `${y}年${Number(m)}月${Number(d)}日`;
  }

  return raw;
}
