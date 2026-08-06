"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ExternalLink, Mail, MessageCircle, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  validateNotificationPreferences,
  type NotificationExtraChannel,
  type NotificationPreferences,
} from "@/lib/notifications/notification-preferences";
import {
  formatOfficialLineBasicId,
  getOfficialLineAddFriendUrl,
} from "@/lib/line/official-account";
import { useSettings } from "@/providers/settings-provider";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS: Record<NotificationExtraChannel, typeof Smartphone> = {
  none: Smartphone,
  email: Mail,
  line: MessageCircle,
};

const MYPAGE_BENEFITS = [
  "最新の支援案内などを、すぐに知りたいときだけメール／LINEで受け取れる",
  "アプリを開いていなくても、お知らせで気づける（配信開始後）",
] as const;

const CONTINUITY_NOTES = [
  "進捗ややることの続きは、登録しなくてもこの端末に自動で残ります。ページを閉じても、同じ端末ならまた開けます。",
  "あとから見返しやすいように、このサイトをブラウザのブックマーク（お気に入り）に追加しておくと安心です。消さなければ、いつでも戻れます。",
] as const;

export function NotificationSettings() {
  const { settings, setNotificationPreferences } = useSettings();
  const [draft, setDraft] = useState<NotificationPreferences>(
    settings.notifications
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function selectChannel(channel: NotificationExtraChannel) {
    setDraft((prev) => ({ ...prev, extraChannel: channel }));
    setError(null);
    setSaved(false);
  }

  function handleSave() {
    const validation = validateNotificationPreferences(draft);
    if (!validation.valid) {
      setError(validation.message ?? "入力を確認してください");
      setSaved(false);
      return;
    }
    setNotificationPreferences({
      ...draft,
      updatedAt: new Date().toISOString(),
    });
    setError(null);
    setSaved(true);
  }

  const selected = NOTIFICATION_CHANNEL_OPTIONS.find(
    (o) => o.id === draft.extraChannel
  );
  const isRegistered =
    settings.notifications.extraChannel !== "none" &&
    ((settings.notifications.extraChannel === "email" &&
      !!settings.notifications.email) ||
      settings.notifications.extraChannel === "line");

  return (
    <Card id="mypage-register" className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          マイページ登録（任意）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          必須ではありません。登録しなくても、やることの確認はすべて使えます。マイページ登録は、「最新情報をすぐ受け取りたい方」向けの任意の連絡先登録です。
        </p>

        {isRegistered && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
            この端末にマイページ連絡先が登録されています。内容の変更も下からできます。
          </p>
        )}

        <div className="rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium">登録しなくてもできること</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {CONTINUITY_NOTES.map((item) => (
              <li key={item}>・{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">登録するとできること</p>
          <p className="mt-1 text-xs text-muted-foreground">
            サイト上の最新情報は、開いたときに反映されます。すぐ知りたいときのための通知です。
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {MYPAGE_BENEFITS.map((item) => (
              <li key={item}>・{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">受け取り方を選ぶ</p>
          {NOTIFICATION_CHANNEL_OPTIONS.map((option) => {
            const Icon = CHANNEL_ICONS[option.id];
            const active = draft.extraChannel === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => selectChannel(option.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-4 text-left transition-colors",
                  active
                    ? "border-brand-green bg-muted/50 ring-1 ring-brand-green/20"
                    : "border-border bg-background hover:bg-muted/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected?.requiresContact && draft.extraChannel === "email" && (
          <div className="space-y-2">
            <label htmlFor="notify-email" className="text-sm font-medium">
              メールアドレス
            </label>
            <Input
              id="notify-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={draft.email}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, email: e.target.value }));
                setSaved(false);
                setError(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              いまは端末に覚えるだけです。「このメールで合っていますか？」の確認メールは、送信の仕組みを用意してから追加します（独自ドメインは必須ではありません）。
            </p>
          </div>
        )}

        {selected?.requiresContact && draft.extraChannel === "line" && (
          <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
            <p className="text-sm font-medium">公式LINEアカウント</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              通知を受け取るには、先に公式LINEを友だち追加してください。
            </p>
            <p className="text-xs text-muted-foreground">
              ID:{" "}
              <span className="font-medium text-foreground">
                {formatOfficialLineBasicId()}
              </span>
            </p>
            <Button asChild variant="outline" className="h-12 w-full">
              <a
                href={getOfficialLineAddFriendUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                公式LINEを友だち追加する
                <ExternalLink className="h-4 w-4 opacity-70" />
              </a>
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              友だち追加後、下の「マイページ登録を保存」を押してください。メッセージ配信の自動連携は、LINE
              Messaging API の設定が整い次第開始します。
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border/80 bg-background px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-primary" />
            情報の扱い方
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>・連絡先は、いまのところこの端末の中だけに保存します。</li>
            <li>・サーバーへ自動送信したり、第三者に渡したりしません。</li>
            <li>・メール・LINEは「すぐ知りたい」方向けの通知です（配信は順次開始）。</li>
            <li>・続きの保存には登録は不要です。ブックマークもあわせてご利用ください。</li>
            <li>・登録はいつでも「通知なし」に戻せます。</li>
            <li>
              ・詳しくは
              <Link
                href="/about"
                className="mx-1 font-medium text-primary underline-offset-2 hover:underline"
              >
                このサービスについて
              </Link>
              もご覧ください。
            </li>
          </ul>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {saved && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            マイページの連絡先を、この端末に保存しました。
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full"
          onClick={handleSave}
        >
          {draft.extraChannel === "none"
            ? "登録なしで保存する"
            : "マイページ登録を保存"}
        </Button>
      </CardContent>
    </Card>
  );
}
