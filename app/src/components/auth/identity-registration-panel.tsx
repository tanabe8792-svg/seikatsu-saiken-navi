"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
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
import {
  explainAuthError,
  type UserFacingAuthError,
} from "@/lib/auth/auth-errors";

interface IdentityRegistrationPanelProps {
  /** 見出し（省略時は「ログイン・登録」） */
  title?: string;
  /** 互換のため残す（表示には使わない） */
  defaultMode?: "login" | "register";
  /** ログイン成功後の案内リンク */
  afterLoginHref?: string;
  afterLoginLabel?: string;
}

export function IdentityRegistrationPanel({
  title = "ログイン・登録",
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
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<UserFacingAuthError | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [verifiedBanner, setVerifiedBanner] = useState(false);

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSendEmail = emailLooksValid && !busy;

  useEffect(() => {
    if (searchParams.get("verified")) {
      setVerifiedBanner(true);
      void refresh();
    }
    const oauthError =
      searchParams.get("error_description") || searchParams.get("error");
    if (oauthError) {
      setError(explainAuthError(decodeURIComponent(oauthError)));
    }
  }, [searchParams, refresh]);

  async function handleSendEmail() {
    if (!emailLooksValid) {
      setError(
        explainAuthError("メールアドレスの形式を確認してください。")
      );
      return;
    }
    if (!configured) {
      setError(
        explainAuthError(
          "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
        )
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
      setError(result.error);
      return;
    }
    setEmailSent(true);
  }

  async function handleLineLogin() {
    if (!configured) {
      setError(
        explainAuthError(
          "ただいまログイン機能の準備中です。しばらくしてから、もう一度お試しください。"
        )
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
      setError(result.error);
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

  return (
    <Card id="mypage-register" className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserRound className="h-5 w-5 text-brand-green" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {verifiedBanner && identity && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            ログインできました。
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
            <p className="text-base leading-relaxed text-muted-foreground">
              LINEでかんたんにログイン・登録できます。登録すると、保存した内容をマイページで見返せます。LINEはログインのためだけに使います（メッセージのお知らせではありません）。
            </p>

            <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
              <p className="text-base leading-relaxed text-muted-foreground">
                はじめての人も、以前登録した人も、同じボタンから進めます。ボタンを押すとLINEの画面が開きます。
              </p>
              <Button
                type="button"
                className="h-14 w-full text-base"
                disabled={busy}
                onClick={() => void handleLineLogin()}
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    LINEでログイン・登録
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-xl border border-border">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-base font-medium"
                onClick={() => {
                  setShowEmail((v) => !v);
                  setError(null);
                }}
                aria-expanded={showEmail}
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  メールで続ける（予備）
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${showEmail ? "rotate-180" : ""}`}
                />
              </button>
              {showEmail && (
                <div className="space-y-3 border-t border-border px-4 py-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    メール登録は準備の都合で届かないことがあります。うまくいかないときは、上のLINEをお使いください。
                  </p>
                  <label htmlFor="auth-email" className="text-base font-medium">
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
                    className="h-12 text-base"
                  />
                  {emailSent ? (
                    <div
                      className="space-y-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30"
                      role="status"
                    >
                      <p className="text-base font-semibold text-amber-950 dark:text-amber-50">
                        メールを送りました。届いたリンクを開いてください
                      </p>
                      <p className="text-base leading-relaxed text-amber-900 dark:text-amber-100">
                        迷惑メールフォルダに入ることがあります。届かないときはLINEをお使いください。
                      </p>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full text-base"
                    disabled={!canSendEmail}
                    onClick={() => void handleSendEmail()}
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "ログイン用メールを送信"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div
            className="space-y-3 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-4"
            role="alert"
          >
            <p className="text-base font-bold text-destructive">{error.title}</p>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">考えられる原因</p>
              <p className="text-base leading-relaxed text-foreground">
                {error.cause}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">こうすると進みやすいです</p>
              <ul className="space-y-2">
                {error.actions.map((action) => (
                  <li
                    key={action}
                    className="text-base leading-relaxed text-foreground"
                  >
                    · {action}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              type="button"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => {
                setError(null);
                void handleLineLogin();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              もう一度LINEで試す
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
