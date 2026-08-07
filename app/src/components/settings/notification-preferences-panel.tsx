"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { useSettings } from "@/providers/settings-provider";
import { useToast } from "@/providers/toast-provider";
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  validateNotificationPreferences,
  type NotificationExtraChannel,
  type NotificationPreferences,
} from "@/lib/notifications/notification-preferences";
import { cn } from "@/lib/utils";

export function NotificationPreferencesPanel() {
  const { identity } = useAuth();
  const { settings, setNotificationPreferences } = useSettings();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<NotificationPreferences>(
    settings.notifications
  );

  useEffect(() => {
    setDraft(settings.notifications);
  }, [settings.notifications]);

  useEffect(() => {
    if (
      identity?.provider === "email" &&
      identity.email &&
      !draft.email
    ) {
      setDraft((prev) => ({ ...prev, email: identity.email ?? "" }));
    }
  }, [identity, draft.email]);

  function selectChannel(id: NotificationExtraChannel) {
    setDraft((prev) => ({
      ...prev,
      extraChannel: id,
      email:
        id === "email" && !prev.email && identity?.email
          ? identity.email
          : prev.email,
    }));
  }

  function handleSave() {
    const check = validateNotificationPreferences(draft);
    if (!check.valid) {
      showToast(check.message ?? "入力内容を確認してください");
      return;
    }
    setNotificationPreferences(draft);
    showToast(
      draft.extraChannel === "email"
        ? "メールでのお知らせ希望を、この端末に保存しました"
        : "お知らせの受け取り方を保存しました"
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>重要なお知らせの受け取り方</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          支援制度など、大切な案内が変わったときに知らせてほしい方へ。サイトを開くだけでも最新は確認できます。
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          LINEはログインのためだけに使います。LINEのメッセージでお知らせする機能ではありません。
        </p>

        <div className="space-y-2">
          {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectChannel(option.id)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                draft.extraChannel === option.id
                  ? "border-brand-green bg-emerald-50/80 ring-1 ring-brand-green/20 dark:bg-emerald-950/30"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {draft.extraChannel === "email" ? (
          <div className="space-y-2">
            <label htmlFor="notify-email" className="text-sm font-medium">
              お知らせ用のメールアドレス
            </label>
            <Input
              id="notify-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={draft.email}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            {!identity ? (
              <p className="text-xs text-muted-foreground">
                マイページ登録（メール）もしておくと、あとから見返しやすくなります。
                <Link
                  href="/settings#mypage-register"
                  className="ml-1 font-medium text-primary underline-offset-2 hover:underline"
                >
                  登録へ
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <Button type="button" className="h-11 w-full" onClick={handleSave}>
          受け取り方を保存する
        </Button>
      </CardContent>
    </Card>
  );
}
