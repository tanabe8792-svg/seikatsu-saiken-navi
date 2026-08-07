import type { NotificationPreferences } from "@/lib/notifications/notification-preferences";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/notification-preferences";

export type FontSize = "normal" | "large" | "xlarge";

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  normal: "ふつう",
  large: "大きい",
  xlarge: "もっと大きい",
};

export const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  normal: "text-base",
  large: "text-lg",
  xlarge: "text-xl",
};

export const SETTINGS_STORAGE_KEY = "seikatsu-saiken-navi-settings";

export interface AppSettings {
  fontSize: FontSize;
  notifications: NotificationPreferences;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: "large",
  notifications: { ...DEFAULT_NOTIFICATION_PREFERENCES },
};
