/**
 * 罹災証明の地域別申請案内 — 司令塔UI用（表示専用）
 * このナビ全体の方針: 事前に見通しを立て、公式・直接ページへつなぐ。
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

export interface CertificateHubLink {
  label: string;
  href: string;
  kind: "online" | "official" | "guide";
  primary?: boolean;
}

export interface CertificateHubView {
  municipalityName: string;
  summary: string | null;
  officeHours: string | null;
  dailyLimit: string | null;
  ticketSystem: string | null;
  notes: string | null;
  links: CertificateHubLink[];
  sourceUpdatedAt: string | null;
}

/** デジタル庁の罹災証明オンライン申請案内（自治体横断の入口） */
const DIGITAL_GOV_CERT_GUIDE =
  "https://digital-gov.note.jp/n/ne4f237bf506b";

export function getCertificateHubForProfile(
  profile: UserProfile
): CertificateHubView | null {
  const code = resolveMunicipalityCode(profile.municipality);
  if (!code) return null;

  const municipality = getMunicipalityByCode(code);
  const overlay = getDisasterOverlay(code, DISASTER_EVENT_R8_KUMAMOTO.id);
  const cert = overlay?.certificateInfo;

  const links: CertificateHubLink[] = [];

  const onlineUrl = cert ? sourcedText(cert.onlineUrl) : null;
  const onlineAvailable =
    cert &&
    cert.onlineAvailable.value !== "確認不可" &&
    cert.onlineAvailable.value === true;

  if (onlineAvailable && onlineUrl && onlineUrl.startsWith("http")) {
    links.push({
      label: "オンライン申請・電子申請の案内を開く",
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
      label: `${municipality?.name ?? "自治体"}の罹災証明案内を開く`,
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
        kind: "official",
      });
    }
  }

  links.push({
    label: "オンライン申請できる自治体一覧（デジタル庁）",
    href: DIGITAL_GOV_CERT_GUIDE,
    kind: "guide",
  });

  const daily = cert ? sourcedText(cert.dailyLimit) : null;
  const ticket = cert ? sourcedText(cert.ticketSystem) : null;

  return {
    municipalityName: municipality?.name ?? profile.municipality ?? "お住まいの地域",
    summary: cert ? sourcedText(cert.summary) : null,
    officeHours: cert ? sourcedText(cert.officeHours) : null,
    dailyLimit: daily ? `1日あたり上限 ${daily}組` : null,
    ticketSystem:
      ticket === "あり" ? "整理券制あり" : ticket === "なし" ? "整理券制なし" : null,
    notes: cert ? sourcedText(cert.notes) : null,
    links,
    sourceUpdatedAt: formatSourceUpdatedAt(
      cert?.summary.updatedAt ?? overlay?.updatedAt ?? null
    ),
  };
}
