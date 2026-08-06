"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Camera,
  ChevronRight,
  HelpCircle,
  Info,
  ListRestart,
  Loader2,
  MessageCircle,
  RotateCcw,
  Settings,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCaseSituation,
  getCaseProgress,
} from "@/lib/case-management/action-queue";
import { J00_DISASTER_EVENT_LABEL } from "@/lib/j00-hearing";
import { getNotificationPreferenceSummary } from "@/lib/notifications/notification-preferences";
import { OfficialLineFriendCard } from "@/components/line/official-line-friend-card";
import { useSettings } from "@/providers/settings-provider";
import { useUserSession } from "@/hooks/use-user-session";

export default function MyPage() {
  const router = useRouter();
  const { session, loading, resetSession } = useUserSession();
  const { settings } = useSettings();
  const { caseFile } = session;
  const notifySummary = getNotificationPreferenceSummary(settings.notifications);

  if (loading) {
    return (
      <>
        <SiteHeader title="その他" />
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const progress = caseFile ? getCaseProgress(caseFile) : null;
  const situation = caseFile ? formatCaseSituation(caseFile) : null;

  return (
    <>
      <SiteHeader title="その他" />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold">マイページ登録（任意）</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  最新の支援案内などを、メールやLINEですぐ受け取りたい方向けです。登録しなくても、やることの確認はすべてご利用いただけます。
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  進捗や入力内容は、この端末の中に自動保存されます（同じ端末なら続きから再開できます）。マイページ登録は、通知用の連絡先を残す任意の機能です。
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="h-12 w-full">
              <Link href="/settings#mypage-register">
                マイページ登録・確認する
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <OfficialLineFriendCard />

        <Card className="border-border bg-card">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-muted-foreground">生活再建ナビ</p>
            <p className="text-base leading-relaxed">{J00_DISASTER_EVENT_LABEL}</p>
            {caseFile && progress && (
              <div className="rounded-xl border bg-background/80 bg-background/80 px-4 py-3">
                {situation && situation !== "状況確認中" && (
                  <p className="text-sm font-medium">{situation}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  確認済み {progress.completed} / {progress.total} 件
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width:
                        progress.total > 0
                          ? `${(progress.completed / progress.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            )}
            {!caseFile && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                まだ状況の入力が完了していません。
              </p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            記録
          </p>
          <MenuLink
            href="/records"
            icon={Camera}
            label="記録した写真を見返す"
            note="端末に残した写真"
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            サービス
          </p>
          <MenuLink
            href="/about"
            icon={Info}
            label="このサービスについて"
            note="誰が作っているか、情報の扱い方"
          />
          <MenuLink
            href="/faq"
            icon={HelpCircle}
            label="よくある質問"
            note="使い方や不安なこと"
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            設定
          </p>
          <MenuLink
            href="/settings"
            icon={Settings}
            label="設定"
            note="文字サイズ・お知らせの受け取り方"
          />
          <MenuLink
            href="/settings#mypage-register"
            icon={Bell}
            label="マイページ登録（任意）"
            note={
              notifySummary === "アプリを開いたとき"
                ? "最新情報の通知（任意）／ブックマーク案内"
                : notifySummary
            }
          />
          <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-3">
            <Bell className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">いまの受け取り方</p>
              <p className="text-sm text-muted-foreground">{notifySummary}</p>
            </div>
          </div>
          <MenuLink
            href="/start?redo=1"
            icon={ListRestart}
            label="状況を選び直す"
            note="最初の質問からやり直す"
          />
          <MenuLink
            href="/chat"
            icon={MessageCircle}
            label="AI相談"
            note="通信が安定しているとき"
          />
        </section>

        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-3 px-2 py-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                if (confirm("保存した内容をすべて消して、最初からやり直しますか？")) {
                  resetSession();
                  router.replace("/start");
                }
              }}
            >
              <RotateCcw className="h-5 w-5 shrink-0" />
              <span className="text-left">
                <span className="block text-base font-medium">データをリセット</span>
                <span className="block text-sm font-normal opacity-80">
                  入力内容と進捗を消します
                </span>
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  note,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-brand-green" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
