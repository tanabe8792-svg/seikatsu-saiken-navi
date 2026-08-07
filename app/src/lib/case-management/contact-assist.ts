/**
 * 相談の優先順位・電話メモ・メール文面 — 表示専用
 * 連絡先の並びだけでなく、「誰に・何を用意して・何を言うか」を分かりやすく示す。
 */

import type { UserProfile } from "@/lib/types";
import {
  getMunicipalityByCode,
  MUNICIPALITY_CODES,
  resolveMunicipalityCode,
} from "@/lib/knowledge/municipalities";
import { resolveBusinessMunicipalityName } from "./municipality-context";

export interface ContactPlanStep {
  priority: number;
  title: string;
  channel: "phone" | "email" | "web" | "visit";
  /** この順番にした理由（やさしい日本語） */
  whyFirst: string;
  phone?: string;
  email?: string;
  hours?: string;
  officialHref?: string;
  officialLabel?: string;
  /** 電話・メールの前に用意するもの */
  prepare: string[];
  /** 話すときの例 */
  sayScript: string[];
  /** 聞かれやすいこと */
  likelyAsked: string[];
}

export interface EmailDraftField {
  key: string;
  label: string;
  placeholder: string;
  /** profile から初期値を取るキー */
  fromProfile?: keyof UserProfile | "municipalityName";
}

export interface EmailDraftGuide {
  toLabel: string;
  toAddress?: string;
  subject: string;
  /** {{fieldKey}} を置換 */
  bodyTemplate: string;
  fields: EmailDraftField[];
}

export interface ContactAssistPlan {
  heading: string;
  intro: string;
  steps: ContactPlanStep[];
  emailDraft?: EmailDraftGuide;
}

const COMMON_PREPARE = [
  "事業所名・代表者名",
  "所在地（市町村まででも可）",
  "被害の概要（建物／設備／休業など）",
  "いま一番困っていること（資金・修繕・仮店舗など）",
  "日中つながる電話番号",
];

const COMMON_ASKED = [
  "被害の程度・いつから営業できていないか",
  "従業員はいるか・何人くらいか",
  "すでに相談した窓口はあるか",
  "事業用り災証明の有無（または住家の罹災証明）",
  "希望する支援（融資・相談・証明など）",
];

const COMMON_SAY = [
  "令和8年熊本地震で、店舗（事業所）が被災しました。",
  "いまの困りごとは（資金繰り／修繕／営業再開／証明）です。",
  "どの窓口・制度から確認すればよいか教えてください。",
  "必要書類と、次にやることを教えてください。",
];

function emailTemplate(municipalityName: string): EmailDraftGuide {
  return {
    toLabel: "相談先のメールアドレス（下の相談先）",
    subject: `【相談】令和8年熊本地震による店舗被害について（${municipalityName}）`,
    bodyTemplate: `お世話になっております。

令和8年熊本地震により、店舗・事業所に被害が出たためご相談です。

■ 事業所名
{{shopName}}

■ 所在地
{{address}}

■ 代表者（または担当）
{{contactName}}

■ 日中の連絡先
{{phone}}

■ 被害の概要
{{damage}}

■ いま一番困っていること
{{need}}

■ すでに済んでいること（あれば）
{{done}}

ご案内いただける窓口・手続き・必要書類を教えていただけますと幸いです。
何卒よろしくお願いいたします。`,
    fields: [
      {
        key: "shopName",
        label: "事業所名・屋号",
        placeholder: "例: ○○商店",
      },
      {
        key: "address",
        label: "所在地",
        placeholder: "例: 熊本県八代市…",
        fromProfile: "municipalityName",
      },
      {
        key: "contactName",
        label: "お名前",
        placeholder: "例: 山田太郎",
      },
      {
        key: "phone",
        label: "日中の電話",
        placeholder: "例: 090-…",
      },
      {
        key: "damage",
        label: "被害の概要",
        placeholder: "例: 店舗壁に亀裂、設備停止、○日から休業",
      },
      {
        key: "need",
        label: "いま一番困っていること",
        placeholder: "例: 運転資金の相談／事業用り災証明",
      },
      {
        key: "done",
        label: "すでに済んでいること",
        placeholder: "例: まだ何も／住家の罹災証明は申請中",
      },
    ],
  };
}

/** 店舗・事業再建向けの優先相談プラン */
export function getBusinessContactAssistPlan(
  profile: UserProfile
): ContactAssistPlan {
  const name = resolveBusinessMunicipalityName(profile);
  const code = resolveMunicipalityCode(name);
  const municipality = code ? getMunicipalityByCode(code) : null;
  const isKumamotoCity = code === MUNICIPALITY_CODES.KUMAMOTO_CITY;
  const isYatsushiro = code === MUNICIPALITY_CODES.YATSUSHIRO_CITY;
  const isHikawa = code === MUNICIPALITY_CODES.HIKAWA_TOWN;

  const steps: ContactPlanStep[] = [];

  if (isYatsushiro) {
    steps.push({
      priority: 1,
      title: "まず連絡する：八代商工会議所（特別相談窓口）",
      channel: "phone",
      whyFirst: "八代の事業者向けの相談窓口です。最初にここへ連絡してください。",
      phone: "0965-32-6191",
      hours: "平日 9:00〜17:00（土日祝除く）",
      officialHref: "https://8246cci.or.jp/hotnews/9126/",
      officialLabel: "八代商工会議所の案内を開く",
      prepare: COMMON_PREPARE,
      sayScript: COMMON_SAY,
      likelyAsked: COMMON_ASKED,
    });
  } else if (isHikawa) {
    steps.push({
      priority: 1,
      title: "まず連絡する：氷川町商工会",
      channel: "email",
      whyFirst: "氷川町の事業者向けの相談窓口です。最初にここへ連絡してください。",
      phone: "0965-62-2021",
      email: "hikawa@kumashoko.or.jp",
      hours: "商工会の案内に従ってください",
      officialHref: "https://hikawanet.com/contact",
      officialLabel: "氷川町商工会のお問い合わせを開く",
      prepare: COMMON_PREPARE,
      sayScript: COMMON_SAY,
      likelyAsked: COMMON_ASKED,
    });
  } else if (isKumamotoCity) {
    steps.push({
      priority: 1,
      title: "まず連絡する：熊本市 商業金融課（融資・事業用り災証明）",
      channel: "phone",
      whyFirst: "市の融資や、事業用り災証明の相談窓口です。",
      phone: "096-328-2424",
      hours: "平日 8:30〜17:15（休日対応あり・最新は公式で確認）",
      officialHref: "https://www.city.kumamoto.jp/kiji00372112/index.html",
      officialLabel: "熊本市の特別相談窓口案内を開く",
      prepare: [
        ...COMMON_PREPARE,
        "被害写真（印刷が必要な場合あり）",
        "事業所の場所が分かる地図",
      ],
      sayScript: [
        ...COMMON_SAY,
        "事業用のり災証明が必要かも教えてください。",
      ],
      likelyAsked: [
        ...COMMON_ASKED,
        "写真・地図・本人確認の準備状況",
      ],
    });
    steps.push({
      priority: 2,
      title: "次に連絡する：経営相談（XOSS POINT.）",
      channel: "phone",
      whyFirst: "経営の立て直しや再開の相談です。原則、予約が必要です。",
      phone: "096-355-7402",
      hours: "原則予約制（電話またはメール）",
      prepare: COMMON_PREPARE,
      sayScript: [
        "令和8年熊本地震で店舗が被災し、経営相談の予約をしたいです。",
        "いま困っていることは（資金／再開／従業員）です。",
      ],
      likelyAsked: ["希望日時", "相談したいテーマ"],
    });
  } else {
    steps.push({
      priority: 1,
      title: `まず連絡する：${name}の商工会・商工会議所`,
      channel: "web",
      whyFirst: "お住まい（店舗）の地域の商工会・商工会議所が、最初の相談先です。",
      officialHref: municipality?.officialUrl,
      officialLabel: `${name}公式サイトで商工・事業者相談を探す`,
      prepare: COMMON_PREPARE,
      sayScript: COMMON_SAY,
      likelyAsked: COMMON_ASKED,
    });
  }

  steps.push({
    priority: steps.length + 1,
    title: "町や市の相談のあと：熊本県（融資・経営の相談）",
    channel: "phone",
    whyFirst:
      "県の融資や経営の相談窓口です。町や市・商工会に相談したあとに連絡すると、話が分かりやすく進みます。",
    phone: "金融 096-333-2314 ／ 経営 096-333-2326",
    hours: "平日・土日祝 8:30〜17:15（年末年始除く）",
    officialHref:
      "https://www.pref.kumamoto.jp/soshiki/61/274549.html",
    officialLabel: "県の特別相談窓口案内を開く",
    prepare: COMMON_PREPARE,
    sayScript: [
      "令和8年熊本地震で店舗が被災しました。",
      "地元の商工会（または市）には（相談済／これから）です。",
      "県の融資（または経営相談）について確認したいです。",
    ],
    likelyAsked: COMMON_ASKED,
  });

  steps.push({
    priority: steps.length + 1,
    title: "より詳しく聞きたいとき：よろず支援拠点",
    channel: "phone",
    whyFirst:
      "どんな制度があるか、まとめて詳しく聞きたいときの経営相談です。",
    phone: "096-286-3355",
    hours: "平日 9:00〜17:00",
    officialHref: "https://www.kmt-ti.or.jp/archives/23253",
    officialLabel: "よろず支援拠点の案内を開く",
    prepare: COMMON_PREPARE,
    sayScript: COMMON_SAY,
    likelyAsked: COMMON_ASKED,
  });

  const emailDraft = emailTemplate(name);
  if (isHikawa) {
    emailDraft.toAddress = "hikawa@kumashoko.or.jp";
    emailDraft.toLabel = "氷川町商工会";
  }

  return {
    heading: "相談先（上から順に）",
    intro: "電話・メールの前に、下のメモを見ておくと話しやすいです。",
    steps,
    emailDraft,
  };
}

export function fillEmailDraft(
  draft: EmailDraftGuide,
  values: Record<string, string>
): { subject: string; body: string; mailtoHref: string | null } {
  let body = draft.bodyTemplate;
  for (const field of draft.fields) {
    const raw = values[field.key]?.trim() || "（未記入）";
    body = body.replaceAll(`{{${field.key}}}`, raw);
  }
  const subject = draft.subject;
  const mailtoHref = draft.toAddress
    ? `mailto:${draft.toAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  return { subject, body, mailtoHref };
}

export function initialEmailDraftValues(
  draft: EmailDraftGuide,
  profile: UserProfile
): Record<string, string> {
  const municipalityName = resolveBusinessMunicipalityName(profile);

  const values: Record<string, string> = {};
  for (const field of draft.fields) {
    if (field.fromProfile === "municipalityName") {
      values[field.key] =
        municipalityName !== "お住まいの地域"
          ? `熊本県${municipalityName}`
          : "";
    } else if (field.fromProfile && profile[field.fromProfile] != null) {
      values[field.key] = String(profile[field.fromProfile]);
    } else {
      values[field.key] = "";
    }
  }
  return values;
}
