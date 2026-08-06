/**
 * 申請案内など — 外部リンクが公式ドメインか検証（CI / 手動チェック用）
 */

/** 明示許可（自治体・国・支援ポータル・ライフライン・商工会等） */

export function isOfficialLinkHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (/\.go\.jp$/i.test(host)) return true;
  if (/\.lg\.jp$/i.test(host)) return true;
  if (/\.or\.jp$/i.test(host)) return true;
  if (/\.kumamoto\.jp$/i.test(host)) return true;
  if (host === "kumamoto-shien.jp" || host === "www.kumamoto-shien.jp") return true;
  if (host === "www.kyuden.co.jp" || host === "kyuden.co.jp") return true;
  if (host === "www.saibugas.co.jp" || host === "saibugas.co.jp") return true;
  if (host === "digital-gov.note.jp") return true;
  if (host === "hikawanet.com" || host === "www.hikawanet.com") return true;
  return false;
}

export function validateOfficialUrls(urls: string[]): {
  passed: boolean;
  gaps: string[];
} {
  const gaps: string[] = [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") {
        gaps.push(`HTTPS 以外: ${raw}`);
        continue;
      }
      if (!isOfficialLinkHost(u.hostname)) {
        gaps.push(`許可外ホスト: ${u.hostname} (${raw})`);
      }
    } catch {
      gaps.push(`URL 不正: ${raw}`);
    }
  }
  return { passed: gaps.length === 0, gaps };
}

/** procedure-guidance 等から https URL を抽出 */
export function extractHttpsUrlsFromSource(source: string): string[] {
  const matches = source.match(/https:\/\/[^\s"'`<>]+/g) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[),.;]+$/, "")))];
}
