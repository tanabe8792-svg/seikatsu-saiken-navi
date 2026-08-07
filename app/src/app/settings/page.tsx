"use client";

import { Suspense, useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { IdentityRegistrationPanel } from "@/components/auth/identity-registration-panel";
import { FontSizeQuickControl } from "@/components/settings/font-size-quick-control";
import { NotificationPreferencesPanel } from "@/components/settings/notification-preferences-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
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
        <div id="mypage-register">
          <Suspense
            fallback={
              <p className="py-8 text-center text-sm text-muted-foreground">
                読み込み中…
              </p>
            }
          >
            <IdentityRegistrationPanel
              defaultMode="login"
              afterLoginHref="/mypage"
            />
          </Suspense>
        </div>

        <NotificationPreferencesPanel />

        <Card>
          <CardHeader>
            <CardTitle>文字サイズ</CardTitle>
          </CardHeader>
          <CardContent>
            <FontSizeQuickControl />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
