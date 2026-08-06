/**
 * ケース中心アクセス — 公開ID・回復コード・RBAC 土台
 * docs/26_ケース中心アクセス設計.md
 */

/** 紙・口頭・QR用の公開ケース番号（内部 caseId とは別） */
export type PublicCaseId = string;

export type CaseMemberRole =
  | "owner"
  | "family"
  | "government"
  | "swc"
  | "volunteer"
  | "viewer";

export type CasePermissionAction =
  | "view"
  | "edit_profile"
  | "complete_task"
  | "update_support"
  | "invite_member"
  | "reissue_access"
  | "close_case";

const ROLE_PERMISSIONS: Record<CaseMemberRole, ReadonlySet<CasePermissionAction>> = {
  owner: new Set([
    "view",
    "edit_profile",
    "complete_task",
    "update_support",
    "invite_member",
    "reissue_access",
    "close_case",
  ]),
  family: new Set(["view", "edit_profile", "complete_task", "invite_member"]),
  government: new Set([
    "view",
    "edit_profile",
    "complete_task",
    "update_support",
    "invite_member",
    "reissue_access",
    "close_case",
  ]),
  swc: new Set([
    "view",
    "edit_profile",
    "complete_task",
    "update_support",
    "invite_member",
  ]),
  volunteer: new Set(["view", "complete_task"]),
  viewer: new Set(["view"]),
};

export function canCaseRole(
  role: CaseMemberRole,
  action: CasePermissionAction
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

const PUBLIC_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(length: number): string {
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(length))
      : Uint8Array.from({ length }, () => Math.floor(Math.random() * 256));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PUBLIC_ID_ALPHABET[bytes[i]! % PUBLIC_ID_ALPHABET.length];
  }
  return out;
}

/** 例: KMT-74XQ-3L （読み上げ・手書きしやすい） */
export function createPublicCaseId(prefix = "KMT"): PublicCaseId {
  return `${prefix}-${randomChars(4)}-${randomChars(2)}`;
}

export function isValidPublicCaseId(value: string): boolean {
  return /^[A-Z]{2,4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/i.test(value.trim());
}

export function normalizePublicCaseId(value: string): string {
  return value.trim().toUpperCase();
}

/** 紙で渡す回復コード（平文は印刷用。DBにはハッシュのみ） */
export function createRecoveryCode(): string {
  return `${randomChars(4)}-${randomChars(4)}`;
}

export function caseCardUrl(
  publicCaseId: string,
  origin?: string
): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/c/${encodeURIComponent(normalizePublicCaseId(publicCaseId))}`;
}

export interface CaseMemberDraft {
  role: CaseMemberRole;
  displayName?: string;
  userId?: string;
}

/** 既存ケースに公開ID・回復コードが無ければ付与（破壊的変更なし） */
export function ensureCaseAccessCodes<T extends { publicCaseId?: string; recoveryCode?: string }>(
  caseFile: T
): T {
  const next = { ...caseFile };
  if (!next.publicCaseId || !isValidPublicCaseId(next.publicCaseId)) {
    next.publicCaseId = createPublicCaseId();
  } else {
    next.publicCaseId = normalizePublicCaseId(next.publicCaseId);
  }
  if (!next.recoveryCode) {
    next.recoveryCode = createRecoveryCode();
  }
  return next;
}
