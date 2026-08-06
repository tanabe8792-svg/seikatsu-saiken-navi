/**
 * 罹災証明の地域別申請案内 — 司令塔UI用（表示専用）
 * 方針: このナビは行政と連携していない。公式ページ／窓口へつなぐ案内のみ。
 */

import {
  DISASTER_EVENT_R8_KUMAMOTO,
  getMunicipalityByCode,
  resolveMunicipalityCode,
} from "@/lib/knowledge/municipalities";
import { getDisasterOverlay } from "@/lib/knowledge/disaster-overlays";
import type { SourcedValue } from "@/lib/knowledge/types";
import type { UserProfile } from "@/lib/types";
import { formatSourceUpdatedAt } from "./format-source-updated-at";

function sourcedText(
  field: SourcedValue<string | number | boolean | null | string[]>
): string | null {
  if (field.value === "確認不可" || field.sourceUrl === null) return null;
  if (typeof field.value === "boolean") return field.value ? "あり" : "なし";
  if (field.value === null) return null;
  if (Array.isArray(field.value)) return field.value.join("、");
  return String(field.value);
}

export type CertificateApplyChannel =
  | "mynaportal"
  | "online_other"
  | "window_only"
  | "unknown";

export interface CertificateHubLink {
  label: string;
  href: string;
  kind: "online" | "official" | "guide" | "window";
  primary?: boolean;
}

export interface CertificateHubView {
  municipalityName: string;
  municipalitySelected: boolean;
  /** 申請チャネル（マイナポ／その他オンライン／窓口のみ） */
  applyChannel: CertificateApplyChannel;
  channelHeadline: string;
  channelBody: string;
  summary: string | null;
  officeHours: string | null;
  dailyLimit: string | null;
  ticketSystem: string | null;
  notes: string | null;
  links: CertificateHubLink[];
  sourceUpdatedAt: string | null;
  /** 行政との連携がないことの明示 */
  independenceNote: string;
}

/** デジタル庁の罹災証明オンライン申請案内（自治体横断の入口） */
const DIGITAL_GOV_CERT_GUIDE =
  "https://digital-gov.note.jp/n/ne4f237bf506b";

const INDEPENDENCE_NOTE =
  "このナビは市役所・町村役場と連携していません。ここに書いてある内容を持参しても、窓口での手続きが自動で進むわけではありません。申請は各自治体の公式の案内に従ってください。";

function detectMynaportal(text: string | null | undefined): boolean {
  if (!text) return false;
  return /マイナポ|マイナポータル|mynaportal/i.test(text);
}

export function getCertificateHubForProfile(
  profile: UserProfile
): CertificateHubView | null {
  const code = resolveMunicipalityCode(profile.municipality);
  if (!code) {
    return {
      municipalityName: "（市町村を選んでください）",
      municipalitySelected: false,
      applyChannel: "unknown",
      channelHeadline: "まず申請する市町村を選ぶ",
      channelBody:
        "り災証明は、被災した住家がある市町村へ申請します。下で市町村を選ぶと、マイナポータル対応か窓口かなど、進み方を案内します。",
      summary: null,
      officeHours: null,
      dailyLimit: null,
      ticketSystem: null,
      notes: null,
      links: [
        {
          label: "オンライン申請できる自治体一覧（デジタル庁）",
          href: DIGITAL_GOV_CERT_GUIDE,
          kind: "guide",
        },
      ],
      sourceUpdatedAt: null,
      independenceNote: INDEPENDENCE_NOTE,
    };
  }

  const municipality = getMunicipalityByCode(code);
  const overlay = getDisasterOverlay(code, DISASTER_EVENT_R8_KUMAMOTO.id);
  const cert = overlay?.certificateInfo;

  const summary = cert ? sourcedText(cert.summary) : null;
  const notes = cert ? sourcedText(cert.notes) : null;
  const onlineUrl = cert ? sourcedText(cert.onlineUrl) : null;
  const onlineAvailable =
    !!cert &&
    cert.onlineAvailable.value !== "確認不可" &&
    cert.onlineAvailable.value === true;

  const mentionsMyna =
    detectMynaportal(summary) || detectMynaportal(notes);

  let applyChannel: CertificateApplyChannel = "window_only";
  if (onlineAvailable && mentionsMyna) applyChannel = "mynaportal";
  else if (onlineAvailable) applyChannel = "online_other";
  else if (!cert) applyChannel = "unknown";

  const links: CertificateHubLink[] = [];

  if (applyChannel === "mynaportal" && onlineUrl?.startsWith("http")) {
    links.push({
      label: "マイナポータル等のオンライン申請案内を開く",
      href: onlineUrl,
      kind: "online",
      primary: true,
    });
  } else if (applyChannel === "online_other" && onlineUrl?.startsWith("http")) {
    links.push({
      label: "オンライン申請の案内を開く",
      href: onlineUrl,
      kind: "online",
      primary: true,
    });
  }

  const certPage =
    (cert?.summary.sourceUrl && cert.summary.sourceUrl.startsWith("http")
      ? cert.summary.sourceUrl
      : null) ??
    (overlay?.sourceUrl && overlay.sourceUrl.startsWith("http")
      ? overlay.sourceUrl
      : null);

  if (certPage && !links.some((l) => l.href === certPage)) {
    links.push({
      label: `${municipality?.name ?? "自治体"}の罹災証明・公式案内を開く`,
      href: certPage,
      kind: "official",
      primary: !links.some((l) => l.primary),
    });
  }

  if (municipality?.officialUrl) {
    if (!links.some((l) => l.href === municipality.officialUrl)) {
      links.push({
        label: `${municipality.name}公式サイト`,
        href: municipality.officialUrl,
        kind: applyChannel === "window_only" ? "window" : "official",
        primary: applyChannel === "window_only" && !links.some((l) => l.primary),
      });
    }
  }

  if (applyChannel === "mynaportal" || applyChannel === "online_other") {
    links.push({
      label: "オンライン申請できる自治体一覧（デジタル庁）",
      href: DIGITAL_GOV_CERT_GUIDE,
      kind: "guide",
    });
  } else {
    links.push({
      label: "ほかの自治体のオンライン対応を見る（デジタル庁）",
      href: DIGITAL_GOV_CERT_GUIDE,
      kind: "guide",
    });
  }

  const daily = cert ? sourcedText(cert.dailyLimit) : null;
  const ticket = cert ? sourcedText(cert.ticketSystem) : null;

  const name = municipality?.name ?? profile.municipality ?? "お住まいの地域";

  let channelHeadline: string;
  let channelBody: string;
  switch (applyChannel) {
    case "mynaportal":
      channelHeadline = `${name}はマイナポータル等のオンライン申請に対応`;
      channelBody =
        "まずはオンライン申請の公式案内を開き、案内に沿って申請してください。難しい場合や窓口希望のときは、同じページの窓口案内も確認できます。";
      break;
    case "online_other":
      channelHeadline = `${name}はオンライン申請に対応`;
      channelBody =
        "マイナポータル以外のオンライン申請がある地域です。公式の申請案内を開き、案内に沿って進めてください。";
      break;
    case "window_only":
      channelHeadline = `${name}は、いま確認できる範囲では窓口申請が中心です`;
      channelBody =
        "マイナポータル等のオンライン申請には、いまのところ対応していない（または未確認の）地域です。公式ページで手続きを確認し、窓口で申請してください。";
      break;
    default:
      channelHeadline = "申請方法を公式で確認してください";
      channelBody =
        "この地域のオンライン対応は未確認です。公式サイトで最新の申請方法を確認し、案内に従ってください。";
  }

  return {
    municipalityName: name,
    municipalitySelected: true,
    applyChannel,
    channelHeadline,
    channelBody,
    summary,
    officeHours: cert ? sourcedText(cert.officeHours) : null,
    dailyLimit: daily ? `1日あたり上限 ${daily}組` : null,
    ticketSystem:
      ticket === "あり" ? "整理券制あり" : ticket === "なし" ? "整理券制なし" : null,
    notes,
    links,
    sourceUpdatedAt: formatSourceUpdatedAt(
      cert?.summary.updatedAt ?? overlay?.updatedAt ?? null
    ),
    independenceNote: INDEPENDENCE_NOTE,
  };
}
