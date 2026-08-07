/**
 * 信頼形成 UX — 表示専用コピー（Aフェーズ / docs/23）
 * CaseFile / KB / ActionQueue には連携しない。
 */

import { APP_NAME } from "@/lib/brand";

export const TRUST_PAGE_TITLE = "このサービスについて";

export const TRUST_ABOUT_SERVICE = {
  heading: `${APP_NAME}について`,
  body: [
    "熊本地震で被災された方が、「この先どうすればいいのか」という不安を、ひとりで抱え込まなくてよいように、次に確認することを順番に案内する無料のサービスです。",
    "制度を代わりに決めるのではなく、公式情報をもとに、これから何を確認すればよいかを分かりやすく示します。",
    "市役所・町村役場とは連携していません。この画面を見せても、窓口の手続きが自動で進むわけではありません。申請は各自治体の公式案内に従ってください。",
  ],
} as const;

export const TRUST_WHY_BUILT = {
  heading: "なぜ作ったか",
  body: [
    "被災地でのボランティア活動のなかで、「この先、何から手をつければいいのか分からない」という声を何度も聞きました。自分にできることは小さいですが、将来への不安を少しでも整理できるよう作り始めました。",
  ],
} as const;

export const TRUST_DEVELOPER = {
  heading: "このサービスを作っている人",
  name: "田辺 優",
  nameReading: "たなべ ゆう",
  affiliation: "熊本学園大学大学院 会計専門職研究科",
  body: [
    "熊本で学びながら、被災地でのボランティアなどにも関わっています。行政の公式サービスではありません。",
    "個人で開発・更新していますが、被害内容を運営者だけが覗ける形にしないことを、設計の中心に置いています。",
  ],
} as const;

export const TRUST_INFO_HANDLING = {
  heading: "案内情報の扱い方",
  body: [
    "案内は公式情報をもとにします。制度や期限は変わることがあるので、大切な判断の前には公式ページで最新を確認してください。",
    "このナビは公式サイトへ何度も自動取得し続けず、案内に「情報の更新」日付を載せ、必要なとき公式リンクを開く形にしています。",
  ],
} as const;

export const TRUST_PERSONAL_DATA = {
  heading: "個人情報の扱い",
  body: [
    "被害の状況や手続きの進み具合は、あなた自身の情報です。運営者が全員分を一覧で見られる仕組みにはしていません。「開発者だけが内容を見られる」状態を避けることを、設計の中心に置いています。",
    "登録なしで使う場合（標準）：やること・進捗・メモは、この端末（ブラウザ）内に保存されます。運営のサーバーへは自動では送りません。被害写真もこの端末内に残し、自動ではサーバーに送りません。",
    "マイページ登録（メール・LINEログイン）は任意です。別の端末から続きを再開したいときだけ使えます。登録した内容の保存・やりとりは暗号化通信（HTTPS）です。データベース側では本人以外が読めない制限を設け、運営用の「全員分を見る画面」は作っていません。",
    "次のときだけ、内容が通信されます。AI相談を使ったとき（使わなければ送られません）。「改善の声」を送ったとき（任意）。重要なお知らせのメール受け取りは、設定から希望できます。",
  ],
} as const;

export const TRUST_FEEDBACK = {
  heading: "ご意見・改善のお願い",
  lead: "分かりにくかったところ、追加してほしい情報、困ったことを聞かせてください。",
  note: "どの画面で何があったか書いてもらえると助かります。下の欄に書いて送ると、「送信が完了しました」と表示されます。",
  formHint: "しばらくしてから、もう一度お試しください。",
  buttonLabel: "改善の声を送る",
  fields: [
    "分かりにくかったところ",
    "追加してほしい情報",
    "困っていること",
    "再現のしかた（任意）",
  ],
} as const;

export const TRUST_CONTINUITY_SUPPORT = {
  heading: "活動を続けるために",
  body: [
    "このナビは、個人で開発・更新を続けています。",
    "続けていくために、活動費のご支援（任意）がとても助かります。",
  ],
  bodyWhenPending:
    "いまは決済の準備中です。まもなく、ここで金額を選んで応援できるようになります。",
  bodyWhenReady:
    "下から金額を選んで、応援できます（任意です）。無理のない範囲で大丈夫です。",
  donationButtonLabel: "活動費で応援する（任意）",
  donationNote:
    "外部の決済ページが開きます。強制ではありません。お気持ちだけで十分です。",
  donationPending:
    "活動費の受付は、まもなく使えるようになります。もうしばらくお待ちください。",
  paymentMethodsNotePending:
    "使えるようになったら、Apple Pay・クレジットカード・PayPay などから選べる予定です。",
  paymentMethodsNoteReady:
    "Apple Pay・クレジットカード・PayPay などから選べます（決済ページによって異なります）。",
  /** @deprecated paymentMethodsNotePending を参照 */
  paymentMethodsNote:
    "使えるようになったら、Apple Pay・クレジットカード・PayPay などから選べる予定です。",
  formLead:
    "応援のメッセージも書けます（任意）。改善のご意見は上の「改善の声」へ。",
} as const;

/** 活動費 — 金額だけ選ぶ（用途の内訳は書かない） */
export const SUPPORT_DONATION_TIERS = [
  { yen: 500, id: "500", title: "500円" },
  { yen: 1000, id: "1000", title: "1,000円" },
  { yen: 3000, id: "3000", title: "3,000円" },
  { yen: 0, id: "custom", title: "金額を自分で決める" },
] as const;

export const TRUST_FAQ_OPERATOR_ANSWER =
  "田辺 優（たなべ ゆう／熊本学園大学大学院 会計専門職研究科）が、被災地でのボランティアなどを通じて感じた課題をもとに作っています。詳しくは「その他」→「このサービスについて」をご覧ください。";

/** Google Forms 等 — NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL（任意の外部フォーム） */
export function getTrustFeedbackFormUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL?.trim();
  return url || undefined;
}

function trimEnvUrl(value: string | undefined): string | undefined {
  const url = value?.trim();
  return url || undefined;
}

/** 共通の支援リンク（Stripe の「金額を選ぶ」リンクなど） */
export function getSupportDonationUrl(): string | undefined {
  return trimEnvUrl(process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL);
}

/** 金額別リンク。固定額は専用URLのみ。自由は CUSTOM または共通URL */
export function getSupportDonationTierUrl(tierId: string): string | undefined {
  const byTier: Record<string, string | undefined> = {
    "500": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_500,
    "1000": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_1000,
    "3000": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_3000,
    custom: process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_CUSTOM,
  };
  const specific = trimEnvUrl(byTier[tierId]);
  if (specific) return specific;
  if (tierId === "custom") return getSupportDonationUrl();
  return undefined;
}

/** PayPay.me など PayPay 専用（任意） */
export function getSupportPayPayUrl(): string | undefined {
  return trimEnvUrl(process.env.NEXT_PUBLIC_SUPPORT_PAYPAY_URL);
}

export function hasAnySupportDonationLink(): boolean {
  if (getSupportDonationUrl() || getSupportPayPayUrl()) return true;
  return SUPPORT_DONATION_TIERS.some((t) => getSupportDonationTierUrl(t.id));
}
