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
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

type RegisterMethod = "none" | "email" | "line";

const CONTINUITY_NOTES = [
  "登録しなくても、やることの確認はすべて使えます。進捗はこの端末に自動保存されます。",
  "マイページ登録すると、別の端末やブラウザからも同じ内容を引き継げます（設定完了後）。",
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

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSendEmail = emailLooksValid && !busy;

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
    if (!emailLooksValid) {
      setError("メールアドレスの形式を確認してください。");
      return;
    }
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
          <UserRound className="h-5 w-5 text-brand-green" />
          マイページ登録
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          あなたの<strong className="font-medium text-foreground">メールアドレス</strong>
          または<strong className="font-medium text-foreground">LINEアカウント</strong>
          でマイページ登録できます。登録すると、各ページで登録済みと表示され、別の端末からも続きを引き継げます。
        </p>

        {!configured && (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p className="font-medium">いまは送信の準備が未完了です</p>
            <p className="leading-relaxed">
              メール／LINE登録を動かすには、Vercel に Supabase の設定（
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>
              と
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              ）が必要です。下の手順書をご確認ください。
            </p>
          </div>
        )}

        {verifiedBanner && identity && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            マイページ登録が完了しました。{identityLabel}
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
              <p className="text-sm font-medium">登録方法を選ぶ</p>

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
                title="メールで登録"
                description="あなたのメールアドレスに登録用リンクを送ります"
              />

              <MethodButton
                active={method === "line"}
                onClick={() => setMethod("line")}
                icon={MessageCircle}
                title="LINEで登録"
                description="あなたのLINEアカウントでログインして登録"
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
                    登録用メールを送信しました。届いたメールのリンクをタップすると、マイページ登録が完了します（数分かかる場合があります。迷惑メールもご確認ください）。
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    メールアドレスを入れたら、下の緑のボタンを押してください。登録用のリンク付きメールが届きます。
                  </p>
                )}
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={!canSendEmail}
                  onClick={() => void handleSendEmail()}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "登録用メールを送信"
                  )}
                </Button>
              </div>
            )}

            {method === "line" && (
              <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  あなたのLINEアカウントでログインすると、マイページ登録が完了します。
                </p>
                <Button
                  type="button"
                  className="h-12 w-full"
                  disabled={busy}
                  onClick={() => void handleLineLogin()}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      LINEで登録する
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
          <p className="font-medium text-foreground">管理者向け（登録を動かすために必要なこと）</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Supabase プロジェクトを作成する</li>
            <li>
              Vercel に <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> を入れる
            </li>
            <li>Supabase で Email ログインを ON にする</li>
            <li>（LINEも使う場合）LINE Login チャネルを作り Supabase に接続する</li>
            <li>Vercel を Redeploy する</li>
          </ol>
          <p className="mt-2">
            詳しくは
            <Link
              href="/about#account-setup"
              className="mx-1 font-medium text-primary underline-offset-2 hover:underline"
            >
              このサービスについて
            </Link>
            または
            <code className="mx-1 rounded bg-muted px-1">docs/ACCOUNT_AUTH_SETUP.md</code>
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
