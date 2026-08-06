/**
 * 被災者向け表示コピーの日本語品質チェック（表示専用）
 * 伴走文言の連結ミス・不自然な重複を CI / validate で検出する。
 */

export interface CopyLintIssue {
  rule: string;
  message: string;
  excerpt: string;
}

export interface CopyLintResult {
  text: string;
  issues: CopyLintIssue[];
}

const LINT_RULES: Array<{
  id: string;
  pattern: RegExp;
  message: string;
}> = [
  {
    id: "volitional-then-progress",
    pattern: /しましょうと(?:進め|確認)/,
    message: "「〜しましょう」と「〜進め…」が連結されている",
  },
  {
    id: "volitional-stage",
    pattern: /しましょう段階/,
    message: "「〜しましょう」と「段階です」が連結されている",
  },
  {
    id: "double-volitional-one-clause",
    pattern: /[^。]*ましょう[^。]*ましょう/,
    message: "同一文内で「ましょう」系の語尾が重複している",
  },
  {
    id: "progress-then-volitional",
    pattern: /進めていきましょうと/,
    message: "「進めていきましょう」の後に不自然な連結がある",
  },
  {
    id: "double-period",
    pattern: /。{2,}/,
    message: "句点が重複している",
  },
  {
    id: "double-particle-to",
    pattern: /とと[^い]/,
    message: "助詞「と」が重複している可能性",
  },
  {
    id: "double-particle-wo",
    pattern: /をを/,
    message: "助詞「を」が重複している",
  },
  {
    id: "broken-te-form-chain",
    pattern: /(?:確認|進め|申請)して(?:い|お)き(?:ましょう|ます)[^。]*(?:と|を)(?:進め|確認)/,
    message: "テ形・連用の連結が不自然",
  },
  {
    id: "empty-placeholder",
    pattern: /undefined|null|\[object Object\]/,
    message: "未展開のプレースホルダが残っている",
  },
];

/** 伴走見出しと説明が実質同じなら説明を省略 */
export function isRedundantCompanionCopy(
  headline: string,
  description: string
): boolean {
  const normalize = (text: string) => text.replace(/[。\s　]/g, "");
  const h = normalize(headline);
  const d = normalize(description);
  if (!h || !d) return true;
  if (h === d) return true;
  if (h.includes(d) || d.includes(h)) return true;

  if (h.includes("一緒に確認") && d.includes("一緒に確認")) {
    const topics = [
      "住宅ローン",
      "罹災",
      "保険",
      "生活再建",
      "応急",
      "給水",
      "家族",
      "事業",
    ];
    if (topics.some((t) => h.includes(t) && d.includes(t))) return true;
  }

  return false;
}

/** 伴走見出しを currentSituation の「次は…」に安全連結 */
export function formatSituationNextStep(headline: string): string {
  const clean = headline.replace(/。$/, "").trim();
  if (!clean) return "";
  if (/ましょう$|です$|ます$|でしょう$|ています$/.test(clean)) {
    return `次は、${clean}。`;
  }
  return `次は、${clean}を進めていきましょう。`;
}

/** 伴走理由を currentSituation の「これからは…」に安全連結 */
export function formatSituationOpeningStep(friendly: string): string {
  const clean = friendly.replace(/。$/, "").trim();
  if (!clean) return "";
  if (/ましょう$/.test(clean)) {
    return `これからは、${clean}。`;
  }
  return `これからは、${clean}の段階です。`;
}

export function lintSurvivorJapanese(text: string): CopyLintIssue[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const issues: CopyLintIssue[] = [];
  for (const rule of LINT_RULES) {
    const match = trimmed.match(rule.pattern);
    if (match) {
      issues.push({
        rule: rule.id,
        message: rule.message,
        excerpt: match[0],
      });
    }
  }
  return issues;
}

export function lintSurvivorJapaneseBatch(
  texts: Array<{ label: string; text: string }>
): Array<{ label: string; result: CopyLintResult }> {
  return texts
    .map(({ label, text }) => ({
      label,
      result: { text, issues: lintSurvivorJapanese(text) },
    }))
    .filter((entry) => entry.result.issues.length > 0);
}

export function assertSurvivorJapaneseQuality(
  texts: Array<{ label: string; text: string }>,
  gaps: string[]
): void {
  for (const entry of lintSurvivorJapaneseBatch(texts)) {
    for (const issue of entry.result.issues) {
      gaps.push(
        `${entry.label}: [${issue.rule}] ${issue.message} — 「${issue.excerpt}」`
      );
    }
  }
}

export function formatCopyLintReport(
  failures: Array<{ label: string; result: CopyLintResult }>
): string {
  const lines = ["=== Survivor Copy (Japanese) Validation ===", ""];
  if (failures.length === 0) {
    lines.push("✓ 不自然な日本語は検出されませんでした");
    return lines.join("\n");
  }
  for (const { label, result } of failures) {
    lines.push(`✗ ${label}`);
    lines.push(`  text: ${result.text.slice(0, 120)}${result.text.length > 120 ? "…" : ""}`);
    for (const issue of result.issues) {
      lines.push(`  - [${issue.rule}] ${issue.message} (${issue.excerpt})`);
    }
    lines.push("");
  }
  lines.push(`Result: ${failures.length} 件の問題`);
  return lines.join("\n");
}
