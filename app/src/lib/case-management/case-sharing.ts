/**
 * ケース共有・招待・RBAC（P1）
 * docs/27_P1_家族招待設計.md
 */

import type { CaseMemberRole } from "./case-access";

/** P1 の実務権限（ケース単位） */
export type CaseAccessLevel = "view" | "edit";

/** 運用上のケース状態（行政ポータル向け・将来） */
export type OperationalCaseStatus =
  | "self_managing"
  | "family_support"
  | "gov_support"
  | "completed";

export const OPERATIONAL_CASE_STATUS_LABELS: Record<
  OperationalCaseStatus,
  string
> = {
  self_managing: "本人対応中",
  family_support: "家族支援中",
  gov_support: "行政支援中",
  completed: "生活再建完了",
};

export const CASE_ACCESS_LEVEL_LABELS: Record<CaseAccessLevel, string> = {
  view: "見るだけ",
  edit: "書きかえもできる",
};

/** 将来ロールを access_level に落とすときの既定 */
export function defaultAccessLevelForRole(role: CaseMemberRole): CaseAccessLevel {
  if (role === "viewer") return "view";
  if (role === "volunteer") return "view";
  return "edit";
}

export function canAccessLevel(
  level: CaseAccessLevel,
  need: CaseAccessLevel
): boolean {
  if (need === "view") return true;
  return level === "edit";
}

/** 編集系アクションに必要か */
export function accessLevelAllows(
  level: CaseAccessLevel,
  action: "view" | "edit_profile" | "complete_task" | "invite_member"
): boolean {
  if (action === "view") return true;
  if (action === "invite_member") return false; // 招待は owner のみ（RPC）
  return level === "edit";
}

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createInviteCode(): string {
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(8))
      : Uint8Array.from({ length: 8 }, () => Math.floor(Math.random() * 256));
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += INVITE_ALPHABET[bytes[i]! % INVITE_ALPHABET.length];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidInviteCode(value: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(normalizeInviteCode(value));
}

export function familyInviteUrl(inviteCode: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/invite/${encodeURIComponent(normalizeInviteCode(inviteCode))}`;
}

export interface CaseMembershipSummary {
  caseId: string;
  publicCaseId: string;
  role: CaseMemberRole | string;
  accessLevel: CaseAccessLevel;
  caseStatus?: OperationalCaseStatus | string;
  updatedAt?: string;
}

export interface AcceptedInviteResult {
  caseId: string;
  publicCaseId: string;
  accessLevel: CaseAccessLevel;
  role: string;
  caseFile: unknown;
}
