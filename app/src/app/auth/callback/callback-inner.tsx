"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { explainAuthError } from "@/lib/auth/auth-errors";

export default function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [errorCause, setErrorCause] = useState<string | null>(null);
  const [errorActions, setErrorActions] = useState<string[]>([]);

  useEffect(() => {
    async function completeAuth() {
      if (!isSupabaseConfigured()) {
        const explained = explainAuthError(
          "ただいまログイン機能の準備中です。しばらくしてからお試しください。"
        );
        setErrorTitle(explained.title);
        setErrorCause(explained.cause);
        setErrorActions(explained.actions);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        const explained = explainAuthError("network");
        setErrorTitle(explained.title);
        setErrorCause(explained.cause);
        setErrorActions(explained.actions);
        return;
      }

      const next = searchParams.get("next") ?? "/mypage";
      const code = searchParams.get("code");
      const oauthError =
        searchParams.get("error_description") || searchParams.get("error");

      if (oauthError) {
        const explained = explainAuthError(decodeURIComponent(oauthError));
        setErrorTitle(explained.title);
        setErrorCause(explained.cause);
        setErrorActions(explained.actions);
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const explained = explainAuthError(exchangeError.message, {
              status: exchangeError.status,
              code: exchangeError.code,
            });
            setErrorTitle(explained.title);
            setErrorCause(explained.cause);
            setErrorActions(explained.actions);
            return;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          const explained = explainAuthError(
            "ログインを完了できませんでした。リンクの有効期限が切れている可能性があります。"
          );
          setErrorTitle(explained.title);
          setErrorCause(explained.cause);
          setErrorActions([
            "マイページに戻り、「LINEでログイン・登録」をもう一度押してください。",
            "やることの進捗は、この端末に残っています。",
          ]);
          return;
        }

        const safeNext = next.startsWith("/") ? next : "/mypage";
        router.replace(safeNext);
      } catch (err) {
        const explained = explainAuthError(
          err instanceof Error ? err.message : "ログイン処理中にエラーが発生しました。"
        );
        setErrorTitle(explained.title);
        setErrorCause(explained.cause);
        setErrorActions(explained.actions);
      }
    }

    void completeAuth();
  }, [router, searchParams]);

  return (
    <>
      <SiteHeader title="ログイン" showBack backHref="/mypage" />
      <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-8">
        {!errorTitle ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="text-center text-base text-muted-foreground" role="status">
              ログインを完了しています…
            </p>
          </>
        ) : (
          <div
            className="w-full max-w-md space-y-4 rounded-xl border-2 border-destructive/40 bg-destructive/5 px-4 py-5"
            role="alert"
          >
            <p className="text-lg font-bold text-destructive">{errorTitle}</p>
            {errorCause && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">考えられる原因</p>
                <p className="text-base leading-relaxed">{errorCause}</p>
              </div>
            )}
            {errorActions.length > 0 && (
              <ul className="space-y-2">
                {errorActions.map((action) => (
                  <li key={action} className="text-base leading-relaxed">
                    · {action}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild className="h-12 w-full">
              <a href="/mypage#mypage-register">LINEでやり直す</a>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full">
              <a href="/mypage">マイページに戻る</a>
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
