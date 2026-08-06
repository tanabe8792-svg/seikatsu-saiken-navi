"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  LogIn,
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

type AuthMode = "login" | "register";
type ContactMethod = "email" | "line";

interface IdentityRegistrationPanelProps {
  /** 見出し（省略時はモードに応じて切替） */
  title?: string;
  /** 初期モード */
  defaultMode?: AuthMode;
  /** ログイン成功後の案内リンク */
  afterLoginHref?: string;
  afterLoginLabel?: string;
}

export function IdentityRegistrationPanel({
  title,
  defaultMode = "login",
  afterLoginHref = "/mypage",
  afterLoginLabel = "マイページを見る",
}: IdentityRegistrationPanelProps) {
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
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [method, setMethod] = useState<ContactMethod>("email");
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

  async function handleSendEmail() {
    if (!emailLooksValid) {
      setError("メールアドレスの形式を確認してください。");
      return;
    }
    if (!configured) {
      setError(
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
      );
      return;
    }
    setBusy(true);
    setError(null);
    setEmailSent(false);
    const next =
      afterLoginHref.includes("?")
        ? `${afterLoginHref}&verified=email`
        : `${afterLoginHref}?verified=email`;
    const result = await sendEmailVerificationLink(email, next);
    setBusy(false);
    if (!result.ok) {
      setError(toUserFacingAuthError(result.message));
      return;
    }
    setEmailSent(true);
  }

  async function handleLineLogin() {
    if (!configured) {
      setError(
        "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
      );
      return;
    }
    setBusy(true);
    setError(null);
    const next =
      afterLoginHref.includes("?")
        ? `${afterLoginHref}&verified=line`
        : `${afterLoginHref}?verified=line`;
    const result = await signInWithLine(next);
    setBusy(false);
    if (!result.ok) {
      setError(toUserFacingAuthError(result.message));
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
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

  const heading =
    title ?? (mode === "login" ? "ログイン" : "マイページ登録");

  return (
    <Card id="mypage-register" className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserRound className="h-5 w-5 text-brand-green" />
          {heading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {verifiedBanner && identity && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {mode === "login" ? "ログインできました。" : "マイページ登録が完了しました。"}
            {identityLabel ? ` ${identityLabel}` : ""}
          </p>
        )}

        {identity ? (
          <div className="space-y-4 rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <div className="space-y-1">
                <p className="font-medium">ログイン中</p>
                <p className="text-sm text-muted-foreground">{identityLabel}</p>
              </div>
            </div>
            <Button asChild size="lg" className="h-12 w-full">
              <Link href={afterLoginHref}>{afterLoginLabel}</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              メールまたはLINEで、かんたんにログイン・登録できます。登録すると、保存した内容をマイページで見返せます。
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "outline"}
                className="h-12"
                onClick={() => {
                  setMode("login");
                  setEmailSent(false);
                  setError(null);
                }}
              >
                <LogIn className="h-4 w-4" />
                ログイン
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "outline"}
                className="h-12"
                onClick={() => {
                  setMode("register");
                  setEmailSent(false);
                  setError(null);
                }}
              >
                はじめて登録する
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("email")}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium",
                  method === "email"
                    ? "border-brand-green bg-muted/50 ring-1 ring-brand-green/20"
                    : "border-border"
                )}
              >
                <Mail className="mx-auto mb-1 h-5 w-5" />
                メール
              </button>
              <button
                type="button"
                onClick={() => setMethod("line")}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium",
                  method === "line"
                    ? "border-brand-green bg-muted/50 ring-1 ring-brand-green/20"
                    : "border-border"
                )}
              >
                <MessageCircle className="mx-auto mb-1 h-5 w-5" />
                LINE
              </button>
            </div>

            {method === "email" && (
              <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
                <label htmlFor="auth-email" className="text-sm font-medium">
                  メールアドレス
                </label>
                <Input
                  id="auth-email"
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
                  <div
                    className="space-y-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30"
                    role="status"
                  >
                    <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                      メールを送りました。届いたリンクをタップしてください
                    </p>
                    <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                      {mode === "login" ? "ログイン" : "登録"}
                      は、メール内のリンクを開くと完了します。完了すると「マイページ登録が完了しました」と大きく表示されます。
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-amber-950 dark:text-amber-50">
                      メールが見つからないときは、迷惑メールフォルダ（迷惑メール／Junk）も確認してください。
                    </p>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    メールアドレスを入れて、下のボタンを押してください。リンク付きのメールが届きます。迷惑メールフォルダに入ることがあります。
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
                  ) : mode === "login" ? (
                    "ログイン用メールを送信"
                  ) : (
                    "登録用メールを送信"
                  )}
                </Button>
              </div>
            )}

            {method === "line" && (
              <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  LINEアカウントで
                  {mode === "login" ? "ログイン" : "登録"}
                  できます。ボタンを押すとLINEの画面が開きます。
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
                      LINEで{mode === "login" ? "ログイン" : "登録する"}
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
      </CardContent>
    </Card>
  );
}

function toUserFacingAuthError(message: string): string {
  if (/supabase|vercel|env|smtp|管理者|docs\//i.test(message)) {
    return "いまはログインできませんでした。時間をおいて、もう一度お試しください。";
  }
  return message;
}
