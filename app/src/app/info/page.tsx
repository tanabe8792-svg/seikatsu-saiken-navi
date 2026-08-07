"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { AreaWeatherCard } from "@/components/home/area-weather-card";
import { FontSizeQuickControl } from "@/components/settings/font-size-quick-control";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserSession } from "@/hooks/use-user-session";
import { getAcuteExternalLinksForRecovery } from "@/lib/case-management/recovery-dashboard";

/**
 * ホームから外した気象・ライフライン・相談など。
 * 毎日サーバー更新しない静的リンク＋必要なときだけ気象取得。
 */
export default function InfoPage() {
  const { session } = useUserSession();
  const { profile, caseFile } = session;
  const acuteExternalLinks = caseFile
    ? getAcuteExternalLinksForRecovery(profile, caseFile)
    : [];

  return (
    <>
      <SiteHeader title="気象・ライフライン・相談" showBack backHref="/" />
      <main className="space-y-5 px-4 py-4 pb-28">
        <FontSizeQuickControl className="mx-0" />

        {profile.municipality ? (
          <AreaWeatherCard municipalityName={profile.municipality} />
        ) : (
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="text-base font-semibold">気象情報</p>
              <p className="text-base leading-relaxed text-muted-foreground">
                お住まいの地域を選ぶと、ここに気象の案内が出ます。
              </p>
              <Button asChild variant="outline" className="h-12 w-full">
                <Link href="/start">地域を選ぶ</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {acuteExternalLinks.length > 0 && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-base font-semibold">ライフライン・避難の公式案内</p>
              <p className="text-base leading-relaxed text-muted-foreground">
                外部の公式ページを開きます。このナビでは毎日自動では取りに行きません。
              </p>
              <ul className="space-y-2">
                {acuteExternalLinks.map((link) => (
                  <li key={link.sourceUrl}>
                    <a
                      href={link.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 rounded-xl border px-4 py-3 text-base text-primary underline-offset-2 hover:bg-muted/40 hover:underline"
                    >
                      <ExternalLink className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-base font-semibold">ほかに相談したいとき</p>
            <Button asChild size="lg" className="h-14 w-full text-lg">
              <Link href="/chat">
                <MessageCircle className="h-5 w-5" />
                AIに質問する
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full">
              <Link href="/mypage">
                マイページ
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
