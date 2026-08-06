"use client";

import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/providers/settings-provider";
import { FONT_SIZE_LABELS, type FontSize } from "@/lib/settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ThemeToggleButtons } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const FONT_OPTIONS: FontSize[] = ["normal", "large", "xlarge"];

export default function SettingsPage() {
  const { settings, setFontSize } = useSettings();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#mypage-register") return;
    const el = document.getElementById("mypage-register");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <SiteHeader title="設定" showBack backHref="/mypage" />
      <main className="space-y-6 px-4 py-6 pb-28">
        <NotificationSettings />

        <Card>
          <CardHeader>
            <CardTitle>表示（明るい／暗い）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base text-muted-foreground">
              画面の明るさを切り替えます。はじめは明るい表示をおすすめしています（読みやすさ・ロゴとの一体感のため）。
            </p>
            <ThemeToggleButtons />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>文字サイズ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base text-muted-foreground">
              読みやすいサイズを選んでください。高齢者の方は「大きい」または「特大」がおすすめです。
            </p>
            <div className="grid gap-2">
              {FONT_OPTIONS.map((size) => (
                <Button
                  key={size}
                  variant={settings.fontSize === size ? "default" : "outline"}
                  className="h-auto justify-start py-4"
                  onClick={() => setFontSize(size)}
                >
                  <span
                    className={cn(
                      size === "large" && "text-lg",
                      size === "xlarge" && "text-xl"
                    )}
                  >
                    {FONT_SIZE_LABELS[size]}
                    {size === "normal" && "（16px）"}
                    {size === "large" && "（18px）"}
                    {size === "xlarge" && "（20px）"}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
