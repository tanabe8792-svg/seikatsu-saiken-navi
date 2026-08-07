"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronRight,
  HelpCircle,
  History,
  Info,
  ListRestart,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  RotateCcw,
  Settings,
  UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { IdentityRegistrationPanel } from "@/components/auth/identity-registration-panel";
import { RegistrationCompleteBanner } from "@/components/auth/registration-complete-banner";
import { CaseAccessCard } from "@/components/case/case-access-card";
import { CaseSharePanel } from "@/components/case/case-share-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCaseSituation,
  getCaseProgress,
} from "@/lib/case-management/action-queue";
import { CASE_ACCESS_LEVEL_LABELS } from "@/lib/case-management/case-sharing";
import {
  clearLocalCaseShare,
  loadLocalCaseShare,
  type LocalCaseShareState,
} from "@/lib/case-management/case-share-storage";
import { buildPostJ00ProfileBullets } from "@/lib/onboarding/onboarding-copy";
import { J00_DISASTER_EVENT_LABEL } from "@/lib/j00-hearing";
import { useAuth } from "@/providers/auth-provider";
import { useUserSession } from "@/hooks/use-user-session";

export default function MyPage() {
  const router = useRouter();
  const { session, loading, resetSession } = useUserSession();
  const { identity, identityLabel, loading: authLoading, signOut } = useAuth();
  const { caseFile, profile } = session;
  const [shareState, setShareState] = useState<LocalCaseShareState | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setShareState(loadLocalCaseShare());
  }, [caseFile?.caseId, identity?.userId]);

  async function handleSignOut() {
    setSigningOut(true);
    clearLocalCaseShare();
    setShareState(null);
    await signOut();
    setSigningOut(false);
  }

  if (loading || authLoading) {
    return (
      <>
        <SiteHeader title="マイページ" />
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const progress = caseFile ? getCaseProgress(caseFile) : null;
  const situation = caseFile ? formatCaseSituation(caseFile) : null;
  const profileBullets = buildPostJ00ProfileBullets(profile);

  return (
    <>
      <SiteHeader title="マイページ" />
      <main className="space-y-5 px-4 py-4 pb-28">
        <Suspense fallback={null}>
          <RegistrationCompleteBanner />
        </Suspense>

        {shareState && !shareState.isOwner && (
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-base leading-relaxed">
            家族の代わりに操作中です（
            {CASE_ACCESS_LEVEL_LABELS[shareState.accessLevel]}
            までできます）。ログイン情報の共有ではなく、この記録だけが渡されています。
          </p>
        )}

        {!identity && (
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
              afterLoginLabel="保存した内容を見る"
            />
          </Suspense>
        )}

        {identity && (
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-6 w-6 shrink-0 text-brand-green" />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">あなたのマイページ</h2>
                  <p className="text-sm text-muted-foreground">{identityLabel}</p>
                </div>
              </div>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                登録・ログイン済みです。下で保存した内容を確認できます。
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                この端末に保存された状況や進捗を、下で確認できます。
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </>
                )}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ログアウトしても、この端末に残った進捗はそのままです。別のアカウントでログインするときに使います。
              </p>
            </CardContent>
          </Card>
        )}

        {caseFile && (
          <>
            <Card className="border-border bg-card">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  保存されている内容
                </p>
                <p className="text-base leading-relaxed">{J00_DISASTER_EVENT_LABEL}</p>

                {profileBullets.length > 0 && (
                  <ul className="space-y-2 rounded-xl border bg-background px-4 py-3">
                    {profileBullets.map((item) => (
                      <li key={item} className="text-sm leading-relaxed">
                        · {item}
                      </li>
                    ))}
                  </ul>
                )}

                {progress && (
                  <div className="rounded-xl border bg-background px-4 py-3">
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

                <div className="flex flex-col gap-2 pt-1">
                  <Button asChild size="lg" className="h-12 w-full">
                    <Link href="/actions">やることの一覧を見る</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CaseAccessCard caseFile={caseFile} />
            <CaseSharePanel caseFile={caseFile} />
          </>
        )}

        {!caseFile && identity && (
          <Card className="border-border bg-card">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                まだ状況の入力が完了していません。状況を選ぶと、ここに内容が残ります。
              </p>
              <Button asChild variant="outline" className="h-12 w-full">
                <Link href="/start">状況を選んで案内を作る</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold text-muted-foreground">
            写真の記録
          </p>
          <MenuLink
            href="/records"
            icon={Camera}
            label="記録した写真を見返す"
            note="端末に残した写真"
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold text-muted-foreground">
            使い方・説明
          </p>
          <MenuLink
            href="/about"
            icon={Info}
            label="このサービスについて"
            note="誰が作っているか、情報の扱い方"
          />
          <MenuLink
            href="/updates"
            icon={History}
            label="最近直したこと"
            note="改善の履歴"
          />
          <MenuLink
            href="/faq"
            icon={HelpCircle}
            label="よくある質問"
            note="使い方や不安なこと"
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold text-muted-foreground">
            見やすさ・ログイン・家族
          </p>
          <MenuLink
            href="/settings"
            icon={Settings}
            label="設定"
            note="文字の大きさ（見やすくする）"
          />
          <MenuLink
            href="/invite"
            icon={LogIn}
            label="家族から渡された案内で参加"
            note="招待コードを使う"
          />
          <MenuLink
            href="/settings#mypage-register"
            icon={LogIn}
            label={identity ? "ログイン状態" : "ログイン・登録"}
            note={
              identity
                ? identityLabel ?? "ログイン中"
                : "LINEでかんたん"
            }
          />
          <MenuLink
            href="/start?redo=1"
            icon={ListRestart}
            label="状況を選び直す"
            note="最初の質問からやり直す"
          />
          <MenuLink
            href="/chat"
            icon={MessageCircle}
            label="AIに質問する"
            note="通信が必要なとき"
          />
        </section>

        <Card className="border-destructive/20">
          <CardContent className="space-y-3 p-4">
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-3 px-2 py-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                if (
                  confirm("保存した内容をすべて消して、最初からやり直しますか？")
                ) {
                  resetSession();
                  router.replace("/start");
                }
              }}
            >
              <RotateCcw className="h-5 w-5 shrink-0" />
              <span className="text-left">
                <span className="block text-base font-medium">データをリセット</span>
                <span className="block text-sm font-normal opacity-80">
                  入力内容と進捗を消します（アカウントは残ります）
                </span>
              </span>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-auto w-full justify-start gap-3 px-2 py-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <Link href="/mypage/delete-account">
                <UserRound className="h-5 w-5 shrink-0" />
                <span className="text-left">
                  <span className="block text-base font-medium">
                    アカウントを削除
                  </span>
                  <span className="block text-sm font-normal opacity-80">
                    取り消せません。確認画面へ進みます
                  </span>
                </span>
              </Link>
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
