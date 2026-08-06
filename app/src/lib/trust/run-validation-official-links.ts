import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractHttpsUrlsFromSource,
  validateOfficialUrls,
} from "./official-link-policy";

const ROOT = join(import.meta.dirname, "..");
const TARGETS = [
  "case-management/procedure-guidance.ts",
  "case-management/contact-assist.ts",
  "knowledge/disaster-overlays.ts",
  "knowledge/alerts.ts",
];

function main() {
  const allUrls: string[] = [];
  for (const rel of TARGETS) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    allUrls.push(...extractHttpsUrlsFromSource(text));
  }
  const unique = [...new Set(allUrls)];
  const result = validateOfficialUrls(unique);

  console.log(`# 公式リンク検証 (${unique.length} URL)`);
  if (result.passed) {
    console.log("結果: すべて許可ドメイン");
    process.exit(0);
  }
  console.log("結果: 要確認");
  for (const g of result.gaps) console.log(`  - ${g}`);
  process.exit(1);
}

main();
