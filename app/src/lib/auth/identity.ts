/** 本人確認済みアカウント（Supabase Auth） */

export type VerifiedAuthProvider = "email" | "line";

export interface VerifiedIdentity {
  userId: string;
  provider: VerifiedAuthProvider;
  /** メールログイン時 */
  email?: string;
  /** LINEログイン時（表示名） */
  lineDisplayName?: string;
  /** LINE userId（内部用・表示はマスク） */
  lineUserId?: string;
  verifiedAt: string;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "登録済み";
  return `${local.slice(0, 2)}***@${domain}`;
}

export function formatVerifiedIdentityLabel(identity: VerifiedIdentity): string {
  if (identity.provider === "email" && identity.email) {
    return `メール確認済み（${maskEmail(identity.email)}）`;
  }
  if (identity.provider === "line") {
    const name = identity.lineDisplayName ?? "LINE";
    return `LINE確認済み（${name}）`;
  }
  return "本人確認済み";
}

export function identityFromSupabaseUser(user: {
  id: string;
  email?: string | null;
  created_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): VerifiedIdentity | null {
  const providerRaw = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers as string[] | undefined;
  const isLine =
    providerRaw === "line" ||
    providers?.includes("line") ||
    user.user_metadata?.iss === "https://access.line.me";

  if (isLine) {
    const lineDisplayName =
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      undefined;
    const lineUserId =
      typeof user.user_metadata?.sub === "string"
        ? user.user_metadata.sub
        : typeof user.user_metadata?.user_id === "string"
          ? user.user_metadata.user_id
          : undefined;

    return {
      userId: user.id,
      provider: "line",
      lineDisplayName,
      lineUserId,
      verifiedAt: user.created_at ?? new Date().toISOString(),
    };
  }

  if (user.email && !user.email.endsWith("@anonymous.local")) {
    return {
      userId: user.id,
      provider: "email",
      email: user.email,
      verifiedAt: user.created_at ?? new Date().toISOString(),
    };
  }

  return null;
}

export function isAnonymousSupabaseUser(user: {
  is_anonymous?: boolean;
  app_metadata?: Record<string, unknown>;
}): boolean {
  if (user.is_anonymous === true) return true;
  return user.app_metadata?.provider === "anonymous";
}
