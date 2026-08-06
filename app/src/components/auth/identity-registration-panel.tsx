"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type RegisterMethod = "none" | "email" | "line";

const CONTINUITY_NOTES = [
  "登録しなくても、やることの確認はすべて使えます。進捗はこの端末に自動保存されます。",
  "本人確認すると、別の端末やブラウザからも同じ内容を引き継げます（設定完了後）。",
] as const;

export function IdentityRegistrationPanel() {
  const {
    loading,
    configured,
    identity,
    identityLabel,
    sendEmailVerificationLink,
    signInWithLine,
    signOut,
    refresh,
  } = useAuth();

  const searchParams = useSearchParams();
  const [method, setMethod] = useState<RegisterMethod>("none");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [verifiedBanner, setVerifiedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified")) {
      setVerifiedBanner(true);
      void refresh();
    }
  }, [searchParams, refresh]);

  useEffect(() => {
    if (identity?.provider === "email") setMethod("email");
    else if (identity?.provider === "line") setMethod("line");
  }, [identity]);

  async function handleSendEmail() {
    setBusy(true);
    setError(null);
    setEmailSent(false);
    const result = await sendEmailVerificationLink(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEmailSent(true);
  }

  async function handleLineLogin() {
    setBusy(true);
    setError(null);
    const result = await signInWithLine();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setMethod("none");
    setEmailSent(false);
    setBusy(false);
  }

  if (loading) {
    return (
      <Card id="mypage-register" className="border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="mypage-register" className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-brand-green" />
          マイページ登録（本人確認）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          メールまたはLINEで本人確認すると、登録済みであることが各ページで分かります。通知の配信ではなく、<strong className="font-medium text-foreground">本人確認とデータの引き継ぎ</strong>が目的です。
        </p>

        {!configured && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            いまは端末内保存のみです。メール／LINE認証を使うには、Supabase の設定が必要です（管理者向け手順書を参照）。
          </p>
        )}

        {verifiedBanner && identity && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            本人確認が完了しました。{identityLabel}
          </p>
        )}

        {identity ? (
          <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <div className="space-y-1">
                <p className="font-medium">登録済み</p>
                <p className="text-sm text-muted-foreground">{identityLabel}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              ログアウト（端末内の続きは残ります）
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {CONTINUITY_NOTES.map((item) => (
                <li key={item}>・{item}</li>
              ))}
            </ul>

            <div className="space-y-2">
              <p className="text-sm font-medium">確認方法を選ぶ</p>

              <MethodButton
                active={method === "none"}
                onClick={() => setMethod("none")}
                title="登録しない"
                description="この端末だけで使う（今までどおり）"
              />

              <MethodButton
                active={method === "email"}
                onClick={() => setMethod("email")}
                icon={Mail}
                title="メールで本人確認"
                description="確認メールのリンクをタップして登録"
              />

              <MethodButton
                active={method === "line"}
                onClick={() => setMethod("line")}
                icon={MessageCircle}
                title="LINEで本人確認"
                description="LINEアカウントでログインして登録"
              />
            </div>

            {method === "email" && (
              <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
                <label htmlFor="verify-email" className="text-sm font-medium">
                  メールアドレス
                </label>
                <Input
                  id="verify-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailSent(false);
                    setError(null);
                  }}
                />
                {emailSent ? (
                  <p className="text-sm leading-relaxed text-emerald-800">
                    確認メールを送信しました。届いたメールのリンクをタップすると、本人確認が完了します（数分かかる場合があります）。
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    空メールではなく、<strong className="font-medium">確認用のリンク</strong>が記載されたメールが届きます。
                  </p>
                )}
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={busy || !email.trim() || !configured}
                  onClick={() => void handleSendEmail()}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "確認メールを送信"
                  )}
                </Button>
              </div>
            )}

            {method === "line" && (
              <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  LINEアカウントでログインすると、本人確認済みとして登録されます。
                </p>
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={busy || !configured}
                  onClick={() => void handleLineLogin()}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      LINEでログイン
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="rounded-xl border border-border/80 bg-background px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">管理者向け</p>
          <p className="mt-1">
            設定手順は
            <Link
              href="/about#line-login-setup"
              className="mx-1 font-medium text-primary underline-offset-2 hover:underline"
            >
              このサービスについて
            </Link>
            をご覧ください。
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
          >
            Supabase ダッシュボード
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function MethodButton({
  active,
  onClick,
  title,
  description,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: typeof Mail;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-4 text-left transition-colors",
        active
          ? "border-brand-green bg-muted/50 ring-1 ring-brand-green/20"
          : "border-border bg-background hover:bg-muted/40"
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              active ? "text-brand-green" : "text-muted-foreground"
            )}
          />
        )}
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
