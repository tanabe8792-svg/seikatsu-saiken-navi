/**
 * 信頼形成 UX — 表示専用コピー（Aフェーズ / docs/23）
 * CaseFile / KB / ActionQueue には連携しない。
 */

export const TRUST_PAGE_TITLE = "このサービスについて";

export const TRUST_ABOUT_SERVICE = {
  heading: "生活再建ナビについて",
  body: [
    "熊本地震で被災された方が、生活再建の途中で感じる不安や負担を、少しでも減らせるように。",
    "制度を代わりに判断するのではなく、今の状況を整理し、次に一緒に確認することを見つけるお手伝いをします。",
  ],
} as const;

export const TRUST_WHY_BUILT = {
  heading: "なぜこのサービスを作ったか",
  body: [
    "熊本でボランティアなどの活動をする中で、被災された方から「このあと、何を確認すればいいの？」という声を何度も聞きました。",
    "専門家ではなく学生の自分に、できることは小さいかもしれません。それでも、一人で抱え込まなくてよいように、少しでもお役に立てないかと考え、このサービスを作り始めました。",
    "まだ至らないところもあると思います。使っていただいた方の声を聞きながら、一緒にもっと使いやすくしていきたいです。",
  ],
} as const;

export const TRUST_DEVELOPER = {
  heading: "開発している人",
  name: "田辺 優",
  nameReading: "たなべ ゆう",
  affiliation: "熊本学園大学大学院 会計専門職研究科",
  body: [
    "熊本で学びながら、ボランティアなど地域の活動にも関わっています。",
    "現場で感じた「分からない」を、自分なりに形にしたのが生活再建ナビです。",
  ],
} as const;

export const TRUST_INFO_HANDLING = {
  heading: "情報の扱い方",
  body: [
    "生活再建に必要な情報を、公式情報をもとに整理してお届けします。",
    "ただし、支援制度や申請期限などは変更される場合があります。",
    "このサービスは推測で案内せず、確認できる情報を軸に伴走します。",
    "マイページ登録（メール・LINE）は、最新情報をすぐ受け取りたい方向けの任意登録です。続きの保存には登録は不要で、同じ端末ならページを閉じても再開できます。連絡先は当面この端末内に保存します。",
    "大切な判断の前には、最新の公式情報も一緒に確認しながら進めましょう。",
    "分からないことがあっても、一人で抱え込まなくて大丈夫です。",
  ],
} as const;

export const TRUST_FEEDBACK = {
  heading: "ご意見・改善のお願い",
  lead: "問い合わせ窓口ではなく、より役立つサービスに育てるための声を聞いています。",
  note: "使っていて気になったこと、追加してほしい情報、困っていることがあれば、聞かせてください。",
  formHint: "フォームの準備中です。公開まで少々お待ちください。",
  buttonLabel: "改善の声を送る",
  fields: [
    "使っていて分かりにくかったところ",
    "追加してほしい情報",
    "困っていること",
    "改善してほしいところ",
    "応援メッセージ（任意）",
  ],
} as const;

export const TRUST_CONTINUITY_SUPPORT = {
  heading: "活動を続けるために",
  body: [
    "生活再建ナビは、必要な方に届け続けるため、サーバー維持・情報更新・開発改善に時間をかけています。",
    "応援のしかたはさまざまです。ご意見・ご紹介・応援メッセージが、活動を続ける大きな力になります。",
  ],
} as const;

export const TRUST_FAQ_OPERATOR_ANSWER =
  "熊本で学ぶ学生の田辺（たなべ ゆう）が、ボランティアなどの活動を通じて感じた課題をもとに作っています。詳しくは「その他」→「このサービスについて」をご覧ください。";

/** Google Forms 等 — NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL */
export function getTrustFeedbackFormUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_TRUST_FEEDBACK_FORM_URL?.trim();
  return url || undefined;
}
