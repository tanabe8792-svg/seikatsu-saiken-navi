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
    "熊本での活動の中で、「このあと何を確認すればいいの？」という声を何度も聞きました。学生の自分にできることは小さいですが、一人で抱え込まなくてよいように作り始めました。",
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
  note: "再現のしかた（どの画面→何をしたか）があると助かります。送信先の連絡先は画面には表示しません。",
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
    "ご意見・ご紹介・応援メッセージが、情報更新と改善の力になります。",
  ],
} as const;

export const TRUST_FAQ_OPERATOR_ANSWER =
  "熊本で学ぶ学生の田辺（たなべ ゆう）が、ボランティアなどの活動を通じて感じた課題をもとに作っています。詳しくは「その他」→「このサービスについて」をご覧ください。";

/** Google Forms 等 — NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL（任意の外部フォーム） */
export function getTrustFeedbackFormUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL?.trim();
  return url || undefined;
}
