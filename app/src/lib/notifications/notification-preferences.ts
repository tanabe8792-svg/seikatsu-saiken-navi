/**
 * お知らせの受け取り方 — 表示・設定専用
 * ① アプリを開いたとき（常時） + ② メール / LINE（任意）
 */

export type NotificationExtraChannel = "none" | "email" | "line";

export interface NotificationPreferences {
  /** ② 追加チャネル（①は常に有効） */
  extraChannel: NotificationExtraChannel;
  email: string;
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
    label: "登録しない（通知なし）",
    description:
      "連絡先は不要です。サイトを開いたときに、最新の案内と続きの「いま」を確認できます。",
    requiresContact: false,
  },
  {
    id: "email",
    label: "メールで最新情報をすぐ受け取る",
    description:
      "新しい支援案内など、すぐ知りたい方向け。サイトを開いていなくてもメールでお知らせします（任意・配信開始後）。",
    requiresContact: true,
  },
  {
    id: "line",
    label: "LINEで最新情報をすぐ受け取る",
    description:
      "新しい支援案内など、すぐ知りたい方向け。LINEでもお知らせします（任意・配信開始は別途案内）。",
    requiresContact: true,
  },
];

export function normalizeNotificationPreferences(
  raw: unknown
): NotificationPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  const p = raw as Partial<NotificationPreferences>;
  const extraChannel =
    p.extraChannel === "email" || p.extraChannel === "line"
      ? p.extraChannel
      : "none";
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
      ? `マイページ + メール（${maskEmail(prefs.email)}）`
      : "マイページ + メール（未入力）";
  }
  if (prefs.extraChannel === "line") {
    return prefs.lineId
      ? `マイページ + LINE（${maskLineId(prefs.lineId)}）`
      : "マイページ + LINE（未入力）";
  }
  return "アプリを開いたとき";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "登録済み";
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

function maskLineId(lineId: string): string {
  if (lineId.length <= 4) return lineId;
  return `${lineId.slice(0, 2)}…${lineId.slice(-2)}`;
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
  if (prefs.extraChannel === "line") {
    if (!prefs.lineId.trim()) {
      return { valid: false, message: "LINE ID を入力してください" };
    }
  }
  return { valid: true };
}
