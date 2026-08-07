/**
 * 初回導入 UX — 表示専用コピー（docs/20）
 * KB / Trigger / ActionQueue には連携しない。
 */

import {
  formatActionCompanionHeadline,
  formatActionFriendlyReason,
  formatCaseSituation,
  getCurrentAction,
} from "@/lib/case-management/action-queue";
import type { CaseFile } from "@/lib/case-management/types";
import type { OnboardingTimingHint, UserProfile } from "@/lib/types";

export const ONBOARDING_SERVICE_FEATURES = [
  "いまの状況を一緒に整理し、次に確認することを順番に案内します",
  "公式情報をもとに案内します（推測では決めません）",
  "登録不要・無料です。わからない項目はそのままで進められます",
] as const;

/** できることと一緒に示す短い注意（表示専用） */
export const ONBOARDING_INFO_HANDLING_SHORT = [
  "大切な判断の前には、公式ページで最新もご確認ください。",
  "入力内容はこの端末内に保存します。運営のサーバーへは自動では送りません（別端末へは引き継げません）。",
] as const;

export const ONBOARDING_REASSURANCE = {
  title: "登録不要・無料で使えます",
  body: "「わからない」項目があっても、そのまま進められます。入力内容はこの端末に自動保存され、同じ端末なら続きから再開できます。",
} as const;

/** データ保存の注意（表示専用） */
export const ONBOARDING_DATA_NOTE =
  "アカウント登録はありません。別の端末や、ブラウザのデータを消した場合は引き継げません。";

export const ONBOARDING_TIMING_OPTIONS: {
  id: OnboardingTimingHint;
  label: string;
  note: string;
}[] = [
  {
    id: "weeks",
    label: "数週間経った",
    note: "罹災証明・保険・支援制度など、手続きの本番です",
  },
  {
    id: "months",
    label: "数か月経った",
    note: "続けている手続きや、まだの整理を一緒に進めます",
  },
  {
    id: "partial",
    label: "一部手続き済み",
    note: "済んでいることも一緒に確認できます",
  },
  {
    id: "acute",
    label: "被災直後",
    note: "安全確保が最も優先の段階です",
  },
];

export const DEFAULT_ONBOARDING_TIMING_HINT: OnboardingTimingHint = "weeks";

export const ONBOARDING_UNIVERSAL_MESSAGE =
  "被害の記録・罹災証明・保険・支援など、いま必要な確認を一緒に整理します。";

export const ONBOARDING_INTRO_LABEL = "令和8年熊本地震 — 熊本 生活再建ナビ";

export const ONBOARDING_INTRO_LEAD =
  "短い質問にお答えいただくと、あなた向けの「やること」を案内いたします。";

export interface PostJ00WelcomeMessage {
  title: string;
  situationSummary: string;
  firstStepLead: string;
  firstStepHeadline: string;
  timingNote?: string;
}

export function getTimingReassurance(
  hint?: OnboardingTimingHint
): string | undefined {
  if (!hint) return undefined;
  const opt = ONBOARDING_TIMING_OPTIONS.find((o) => o.id === hint);
  return opt?.note;
}

/** J-00 完了後 — 実際の first Action から伴走メッセージを生成 */
export function buildPostJ00WelcomeMessage(
  caseFile: CaseFile,
  profile: UserProfile,
  timingHint?: OnboardingTimingHint
): PostJ00WelcomeMessage | null {
  const current = getCurrentAction(caseFile);
  if (!current) return null;

  const situation = formatCaseSituation(caseFile);
  const friendlyReason = formatActionFriendlyReason(current);
  const headline = formatActionCompanionHeadline(current, friendlyReason);
  const timingNote = getTimingReassurance(timingHint);

  const situationSummary =
    situation && situation !== "状況確認中"
      ? `${situation}の状況を整理しました。`
      : "いただいた内容で状況を整理しました。";

  return {
    title: "あなたの状況を整理しました",
    situationSummary,
    firstStepLead: "次は、やること一覧の1件目から進めます：",
    firstStepHeadline: headline,
    timingNote,
  };
}

/** J-00 完了直後 — 入力内容の見える化（表示専用） */
export function buildPostJ00ProfileBullets(profile: UserProfile): string[] {
  const items: string[] = [];

  if (profile.municipality) items.push(`お住まい: ${profile.municipality}`);
  if (profile.isSelfEmployed) {
    items.push("自営業");
    if (profile.hasBusinessDamage === true) {
      items.push(
        `店舗被害あり${
          profile.businessMunicipality
            ? `（${profile.businessMunicipality}）`
            : ""
        }`
      );
    }
  }
  if (profile.housingDamage) items.push(`住宅の被害: ${profile.housingDamage}`);

  if (profile.hasPowerOutage === true) items.push("停電: いま使えない");
  else if (profile.hasPowerOutage === false) items.push("停電: 今は使える");

  if (profile.hasWaterOutage === true) items.push("断水: いま使えない");
  else if (profile.hasWaterOutage === false) items.push("断水: 今は使える");

  if (profile.hasGasOutage === true) items.push("ガス: いま使えない");
  else if (profile.hasGasOutage === false) items.push("ガス: 今は使える");

  if (profile.hasChildren === true) items.push("お子さま: いる");
  else if (profile.hasChildren === false) items.push("お子さま: いない");

  if (profile.hasElderly === true) items.push("高齢者の方: いる");
  else if (profile.hasElderly === false) items.push("高齢者の方: いない");

  if (profile.housingTenure) items.push(`住居: ${profile.housingTenure}`);

  return items;
}

/** 導入画面に表示する全文字列（検証用） */
export function collectOnboardingIntroStrings(): string[] {
  return [
    ONBOARDING_INTRO_LABEL,
    ONBOARDING_INTRO_LEAD,
    "このサービスでできること",
    ...ONBOARDING_SERVICE_FEATURES,
    ...ONBOARDING_INFO_HANDLING_SHORT,
    ONBOARDING_REASSURANCE.title,
    ONBOARDING_REASSURANCE.body,
    ONBOARDING_DATA_NOTE,
    "いまの段階に合わせて（任意）",
    ...ONBOARDING_TIMING_OPTIONS.flatMap((o) => [o.label, o.note]),
    ONBOARDING_UNIVERSAL_MESSAGE,
    "質問をはじめる",
    "登録不要 · 無料 · 約2分",
    "当てはまるものがあればタップ。最初はどれも選ばなくて大丈夫です。",
  ];
}
