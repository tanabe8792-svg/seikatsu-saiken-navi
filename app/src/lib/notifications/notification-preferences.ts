/**
 * お知らせの受け取り方 — 表示・設定専用
 * ① アプリを開いたとき（常時） + ② メール（任意）
 * LINEログインは本人確認用。LINEメッセージ通知とは別です。
 */

export type NotificationExtraChannel = "none" | "email";

export interface NotificationPreferences {
  /** ② 追加チャネル（①は常に有効） */
  extraChannel: NotificationExtraChannel;
  email: string;
  /** 互換のため残す（未使用） */
  lineId: string;
  updatedAt?: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  extraChannel: "none",
  email: "",
  lineId: "",
};

export const NOTIFICATION_CHANNEL_OPTIONS: {
  id: NotificationExtraChannel;
  label: string;
  description: string;
  requiresContact: boolean;
}[] = [
  {
    id: "none",
    label: "いまは登録しない",
    description:
      "連絡先は不要です。サイトを開いたときに、最新の案内を確認できます。",
    requiresContact: false,
  },
  {
    id: "email",
    label: "メールで重要なお知らせを受け取る",
    description:
      "支援制度など、大切な案内が更新されたときにメールでお知らせします（任意）。お知らせの準備ができ次第、この設定に従います。",
    requiresContact: true,
  },
];

export function normalizeNotificationPreferences(
  raw: unknown
): NotificationPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  const p = raw as Partial<NotificationPreferences> & {
    extraChannel?: string;
  };
  // 旧「LINE通知」設定は、ログイン用と紛らわしいためメール希望なしに戻す
  const extraChannel = p.extraChannel === "email" ? "email" : "none";
  return {
    extraChannel,
    email: typeof p.email === "string" ? p.email.trim() : "",
    lineId: typeof p.lineId === "string" ? p.lineId.trim() : "",
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
  };
}

export function getNotificationPreferenceSummary(
  prefs: NotificationPreferences
): string {
  if (prefs.extraChannel === "email") {
    return prefs.email
      ? `メールでお知らせ（${maskEmail(prefs.email)}）`
      : "メールでお知らせ（未入力）";
  }
  return "サイトを開いたときに確認";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "登録済み";
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

export function validateNotificationPreferences(
  prefs: NotificationPreferences
): { valid: boolean; message?: string } {
  if (prefs.extraChannel === "email") {
    if (!prefs.email) {
      return { valid: false, message: "メールアドレスを入力してください" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prefs.email)) {
      return { valid: false, message: "メールアドレスの形式を確認してください" };
    }
  }
  return { valid: true };
}
