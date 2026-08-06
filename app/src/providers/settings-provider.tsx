"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type AppSettings,
  type FontSize,
} from "@/lib/settings";
import {
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/notification-preferences";

interface SettingsContextValue {
  settings: AppSettings;
  setFontSize: (size: FontSize) => void;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: normalizeNotificationPreferences(parsed.notifications),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(next: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
}

function applyFontSize(fontSize: FontSize): void {
  document.documentElement.dataset.fontSize = fontSize;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applyFontSize(loaded.fontSize);
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings((prev) => {
      const next = { ...prev, fontSize };
      persistSettings(next);
      applyFontSize(fontSize);
      return next;
    });
  }, []);

  const setNotificationPreferences = useCallback(
    (notifications: NotificationPreferences) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          notifications: {
            ...notifications,
            updatedAt: new Date().toISOString(),
          },
        };
        persistSettings(next);
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ settings, setFontSize, setNotificationPreferences }),
    [settings, setFontSize, setNotificationPreferences]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
