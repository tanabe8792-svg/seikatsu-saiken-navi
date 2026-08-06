/**
 * 信頼形成 UX — 表示専用コピー（Aフェーズ / docs/23）
 * CaseFile / KB / ActionQueue には連携しない。
 */

export const TRUST_PAGE_TITLE = "このサービスについて";

export const TRUST_ABOUT_SERVICE = {
  heading: "生活再建ナビについて",
  body: [
    "熊本地震で被災された方が、次に何を確認すればよいかを順番に整理する無料の案内です。",
    "制度を代わりに決めるのではなく、公式情報をもとに「いま確認すること」を一緒に見つけます。",
    "市役所・町村役場とは連携していません。この画面を見せても、窓口の手続きが自動で進むわけではありません。申請は各自治体の公式案内に従ってください。",
  ],
} as const;

export const TRUST_WHY_BUILT = {
  heading: "なぜ作ったか",
  body: [
    "熊本での活動の中で、「このあと何を確認すればいいの？」という声を何度も聞きました。自分にできることは小さいですが、一人で抱え込まなくてよいように作り始めました。",
  ],
} as const;

export const TRUST_DEVELOPER = {
  heading: "開発している人",
  name: "田辺 優",
  nameReading: "たなべ ゆう",
  affiliation: "熊本学園大学大学院 会計専門職研究科",
  body: [
    "熊本で学びながら、ボランティアなど地域の活動にも関わっています。",
  ],
} as const;

export const TRUST_INFO_HANDLING = {
  heading: "情報の扱い方",
  body: [
    "案内は公式情報をもとにします。制度や期限は変わることがあるので、大切な判断の前には公式ページで最新を確認してください。",
    "このナビは公式サイトへ何度も自動取得し続けず、案内に「情報の更新」日付を載せ、必要なとき公式リンクを開く形にしています（サーバー負担を抑えるため）。",
    "入力内容は当面この端末内に保存します。マイページ登録（メール・LINE）は最新情報を受け取りたい方向けの任意です。続きの再開に登録は不要です。",
  ],
} as const;

export const TRUST_FEEDBACK = {
  heading: "ご意見・改善のお願い",
  lead: "分かりにくかったところ、追加してほしい情報、困ったことを聞かせてください。",
  note: "再現のしかた（どの画面→何をしたか）があると助かります。送信すると開発者のメールに届き、「送信が完了しました」と表示されます。",
  formHint: "送信の準備中です。しばらくしてお試しください。",
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
    "このナビは、田辺 優が一人で開発・更新を続けています。",
    "続けていくために、活動費のご支援（任意）がとても助かります。メールでの応援メッセージはありがたいのですが、数が増えると十分にお返事できないことがあります。",
    "金額はお好きなもので大丈夫です。スマホなら Apple Pay・PayPay・クレジットカードで簡単に送れます。",
  ],
  donationButtonLabel: "活動費で応援する（任意）",
  donationNote:
    "外部の決済ページが開きます。強制ではありません。お気持ちだけで十分です。",
  donationPending:
    "支援用の決済リンクを準備しています。もうしばらくお待ちください。",
  paymentMethodsNote: "Apple Pay・クレジットカード・PayPay などに対応予定です（決済画面で選べます）。",
  formLead:
    "どうしても伝えたいことだけ書いてください（任意）。改善のご意見は上の「改善の声」へ。",
} as const;

/** 活動費の金額案（高額に見せず、用途が分かるように） */
export const SUPPORT_DONATION_TIERS = [
  {
    yen: 300,
    id: "300",
    title: "300円",
    purpose: "ひと息つくコーヒー代に",
    detail: "開発の合間の休憩代になります",
  },
  {
    yen: 500,
    id: "500",
    title: "500円",
    purpose: "月の維持の足しに",
    detail: "サーバー・メール配信などの運営費の一部に",
  },
  {
    yen: 1000,
    id: "1000",
    title: "1,000円",
    purpose: "情報の更新作業に",
    detail: "制度・リンクの確認と案内の直しに充てます",
  },
  {
    yen: 3000,
    id: "3000",
    title: "3,000円",
    purpose: "改善の開発時間に",
    detail: "使いやすさや新機能の実装の足しに",
  },
] as const;

export const TRUST_FAQ_OPERATOR_ANSWER =
  "熊本で学ぶ田辺 優（たなべ ゆう）が、ボランティアなどの活動を通じて感じた課題をもとに作っています。詳しくは「その他」→「このサービスについて」をご覧ください。";

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

/** 金額別リンク（未設定なら共通リンクへ） */
export function getSupportDonationTierUrl(tierId: string): string | undefined {
  const byTier: Record<string, string | undefined> = {
    "300": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_300,
    "500": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_500,
    "1000": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_1000,
    "3000": process.env.NEXT_PUBLIC_SUPPORT_DONATION_URL_3000,
  };
  return trimEnvUrl(byTier[tierId]) ?? getSupportDonationUrl();
}

/** PayPay.me など PayPay 専用（任意） */
export function getSupportPayPayUrl(): string | undefined {
  return trimEnvUrl(process.env.NEXT_PUBLIC_SUPPORT_PAYPAY_URL);
}

export function hasAnySupportDonationLink(): boolean {
  if (getSupportDonationUrl() || getSupportPayPayUrl()) return true;
  return SUPPORT_DONATION_TIERS.some((t) => getSupportDonationTierUrl(t.id));
}
